/**
 * Users plugin
 * Manages accounts and user dbs
 */

var removeAccount = require('./lib/remove_account');
var passwordReset = require('./lib/password_reset');
var changeUsername = require('./lib/change_username');
var signUp = require('./lib/signup');


module.exports = function (hoodie, callback) {

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
    else if (!signUp.isConfirmed(doc)) {
      signUp(hoodie, doc);
    }
  }

  hoodie.account.on('user:change', userChange);
  hoodie.account.on('user_anonymous:change', userChange);

  hoodie.account.on('$passwordReset:change', function (doc) {
    if (!doc._deleted && !doc.$error) {
      passwordReset(hoodie, doc);
    }
  });

  /**
   * plugin initialization complete
   */

  callback();

};
