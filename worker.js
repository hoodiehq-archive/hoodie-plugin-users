/**
 * Users plugin
 * Manages accounts and user dbs
 */

var async = require('async');
var _ = require('lodash');


module.exports = function (hoodie, callback) {

  /**
   * Adds appropriate roles to user doc to enable user db
   * access and login ability on the frontend
   */

  function confirmUser(doc, callback) {
    var roles = [
      doc.hoodieId,
      'confirmed',
      'hoodie:read:' + userDB(doc),
      'hoodie:write:' + userDB(doc)
    ];
    hoodie.account.update('user', doc.id, {roles: roles}, callback);
  }

  /**
   * Returns user db name for given user doc
   */

  function userDB(doc) {
    return 'user/' + doc.hoodieId;
  }

  /**
   * Create user's personal database and grants them read/write access
   */

  function createUserDB(doc, callback) {
    hoodie.database.add(userDB(doc), callback);
  }

  /**
   * Deletes a users's database when their account is destroyed
   */

  function deleteUserDB(doc, callback) {
    hoodie.database.remove(userDB(doc), callback);
  }

  /**
   * Detects if user has a given role
   */

  var hasRole = _.curry(function (role, doc) {
    return _.contains(doc.roles, role);
  });

  /**
   * Returns true if user is confirmed, false otherwise
   */

  var isConfirmed = hasRole('confirmed');

  /**
   * Event handlers
   */

  hoodie.account.on('user:change', function (doc) {
    if (doc._deleted) {
      deleteUserDB(doc, logErrors('Error deleting user db'));
    }
    else if (!isConfirmed(doc)) {
      async.applyEachSeries(
        [createUserDB, confirmUser], doc, logErrors('Error confirming user')
      );
    }
  });

  /**
   * Logs errors encountered by event handlers
   */

  function logErrors(context) {
    return function (err) {
      if (err) {
        console.error(context + ': %s', err);
        console.error(err);
        return;
      }
    };
  }

  // plugin initialization complete
  callback();

};
