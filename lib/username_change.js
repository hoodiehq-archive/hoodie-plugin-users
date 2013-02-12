var clone = require("clone");

// 
// UsernameChange
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
var UsernameChange = function(account, newUsername) {
  this.account       = account;
  this.oldProperties = clone(this.account.properties);
  this.newUsername   = newUsername;
  
  this.process()
};


// 
// process
// =========

// 
UsernameChange.prototype.process = function() {
  this.createNewUsersDoc()
  .then( this.removeOldUsersDoc.bind(this) );
};


// 
// createNewUsersDoc
// ===================

// 
// creates a new _users doc based on the current one.
// 
UsernameChange.prototype.createNewUsersDoc = function() {
  this.account.log("creating new account '" + this.newUsername + "' for " + this.oldProperties.name);

  var newProperties = clone(this.oldProperties);

  newProperties._id  = "org.couchdb.user:user/" + this.newUsername;
  newProperties.name = "user/" + this.newUsername;
  delete newProperties.$newUsername;
  delete newProperties._rev;

  var save = this.account.promisify(this.account.worker.usersDatabase, 'save')
  return save(newProperties._id, newProperties).then( 
    this.handleSaveSuccess.bind(this), 
    this.handleSaveError.bind(this) 
  );
};


// 
// 
// 
UsernameChange.prototype.handleSaveSuccess = function(response) {
  this.account.properties._id  = response.id;
  this.account.properties.name = response.id.replace(/^org.couchdb.user:/, '');
  this.account.name = this.account.properties.name
  this.account.log("Setting account.name of worker to: %s", this.account.name)
  this.account.handleSaveSuccess(response);
};


// 
// 
// 
UsernameChange.prototype.handleSaveError = function(error) {
  this.account.log(error, 'createNewUsersDoc ooops')
  return this.account.reject(error)
};


// 
// 
// 
UsernameChange.prototype.removeOldUsersDoc = function() {
  this.account.log("removing " + this.newUsername + "'s old account: " + this.oldProperties.name);
  this.account.log("with %s %s", this.oldProperties._id, this.oldProperties._rev);

  var remove_ = this.account.worker.promisify( this.account.worker.usersDatabase, 'remove' );
  return remove_( this.oldProperties._id, this.oldProperties._rev).then(
    this.handleRemoveOldUsersDocSuccess.bind(this),
    this.handleRemoveOldUsersDocError.bind(this)
  )
};


// 
// 
// 
UsernameChange.prototype.handleRemoveOldUsersDocSuccess = function() {
  this.account.log(this.newUsername + "'s old account (" + this.oldProperties.name + ") removed.");
};


// 
// 
// 
UsernameChange.prototype.handleRemoveOldUsersDocError = function(error) {
  this.account.log(error, 'removeOldUsersDoc ooops')
  return this.account.reject(error)
};

module.exports = UsernameChange;