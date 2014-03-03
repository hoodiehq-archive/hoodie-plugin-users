//
// username changes
// ================

// to trigger a username change, the _users doc
// gets updated with a `$newUsername` property.
// That triggers a new UsernameChange for that account.
//
// UsernameChange does two things.
//
// 1. creates a new _users doc with the desired username
// 2. removes the old _users doc
//

var clone = require('clone');

module.exports = function (hoodie) {

  function handleUsernameChange (oldUserObject) {
    var newUserObject = buildNewUserObjct(oldUserObject);

    createNewUserObject( newUserObject, function(error) {
      if (error) {
        console.log('could not create new user object for %s', newUserObject.id)
        console.log(newUserObject);
        return error
      }

      removeOldUserObject(oldUserObject, function(error) {
        if (error) {
          console.log('could not remove old user object for %s', newUserObject.id)
          console.log(oldUserObject)
          console.log(error);
          return error;
        }
      });
    })
  }

  //
  //
  //
  function buildNewUserObjct (userObject) {
    var newUserObject = clone(userObject);
    var newUsername = newUserObject.$newUsername;

    newUserObject.id  = newUsername
    newUserObject.name = "user/" + newUsername;

    delete newUserObject._rev;
    delete newUserObject.$newUsername;

    return newUserObject;
  }

  //
  //
  //
  function createNewUserObject (newUserObject, callback) {
    hoodie.account.add('user', newUserObject, callback)
  }

  //
  //
  //
  function removeOldUserObject (oldUserObject, callback) {
    var userType = oldUserObject.type;
    hoodie.account.remove(userType, oldUserObject.id, callback);
  }

  return handleUsernameChange
}
