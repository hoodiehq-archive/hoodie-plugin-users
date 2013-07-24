
// //
// //
// //
// UserAccount.prototype.handleChange = function(change) {
//   var state  = change.doc.$state;

//   this.setProperties(change.doc);

//   // request for username change?
//   // => change username
//   if (change.doc.$newUsername) {
//     this.emit('usernamechange', change.doc.$newUsername);
//     return
//   }

//   // confirmed user deleted?
//   // => drop database
//   if ( change.deleted && state === 'confirmed' ) {
//     this.emit('deleted');
//     return;
//   }

//   // user without a state?
//   // => create database & confirm
//   if ( this.name && ! state ) {
//     this.emit('created');
//     return;
//   }
// };


// //
// // approve User
// //
// // set $state to "confirmed" and add two roles: "confirmed" and the ownerHash
// //
// UserAccount.prototype.confirm = function() {
//   this.log('confirming %s … ', this.name)
//   this.properties.$state = "confirmed";
//   this.properties.roles  = [this.hash, 'confirmed'];

//   this.save().otherwise( this.handleSignUpError.bind(this) );
// };


// //
// //
// //
// UserAccount.prototype.save = function() {
//   this.log('saving … %j', this.properties)
//   var save = this.worker.promisify(this.worker.usersDatabase, 'save');
//   return save(this.properties._id, this.properties._rev, this.properties)
//   .then( this.handleSaveSuccess.bind(this) );
// };


// //
// //
// //
// UserAccount.prototype.handleSaveSuccess = function(response) {
//   this.properties._rev = response.rev;
// }


// //
// // handle signup errors
// //
// UserAccount.prototype.handleSignUpError = function(error) {
//   this.worker.handleError(error, "error confirming " + this.name);

//   this.properties.$state = "error";
//   this.properties.$error = error;
//   this.properties.roles = [];
//   this.save().otherwise( this.worker.handleErrorWithMessage("Error while confirming " + this.name + ", but couldn't update _users doc") );

//   return this.worker.when.reject(error);
// };








//
//
//
function handleChange (object) {
  if (object.$newUsername) {
    console.log('username change!');
    return
  }

  if (object.$error) {
    console.log('user has $error. Ignoring!');
    return
  }

  if (object.roles.length === 0) {
    console.log('handle new user!');
    handleNewUser(object)
    return
  }

  if (object._deleted) {
    console.log('handle user destroy');
    return
  }

  console.log('handle user update');
}


// 1. create database
// 2. grant access
// 3. confirm user
//
function handleNewUser (userObject) {

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




module.exports = {
  isUserAccount : function(object) {
    return !! object.database;

    // the `database` property might be dropped soon.
    // We should rather check against object.name, but
    // it's currently blocked due to https://github.com/hoodiehq/hoodie-plugins-api/issues/8
    // return /^user(_anonymous)\//.test(object.name)
  },

  handleChange : handleChange
}