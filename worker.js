module.exports = function(hoodie, doneCallback) {

  var userAccount = require('./lib/user_account.js')(hoodie);

  // handle changes in _users
  hoodie.account.on('change:user', userAccount.handleChange)
  hoodie.account.on('change:user_anonymous', userAccount.handleChange)

  // this is how a passwordReset doc looks like (a bit simplified):
  //
  // {
  //   _id: "org.couchdb.user:$passwordReset/joe@example.com/uuid789",
  //   name: "$passwordReset/joe@example.com/uuid789",
  //   type: 'user',
  //   roles: []
  // };
  //
  // 1. check if username exists
  // 2. generate new password
  // 3. update current user object
  // 4. send out new password via email
  // 5. remove $resetPassword object
  //
  function handlePasswordReset(object) {
    console.log('handlePasswordReset!');
  }

  // 1. create new user doc with current property and new username
  // 2. remove old username
  //
  function handleUsernameChange(userObject) {

  }

  doneCallback();
}
