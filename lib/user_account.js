var util           = require('util');
var HoodieWorker   = require('hoodie-worker');
var UserDatabase   = require("./user_database.js");
var UsernameChange = require("./username_change.js");

var UserAccount = function(properties, worker) {

  this.setProperties(properties);

  this.worker     = worker;
  this.database   = new UserDatabase(properties.database, this, worker.couch);
  this.hash       = this.database.hash;

  this.on('change', this._handleChange.bind(this));
  this.on('usernamechange', this.handleUsernameChange.bind(this));
  this.database.on('created', this.confirm.bind(this));
};
util.inherits(UserAccount, HoodieWorker);

UserAccount.prototype._handleChange = function(change) {
  var state  = change.doc.$state;

  this.setProperties(change.doc);

  // request for username change?
  // => change username
  if (change.doc.$newUsername) {
    this.emit('usernamechange', change.doc.$newUsername);
    return
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
// 
// 
UserAccount.prototype.save = function() {
  this.log('saving ... %j', this.properties)
  return this._promisifiedSave(this.properties._id, this.properties._rev, this.properties)
  .then( this.setProperties.bind(this));
};


UserAccount.prototype.handleUsernameChange = function(newUsername) {
  var usernameChange = new UsernameChange(this, newUsername)
};


// 
// 
// 
UserAccount.prototype.setProperties = function(properties) {
  this.properties = properties;
  this.name       = properties.name;
}


//
// approve User
//
// set $state to "confirmed" and add two roles: "confirmed" and the ownerHash
//
UserAccount.prototype.confirm = function() {
  this.log('confirming %s ... ', this.name)
  this.properties.$state = "confirmed";
  this.properties.roles  = [this.hash, 'confirmed'];

  this.save().fail( this._handleSignUpError.bind(this) );
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

  return this.rejectWith(error);
};

UserAccount.prototype._promisifiedSave = function () {
  return this.promisify(this.worker.usersDatabase, 'save').apply(null, arguments);
};

module.exports = UserAccount;