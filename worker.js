module.exports = function(hoodie, doneCallback) {

  var userAccount = require('./lib/user_account.js')(hoodie);
  var passwordReset = require('./lib/password_reset.js')(hoodie);

  // handle changes in _users
  hoodie.account.on('change:user', userAccount.handleChange)
  hoodie.account.on('change:user_anonymous', userAccount.handleChange)

  //
  hoodie.account.on('change:$passwordReset', passwordReset.handleChange)


  function handlePasswordReset(object) {
    console.log('handlePasswordReset!');
  }

  doneCallback();
}
