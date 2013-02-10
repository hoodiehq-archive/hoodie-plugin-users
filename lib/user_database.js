var util         = require('util');
var HoodieWorker = require('hoodie-worker');

var UserDatabase = function(databaseName, account, couch) {

  this.name      = databaseName;
  this.hash      = this.name.split('/').pop();
  this.account   = account

  // shortcuts
  this.couch     = couch;

  this.account.on('created', this.create.bind(this))
  this.account.on('deleted', this.drop.bind(this))
};
util.inherits(UserDatabase, HoodieWorker);

//
// when creating a database, we also put the user hash of the new user
// into the database's security object as a reader role, to secure it from
// access through other users
//
UserDatabase.prototype.create = function() {
  this.promisify( this.couch.database(this.name), 'create')()
  .fail( this.handleErrorWithMessage('could not create user db ' + this.name) )
  .then( this.createSecurity.bind(this) );
};


//
// create Security Settings for database
//
UserDatabase.prototype.createSecurity = function() {
  this.log("database " + this.name + " created.");

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

  this.couch.database(this.name).query(options, function(error, response) {
    if(error !== null) {
      // set error in user doc

      this.log("error setting user db security");
      this._handleSignUpError(doc, error);

      return;
    }
    
    this.log("security create result: %j", response);
    this.emit("created")
  }.bind(this));
};


//
// when a user destroys his account, we drop his database as well.
//
UserDatabase.prototype.drop = function() {

  this.log('dropping database %s …', this.name);
  
  // we give it a timeout, so that other workers have a chance
  // to load stuff they need to cleanup.
  setTimeout( function() {
    var destroy = this.promisify(this.couch.database(this.name), 'destroy')
    destroy().then( function() {
        this.log("%s dropped", this.name);
      }.bind( this ),
      this.handleErrorWithMessage("Could not drop %s", this.name)
    )
  }.bind(this), 3000)
};


module.exports = UserDatabase;