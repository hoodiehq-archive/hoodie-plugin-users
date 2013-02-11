var clone = require("clone");

// 
// change username
// 
// to change a username, the property $newUsername gets set in _users docs.
// Then a new _users doc gets created for new new username and the old one removed.
// 
var UsernameChange = function(account, newUsername) {
  this.account       = account;
  this.oldProperties = clone(this.account.properties);
  this.newUsername   = newUsername;
  this.createUserObject().then( this.removeUserObject.bind(this) );
};


// 
// 
// 
UsernameChange.prototype.createUserObject = function() {
  var newProperties = clone(this.account.properties);
  var newUsername   = this.newUsername;

  delete newProperties.$newUsername;
  delete newProperties._rev;

  newProperties._id  = "org.couchdb.user:user/" + newUsername;
  newProperties.name = "user/" + newUsername;

  this.account.log("creating new account '" + this.newUsername + "' for " + this.account.properties.name);

  return this.account._promisifiedSave(newProperties._id, newProperties)
  .then( this.handleSave.bind(this) );
};


// 
// 
// 
UsernameChange.prototype.removeUserObject = function() {
  this.account.log("removing " + this.newUsername + "'s old account: " + this.oldProperties.name);
  this.account.log("with %s %s", this.oldProperties._id, this.oldProperties._rev);

  var remove = this.account.worker.promisify( this.account.worker.usersDatabase.remove );
  return remove( this.oldProperties._id, this.oldProperties._rev)
  // .then( function () { console.log('removeUserObject good')})
  .otherwise( function (error) { console.log('removeUserObject ooops: %j', error)})
};


// 
// 
// 
UsernameChange.prototype.handleSave = function(response) {
  this.account.properties._id  = response.id;
  this.account.properties.name = response.id.replace(/^org.couchdb.user:/, '');
  this.account.name = this.account.properties.name
  this.account.log("Setting account.name of worker to: %s", this.account.name)
  this.account.handleSave(response);
};

module.exports = UsernameChange;