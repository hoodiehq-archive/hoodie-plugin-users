var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var nodemailer   = require("nodemailer");


var PasswordReset = function(properties, worker) {
  this.worker            = worker;
  this.properties        = properties;

  // "org.couchdb.user:$passwordReset/joe/brtbmny" => "org.couchdb.user:user/joe"
  this.userId            = this.properties._id.replace(/(\$passwordReset)/, 'user').replace(/\/\w+$/, '');
  this.emailAddress      = this.userId.split(/:/).pop().replace(/^user\//,'');
  this.name              = "PasswordReset for " + this.emailAddress + " ";

  this.process()
};
util.inherits(PasswordReset, EventEmitter);


// 
// 
// 
PasswordReset.prototype.process = function() {
  this.prepare()
  .then( this.checkIfUserExists.bind(this) )
  .then( this.setUserObject.bind(this) )
  .then( this.generateNewPassword.bind(this) )
  .then( this.updateUserObject.bind(this) )
  .then( this.sendNewPassword.bind(this) )
  .otherwise( this.markDocAsFailed.bind(this) )
  .then( this.cleanupPasswordReset.bind(this) )
}

// 
// 
// 
PasswordReset.prototype.prepare = function() {
  var defer = this.worker.when.defer();

  this.emailConfig       = {};
  if (this.worker.config.app.email) for (var key1 in this.worker.config.app.email) {
    this.emailConfig[key1] = this.worker.config.app.email[key1];
  }
  if (this.worker.config.user.email) for (var key2 in this.worker.config.user.email) {
    this.emailConfig[key2] = this.worker.config.user.email[key2];
  }


  if (! this.emailConfig.transport) {
    this.log("you have to confige email.transport for your app before emails can be send. Check your pocket!");
    defer.reject("sending emails is not yet configured for this app.");
    return defer.promise;
  }


  if ( this.isInvalidEmail(this.emailAddress) ) {
    defer.reject("username (" + this.emailAddress + ") is not a valid email address.");
    return defer.promise;
  }
  

  // set defaults
  if (! this.emailConfig.subject ) this.emailConfig.subject = "Password Reset";
  if (! this.emailConfig.text ) this.emailConfig.text = "Hey there,\n\nyou can now sign in with\n\nemail: {{email}}\npassword: {{password}}";

  defer.resolve();
  return defer.promise;
};


// 
// 
// 
PasswordReset.prototype.checkIfUserExists = function() {
  var get = this.worker.promisify( this.worker.usersDatabase, 'get' );
  return get(this.userId).otherwise( this.handleUserNotFound.bind(this) );
};


// 
// 
// 
PasswordReset.prototype.setUserObject = function(userObject) {
  this.userObject = userObject;
};


// 
// 
// 
PasswordReset.prototype.handleUserNotFound = function(error) {
  return this.worker.when.reject("An account with the email address " + this.emailAddress + " could not be found");
};


// 
// 
// 
PasswordReset.prototype.generateNewPassword = function() {
  delete this.userObject.salt;
  delete this.userObject.password_sha;
  this.newPassword = this._uuid();
  this.userObject.password = this.newPassword;
};


// 
// 
// 
PasswordReset.prototype.updateUserObject = function() {
  this.log('updating user doc with %j', this.userObject)
  var save = this.worker.promisify( this.worker.usersDatabase, 'save' );
  return save(this.userObject._id, this.userObject._rev, this.userObject);
};


// 
// 
// 
PasswordReset.prototype.sendNewPassword = function() {

  var email = {
    from:     this.emailConfig.from,
    to:       this.emailAddress,
    subject:  this.emailConfig.subject,
    text:     this.emailConfig.text
  };

  // parse subject & text
  email.subject = email.subject.replace(/\{\{email\}\}/, this.emailAddress).replace(/\{\{password\}\}/, this.newPassword);
  email.text    = email.text.replace(/\{\{email\}\}/, this.emailAddress).replace(/\{\{password\}\}/, this.newPassword);

  this.smtpTransport = nodemailer.createTransport("SMTP", this.emailConfig.transport);

  // send mail with defined transport object
  var send = this.worker.promisify( this.smtpTransport, 'sendMail' );
  return send(email).otherwise( this.handleSendEmailError.bind(this) );
};

PasswordReset.prototype.handleSendEmailError = function(error) {
  this.log("error sending new password to " + this.emailAddress);
  this.log( error );
  this.log( JSON.stringify(this.emailConfig.transport, '', 2) );
  this.log( JSON.stringify(this.emailConfig.transport, '', 2) );
  this.smtpTransport.close();
  return this.worker.rejectWith("There was an error when we tried to send a new password to " + this.emailAddress);
};

PasswordReset.prototype.cleanupPasswordReset = function() {
  this.log('cleaning up ' + this.properties._id);
  var remove_ = this.worker.promisify( this.worker.usersDatabase, 'remove' );
  return remove_(this.properties._id, this.properties._rev)
  .then( function() {
    this.emit('deleted');
    this.smtpTransport.close();
  }.bind(this));
};



PasswordReset.prototype.markDocAsFailed = function(error) {
  this.log(error);

  this.properties.$error = error;
  this.worker.usersDatabase.save(this.properties._id, this.properties._rev, this.properties, function (error, res) {
    if (error) {
      this.log("Error updating " + this.properties._id);
      this.worker.handleError(error);
      return;
    }

    this.log("Error in " + this.properties._id + ": " + JSON.stringify(this.properties.$error));
  }.bind(this));
};

// 
PasswordReset.prototype.isInvalidEmail = function(email) {
  return ! (/@/).test(email);
};



// 
// 
// 
PasswordReset.prototype.log = function(message) {
  this.worker.log.apply(this, arguments);
};


// 
PasswordReset.prototype._uuid = function() {
  var len, chars, i, radix;

  len   = 5;
  chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
  radix = chars.length;

  return ((function() {
    var _i, _results;
    _results = [];
    for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
      _results.push(chars[0 | Math.random() * radix]);
    }
    return _results;
  })()).join('');
};


module.exports = PasswordReset;