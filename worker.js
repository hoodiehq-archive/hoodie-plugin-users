module.exports = function (hoodie, doneCallback) {

  var userAccount = require('./lib/user_account.js')(hoodie);
  var passwordReset = require('./lib/password_reset.js')(hoodie);

  // bootstrap existing users
  hoodie.account.findAll(function (accounts) {
    console.log(accounts);
  });

  // handle changes in _users
  hoodie.account.on('change:user', userAccount.handleChange);
  hoodie.account.on('change:user_anonymous', userAccount.handleChange);

  //
  hoodie.account.on('change:$passwordReset', passwordReset.handleChange);


  doneCallback();
};
