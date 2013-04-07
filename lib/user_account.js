var util           = require('util');
var EventEmitter = require('events').EventEmitter;
var UserDatabase   = require("./user_database.js");
var UsernameChange = require("./username_change.js");

var UserAccount = function(properties, worker) {
  this.setProperties(properties);

  this.worker     = worker;
  this.database   = new UserDatabase(this.name, this, worker);
  this.hash       = this.database.hash;

  this.listenUp()
};
util.inherits(UserAccount, EventEmitter);


// 
// 
// 
UserAccount.prototype.setProperties = function(properties) {
  this.properties = properties;
  this.name       = properties.database;
}


// 
// 
// 
UserAccount.prototype.listenUp = function() {
  this.on('change', this.handleChange.bind(this));
  this.on('usernamechange', this.handleUsernameChange.bind(this));
  this.database.on('created', this.confirm.bind(this));
}


// 
// 
// 
UserAccount.prototype.handleChange = function(change) {
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
UserAccount.prototype.handleUsernameChange = function(newUsername) {
  this.usernameChange = new UsernameChange(this, newUsername)
};


//
// approve User
//
// set $state to "confirmed" and add two roles: "confirmed" and the ownerHash
//
UserAccount.prototype.confirm = function() {
  this.log('confirming %s … ', this.name)
  this.properties.$state = "confirmed";
  this.properties.roles  = [this.hash, 'confirmed'];

  this.save().otherwise( this.handleSignUpError.bind(this) );
};


// 
// 
// 
UserAccount.prototype.save = function() {
  this.log('saving … %j', this.properties)
  var save = this.worker.promisify(this.worker.usersDatabase, 'save');
  return save(this.properties._id, this.properties._rev, this.properties)
  .then( this.handleSaveSuccess.bind(this) );
};


// 
// 
// 
UserAccount.prototype.handleSaveSuccess = function(response) {
  this.properties._rev = response.rev;
}


// 
// handle signup errors
// 
UserAccount.prototype.handleSignUpError = function(error) {
  this.worker.handleError(error, "error confirming " + this.name);
  
  this.properties.$state = "error";
  this.properties.$error = error;
  this.properties.roles = [];
  this.save().otherwise( this.worker.handleErrorWithMessage("Error while confirming " + this.name + ", but couldn't update _users doc") );

  return this.worker.when.reject(error);
};


// 
// 
// 
UserAccount.prototype.log = function(message) {
  message = "[" + this.name + "]\t" + message
  this.worker.log.apply( this.worker, arguments)
}


module.exports = UserAccount;