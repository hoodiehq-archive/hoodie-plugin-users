var util         = require('util');
var HoodieWorker = require('hoodie-worker');
var UserDatabase = require("./UserDatabase.js");

var UserAccount = function(properties, worker) {

  this.properties = properties;
  this.name       = properties.name;
  this.worker     = worker;
  this.database   = new UserDatabase(properties.database, this, worker.couch);
  this.hash       = this.database.hash;

  this.on('change', this._handleChange.bind(this));
  this.database.on('created', this.confirm.bind(this));
};
util.inherits(UserAccount, HoodieWorker);

UserAccount.prototype._handleChange = function(change) {
  var state  = change.doc.$state;

  // request for username change?
  // => change username
  if (change.doc.$newUsername) {
    this.changeUsername( change.doc );
  }

  // confirmed user deleted?
  // => drop database
  if ( change.deleted && state === 'confirmed' ) {
    this.emit('deleted');
    return;
  }

  // user without a state?
  // => create database & confirm
  if ( this.name && ! state ) {
    this.emit('created');
    return;
  }
};


// 
// change username
// 
// to change a username, the property $newUsername gets set in _users docs.
// Then a new _users doc gets created for new new username and the old one removed.
// 
UserAccount.prototype.changeUsername = function(currentProperties) {
  var newObject   = clone(currentProperties);
  var newUsername = newObject.$newUsername;
  this.properties = currentProperties;

  delete newObject.$newUsername;
  delete newObject._rev;

  newObject._id  = "org.couchdb.user:user/" + newUsername;
  newObject.name = "user/" + newUsername;

  this.createUserObject(currentObject, newObject).then( function() {
    this.log("new User " + newUsername + " created for " + currentObject.name);
  });
};

UserAccount.prototype.save = function() {
  this.log('saving ... %j', this.properties)
  return this._promisifiedSave(this.properties._id, this.properties._rev, this.properties)
  .then( function(properties) {
    this.properties = properties;
  }.bind(this));
};


// 
// 
// 
UserAccount.prototype.createUserObject = function(currentObject, newObject) {
  this._promisifiedSave(newObject._id, newObject)
  .fail( this.handleErrorWithMessage("Error creating new User " + newUsername + " for " + currentObject.name) )
  .then( function(properties) {
    this.properties = properties;
  }.bind(this));
};


//
// approve User
//
// set $state to "confirmed" and add two roles: "confirmed" and the ownerHash
//
UserAccount.prototype.confirm = function() {
  this.log('confirming ...')
  this.properties.$state = "confirmed";
  this.properties.roles  = [this.hash, 'confirmed'];

  this.save()
  .then( function() {
    console.log(this.name + "confirmed ");
  }.bind(this) )
  .fail( this._handleSignUpError.bind(this) );
};


//
// handle signup errors
//
UserAccount.prototype._handleSignUpError = function(error) {
  this.log("error confirming " + this.name);
  this.handleError(error);
  
  this.properties.$state = "error";
  this.properties.$error = error;
  this.save().fail( this.handleErrorWithMessage("Error while confirming " + this.name + ", but couldn't update _users doc") );
};

UserAccount.prototype._promisifiedSave = function () {
  return this.promisify(this.worker.usersDatabase, 'save').apply(null, arguments);
};

module.exports = UserAccount;