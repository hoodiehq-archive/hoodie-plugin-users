var UserAccount  = require("./user_account.js");
var util         = require('util');
var HoodieWorker = require('hoodie-worker');

function Worker(config)
{ 
  this.setup(config).then( this.launch.bind(this) )
}
util.inherits(Worker, HoodieWorker);


// hash of userAccounts
Worker.prototype.userAccounts = {};

// 
Worker.prototype.launch = function() {
  
  // shortcut for _users database
  this.usersDatabase = this.couch.database("_users");

  // subscribe to changes in _users database
  this.usersDatabase.changes({include_docs:true})
  .on("change", this.handleChange.bind(this))
  .on("error",  this.handleError.bind(this));

  // subscribe to custom events
  this.on()
};


//
// we look for two events: newly created user docs and deleted docs.
// We check the $state attribute, if it's not present yet, we try to
// create the user database. If the change is a deleted doc
// and its $state was 'confirmed', we drop the database.
//
Worker.prototype.handleChange = function(change) {

  if (! this._isValidUserDoc(change.doc)) return;

  var dbName = change.doc.database;
  if (! dbName) return;

  // init a new userAccount unless it's not present yet
  if (! this.userAccounts[dbName]) {
    this.userAccounts[dbName] = new UserAccount(change.doc, this);
    this.userAccounts[dbName].on('deleted', function() {
      delete this.userAccounts[dbName]
    }.bind(this))
  }

  this.userAccounts[dbName].emit('change', change)
};


// 
// PRIVATE
// -------
// 


//
// helpers to check whether a change belongs to a valid user doc.
// We might save temporary invalid user docs when email confirmation
// is enabled.
//
Worker.prototype._isValidUserDoc = function(doc) {
  return doc && doc.name === doc._id.split(":").pop();
};

module.exports = Worker;