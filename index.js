/**
 * Users plugin
 * Manages accounts and user dbs
 */

var removeAccount = require('./lib/remove_account');
var passwordReset = require('./lib/password_reset');
var signUp = require('./lib/signup');


module.exports = function (hoodie, callback) {

  /**
   * Event handlers
   */

  hoodie.account.on('user:change', function (doc) {
    if (doc._deleted) {
      removeAccount(hoodie, doc);
    }
    else if (!signUp.isConfirmed(doc)) {
      signUp(hoodie, doc);
    }
  });

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
