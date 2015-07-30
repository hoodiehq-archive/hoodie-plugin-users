/**
 * Users plugin
 * Manages accounts and user dbs
 */

var removeAccount = require('./lib/remove_account');
var passwordReset = require('./lib/password_reset');
var changeUsername = require('./lib/change_username');
var signUp = require('./lib/signup');
var utils = require('./lib/utils');
var async = require('async');

var sources = [];

module.exports = function (hoodie, callback) {

  /**
  * Adds a database to the pool of task event sources
  * Makes sure it only happens once per database
  * Maybe move the dedupe logic to hoodie-plugins-manager
  */
  var addSource = function addSource(doc) {
    var dbName = utils.userDB(doc);

    if(sources.indexOf(dbName) === -1) {
      // not a source yet
      hoodie.task.addSource(dbName);
      sources.push(dbName);
    }
  };

  /**
   * Event handlers
   */
  function userChange(doc) {
    if (doc.$error) {
      // don't do any further processing to user docs with $error
      return;
    }
    else if (doc._deleted && !doc.$newUsername) {
      removeAccount(hoodie, doc);
    }
    else if (doc.$newUsername) {
      changeUsername(hoodie, doc);
    }
    else if (!signUp.isConfirmed(doc) && !signUp.isUnconfirmed(doc)) {
      signUp(hoodie, doc);
    } else {
      addSource(doc);
    }
  }

  /**
   * Loops through all user accounts and runs them through
   * the new user procedure. For most users that will mean
   * that their user database will be added as a listener
   * to the event system.
   */
  function handleExistingUsers (hoodie, done) {
    // bootstrap existing users
    hoodie.account.findAll(function (error, accounts) {
      if (error) {
        console.log('hoodie-plugin-users: can’t bootstrap existing accounts');
        return done(error);
      } else {
        accounts.forEach(userChange);
        done();
      }
    });
  }


  hoodie.account.on('user:change', userChange);
  hoodie.account.on('user_anonymous:change', userChange);

  hoodie.account.on('$passwordReset:change', function (doc) {
    if (!doc._deleted && !doc.$error) {
      passwordReset(hoodie, doc);
    }
  });

  async.applyEachSeries([
    exports.create_user_index,
    exports.create_user_index_by_created_at
  ], hoodie, function(error) {
    if(error){
      return callback(error);
    } else {
      /**
       * plugin initialization complete
       */
      handleExistingUsers(hoodie, callback);
    }
  });

  /**
   * plugin initialization complete
   */
  //handleExistingUsers(hoodie, callback);

};

// create /_users/_design/hoodie%2fplugin%2fusers
// with _view/by-name
exports.create_user_index = function create_user_index(hoodie, callback) {
  var users_db = hoodie.database('_users');
  var index_name = 'users-by-name';

  var mapReduce = {
    /* jshint ignore:start */
    map: function (doc) {
      var name = doc.name.split('/')[1];
      var state;
      if(doc.roles.indexOf('error') !== -1){
        state = 'error';
      } else {
        state = doc.roles.indexOf('confirmed') === -1 ? 'unconfirmed' : 'confirmed';
      }

      var result = {
        id: doc.id,
        name: name,
        createdAt: doc.createdAt,
        state: state
      }
      emit(name, result);
    }
    /* jshint ignore:end */
  };
  users_db.addIndex(index_name, mapReduce, callback);
};

// create /_users/_design/hoodie%2fplugin%2fusers
// with _view/by-created-at
exports.create_user_index_by_created_at = function create_user_index_by_created_at(hoodie, callback) {
  var users_db = hoodie.database('_users');
  var index_name = 'users-by-created-at';

  var mapReduce = {
    /* jshint ignore:start */
    map: function (doc) {
      var name = doc.name.split('/')[1];
      var state;
      if(doc.roles.indexOf('error') !== -1){
         state = 'error';
      } else {
         state = doc.roles.indexOf('confirmed') === -1 ? 'unconfirmed' : 'confirmed';
      }

      var result = {
        id: doc.id,
        name: name,
        createdAt: doc.createdAt,
        state: state
      }
      emit(doc.createdAt, result);
    }
    /* jshint ignore:end */
  };
  users_db.addIndex(index_name, mapReduce, callback);
};
