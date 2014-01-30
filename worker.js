module.exports = function (hoodie, doneCallback) {

  var userAccount = require('./lib/user_account.js')(hoodie);
  var passwordReset = require('./lib/password_reset.js')(hoodie);

  // bootstrap existing users
  hoodie.account.findAll(function (error, accounts) {
    accounts.forEach(userAccount.handleChange);
    doneCallback();
  });

  // handle changes in _users
  hoodie.account.on('user:change', userAccount.handleChange);
  hoodie.account.on('user_anonymous:change', userAccount.handleChange);

  //
  hoodie.account.on('$passwordReset:change', passwordReset.handleChange);
};
