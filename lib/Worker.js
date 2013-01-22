var install = require("./install");

function Worker(config)
{ 
  install(this, config).then( this.launch.bind(this) )
}


Worker.prototype = {


  // 
  launch : function() {
    
    // shortcut for _users database
    this.usersDb = this.couch.database("_users");

    // listen to changes in _users database
    this.usersDb.changes({include_docs:true})
    .on("change", this._handleChange.bind(this))
    .on("error",  this._handleError.bind(this));
  },

  //
  // when creating a database, we also put the user_hash of the new user
  // into the database's security object as a reader role, to secure it from
  // access through other users
  //
  _createDatabase : function(doc) {
    var dbName     = doc.database;

    this.couch.database(dbName).create( function(error, response) {
      if(error !== null) {
        // set error in user doc
        console.log("error creating user db.");
        this._handleSignUpError(doc, error);

        return;
      }
      
      console.log("database " + dbName + " created.");
      console.log("db create result: %j", response);
      console.log();

      this._createDatabaseSecuritySetting(doc);
    }.bind(this));
  },


  //
  // create Security Settings for database
  //
  _createDatabaseSecuritySetting : function(doc) {
    var dbName     = doc.database;

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
          roles:[doc.ownerHash]
        }
      }
    };

    this.couch.database(dbName).query(options, function(error, response) {
      if(error !== null) {
        // set error in user doc

        console.log("error setting user db security");
        this._handleSignUpError(doc, error);

        return;
      }
      
      console.log("security create result: %j", response);
      this._approveSignUp(doc);
    }.bind(this));
  },


  //
  // approve User
  //

  // set $state to "confirmed" and add two roles: "confirmed" and the ownerHash hash
  //
  _approveSignUp : function(doc) {
    doc.$state = "confirmed";
    doc.roles = [doc.ownerHash, 'confirmed'];
    this.usersDb.save(doc._id, doc._rev, doc, function(error, response) {
      if(error !== null) {

        // set error in user doc
        console.log("error approving user: " + doc.name);
        this._handleSignUpError(doc, error);

        return;
      }

      console.log("user confirmed " + doc.name);
    }.bind(this));
  },


  //
  // handle signup error
  //
  _handleSignUpError : function(doc, error) {
    console.log(error.error + " " + error.reason);
    
    doc.$state = "error";
    doc.$error = error;
    this.usersDb.save(doc._id, doc._rev, doc, function(error, response) {
      if(error !== null) {

        // set error in user doc
        console.log("couldn't update " + doc.name + " with error: " +error);
        console.log(error.error + " " + error.reason);


        return;
      }
    });
  },


  //
  // when a user destroys his account, we drop his database as well.
  //
  _dropDatabase : function(name) {

    console.log('dropping database %s ...', name);
    
    // we give it a timeout, so that other workers have a chance
    // to load stuff they need to cleanup.
    setTimeout( function() {
      this.couch.database(name).destroy( function(error) {
        if(error !== null) {
          // set error in user doc
          
          console.log("error deleting user db");
          console.log( JSON.stringify(error, "", 2) );
          
          return;
        }
        
        console.log("database killed");
      });
    }.bind(this), 3000)
  },


  // 
  // helper for nicer logging
  // 
  log: function(message) {
    message = "[" + this.name + "Worker] " + message;
    console.log.apply(null, arguments)
  },


  // 
  // PRIVATE
  // -------
  // 


  //
  // helpers to check whether a change belongs to a valid user doc.
  // We might save temporary invalid user docs when email confirmation
  // is enabled.
  //
  _isValidUserDocId : function(id) {
    return id && id.indexOf('org.couchdb.user:') === 0;
  },
  _isValidUserDoc : function(doc) {
    return doc && doc.name === doc._id.split(":").pop();
  },

  //
  // we look for two events: newly created user docs and deleted docs.
  // We check the $state attribute, if it's not present yet, we try to
  // create the user database. If the change is a deleted doc
  // and its $state was 'confirmed', we drop the database.
  //
  _handleChange : function(change) {
    var dbName, state;

    if (! this._isValidUserDocId(change.id))
      return;

    if (! change.doc.database)
      return;

    state = change.doc.$state;

    if ( change.deleted && state === 'confirmed' ) {
      this._dropDatabase( change.doc.database );
      return;
    }

    if ( change.doc.database && this._isValidUserDoc(change.doc) && ! state ) {
      this._createDatabase(change.doc);
    }
  },

  //
  // report errors nicely
  //
  _handleError : function(error) {
    this.log("error: %j", error);
  }
}

module.exports = Worker;