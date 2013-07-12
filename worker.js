// var newUserAccountHandler = require('lib/')

module.exports = function(hoodie, doneCallback) {

  return // until @caolan gets all the API done

  // handle new users (signups or )
  hoodie.account.on('add:user', handleNewUser)
  hoodie.account.on('add:anonymous_user', handleNewUser)

  // handle user account changes
  hoodie.account.on('update:user', handleUserUpdate)
  hoodie.account.on('update:anonymous_user', handleUserUpdate)

  // handle user account destroys
  hoodie.account.on('remove:user', handleUserDestroy)
  hoodie.account.on('remove:anonymous_user', handleUserDestroy)

  // handle password resets
  hoodie.account.on('add:$passwordReset', handlePasswordReset)


  // 1. create database
  // 2. grant access
  // 3. confirm user
  //
  function handleNewUser (userObject) {
    newUserAccountHandler.process(hoodie, userObject)

    var type = /^user\//.test(userObject.name) ? 'user' : 'anonymous_user';
    var dbName = 'user/' + userObject.ownerHash;

    // for now, we confirm new user / anonymous_user accounts right away.
    // We plan to add settings for that though.
    hoodie.database.add(dbName, function(error) {
      if (error) {
        return handleUserError(type, userObject, error);
      }

      hoodie.database.grantReadAccess(type, userObject.ownerHash, function(error) {
        if(error) {
          return handleUserError(type, userObject, error);
        }

        confirmUser(type, userObject, function(error) {
          if(error) {
            return handleUserError(type, userObject, error);
          }
        });
      })
    });
  }

  function handleUserError(type, userObject, error) {
    hoodie.account.update(type, userObject.ownerHash, {$state: "error", error: error});
  }

  function confirmUser(type, userObject, callback) {
    var roles = [userObject.ownerHash, 'confirmed'];
    var update = {roles: roles, $state: "confirmed"};
    hoodie.account.update(type, userObject.ownerHash, {roles: roles}, callback);
  }

  function handleUserDestroy(userObject) {

  }

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

  }

  //
  function handleUserUpdate(userObject) {
    if (userObject.$newUsername) {
      handleUsernameChange(userObject)
    }
  }

  // 1. create new user doc with current property and new username
  // 2. remove old username
  //
  function handleUsernameChange(userObject) {

  }

  doneCallback();
}
