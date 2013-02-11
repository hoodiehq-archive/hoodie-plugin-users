var util         = require('util');
var HoodieWorker = require('hoodie-worker');

var UserDatabase = function(databaseName, account, couch) {

  this.name      = databaseName;
  this.hash      = this.name.split('/').pop();
  this.account   = account
  this.couch     = couch;

  this.listenUp()
};
util.inherits(UserDatabase, HoodieWorker);


// 
// 
// 
UserDatabase.prototype.listenUp = function() {
  this.account.on('created', this.create.bind(this))
  this.account.on('deleted', this.drop.bind(this))
};


//
// when creating a database, we also put the user hash of the new user
// into the database's security object as a reader role, to secure it from
// access through other users
//
UserDatabase.prototype.create = function() {
  var create = this.promisify( this.couch.database(this.name), 'create' )

  create()
  .then( this.handleCreateSuccess.bind(this) )
  .otherwise( this.handleErrorWithMessage('could not create user db ' + this.name) )
  .then( this.createSecurity.bind(this) )
};


//
// create Security Settings for database
//
UserDatabase.prototype.handleCreateSuccess = function() {
  this.log("database " + this.name + " created.");
}

//
// create Security Settings for database
//
UserDatabase.prototype.createSecurity = function() {
  var query = this.promisify(this.couch.database(this.name), 'query')
  var options = {
    path   : '_security',
    method : 'PUT',
    json   : {
      admins: {
        names: [],
        roles: []
      },
      members: {
        names:[],
        roles:[this.hash]
      }
    }
  };

  return query(options)
  .then( this.handleCreateSecuritySuccess.bind(this) )
  .otherwise( this.handleErrorWithMessage('could not create _security for user db ' + this.name) );
};


// 
// 
// 
UserDatabase.prototype.handleCreateSecuritySuccess = function() {
  this.log("security created");
  this.emit("created")
}


//
// when a user destroys his account, we drop his database as well.
//
// NOTE:
// we give it a timeout, so that other workers have a chance
// to load stuff they need to cleanup.
// 
// TODO: rethink that.
// 
UserDatabase.prototype.drop = function() {
  this.log('dropping database %s …', this.name);
  setTimeout( this._drop.bind(this), 3000)
};


//
// 
//
UserDatabase.prototype._drop = function() {
  var destroy = this.promisify(this.couch.database(this.name), 'destroy' )
  
  destroy()
  .then( this.handleDropSuccess.bind( this ) )
  .otherwise( this.handleDropError.bind( this ) )
}


//
// 
//
UserDatabase.prototype.handleDropSuccess = function() {
  this.log("%s dropped", this.name);
}


//
//
//
UserDatabase.prototype.handleDropError = function() {
  this.handleError(error, "Could not drop " + this.name) 
}


module.exports = UserDatabase;