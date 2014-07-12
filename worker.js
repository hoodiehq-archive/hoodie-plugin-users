/**
 * Users plugin
 * Manages accounts and user dbs
 */

var async = require('async');
var base58 = require('bs58');
var crypto = require('crypto');
var util = require('util');
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

  function generatePassword(callback) {
    crypto.randomBytes(10, function (err, buf) {
      return callback(err, !err && base58.encode(buf));
    });
  }

  var setPassword = _.curry(function (doc, password, callback) {
    hoodie.account.update('user', doc.id, {password: password}, callback);
  });

  var sendPassword = function (doc, recipient, password, callback) {
    var app_name = hoodie.config.get('app_name');
    var sender = hoodie.config.get('email_from');
    var email = {
      to: recipient,
      from: sender,
      subject: '[' + app_name + '] New password' ,
      text: 'Hey there,\n' +
            '\n' +
            'You can now sign in to your ' + app_name + ' account using:\n' +
            '\n' +
            'username: ' + username + '\n' +
            'password: ' + password + '\n' +
            '\n' +
            'Best,\n' + app_name + ' Team'
    };
    hoodie.sendEmail(email, function (err) {
      if (err) {
        return hoodie.account.update('$passwordReset', doc.id, {
          $error: {message: 'Failed to send password reset email'}
        }, callback)
      }
      // all done
      return callback();
    });
  };

  function removeResetPassword(doc, callback) {
    hoodie.account.remove('$passwordReset', doc.id, callback);
  }

  // TODO: unit tests for this
  function getUserEmail(doc) {
    if (doc.email) {
      // use explicit email property, if present
      return doc.email;
    }
    else if (/@/.test(doc.id)) {
      // if the user id looks like an email address, use that
      return doc.id;
    }
    // otherwise, return null
    return null;
  }

  function passwordReset(doc, callback) {
    var parts = doc.name.split('/');
    var name = parts[1];
    var id =  name + '/' + parts[2];

    hoodie.account.find('user', name, function (err, user) {
      if (err) {
        hoodie.account.update('$passwordReset', id, {
          $error: {
            error: 'not_found',
            message: util.format('user %s could not be found', name)
          }
        },
        callback);
      }
      else {
        // do the password reset
        var email = getUserEmail(doc);
        if (!email) {
          // no email address for this user
          return hoodie.account.update('$passwordReset', doc.id, {
            $error: {message: 'No email address found for ' + doc.id}
          }, callback)
        }
        generatePassword(function (err, password) {
          if (err) {
            return callback(err);
          }
          async.series([
            setPassword.bind(null, doc, password),
            sendPassword.bind(null, doc, email, password),
            removeResetPassword.bind(null, doc)
          ],
          callback);
        });
      }
    });
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
    console.log(['user:change', doc]);
    if (doc._deleted) {
      deleteUserDB(doc, logErrors('Error deleting user db'));
    }
    else if (!isConfirmed(doc)) {
      async.applyEachSeries(
        [createUserDB, confirmUser], doc, logErrors('Error confirming user')
      );
    }
  });

  hoodie.account.on('$passwordReset:change', function (doc) {
    console.log(['$passwordReset:change', doc]);
    if (!doc._deleted && !doc.$error) {
      passwordReset(doc, logErrors('Error resetting password'));
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
