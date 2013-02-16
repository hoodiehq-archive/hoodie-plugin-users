require('./spec_helper.js');

var when           = require("when");
var PasswordReset  = require("./../lib/password_reset.js");
var WorkerMock     = require("./mocks/worker.js");
var nodemailerMock = require("./mocks/nodemailer.js");

describe('PasswordReset', function () {
  beforeEach(function () {
    this.passwordResetDoc = {
       "_id": "org.couchdb.user:$passwordReset/joe@example.com/hash",
       "_rev": "1-8d7d6e48c73ef2b311fcdfcdd2a8bf11",
       "name": "$passwordReset/joe@example.com/hash",
       "type": "user"
    }

    spyOn(PasswordReset.prototype, 'process')
    spyOn(PasswordReset.prototype, 'log')
    spyOn(PasswordReset.prototype, '_uuid').andReturn('uuid');
    this.pwReset = new PasswordReset(this.passwordResetDoc, WorkerMock)
  });

  describe('constructor', function () {
    it('should set this.worker', function () {
      expect(this.pwReset.worker).toEqual(WorkerMock);
    });
    it('should set this.properties', function () {
      expect(this.pwReset.properties).toEqual(this.passwordResetDoc);
    });
    it("should set userId", function() {
      expect(this.pwReset.userId).toEqual('org.couchdb.user:user/joe@example.com');
    });
    it("should set emailAddress", function() {
      expect(this.pwReset.emailAddress).toEqual('joe@example.com');
    });
    
    it("should #process()", function() {
      expect(this.pwReset.process).wasCalled();
    });
  }); // constructor

  describe('#process()', function () {
    beforeEach(function() {

      this.prepareDefer = when.defer();
      this.checkIfUserExistsDefer = when.defer();
      this.setUserObjectDefer = when.defer();
      this.generateNewPasswordDefer = when.defer();
      this.updateUserObjectDefer = when.defer();
      this.sendNewPasswordDefer = when.defer();
      this.cleanupPasswordResetDefer = when.defer();
      this.markDocAsFailedDefer = when.defer();

      spyOn(this.pwReset, 'prepare').andReturn( this.prepareDefer )
      spyOn(this.pwReset, 'checkIfUserExists').andReturn( this.checkIfUserExistsDefer )
      spyOn(this.pwReset, 'setUserObject').andReturn( this.setUserObjectDefer )
      spyOn(this.pwReset, 'generateNewPassword').andReturn( this.generateNewPasswordDefer )
      spyOn(this.pwReset, 'updateUserObject').andReturn( this.updateUserObjectDefer )
      spyOn(this.pwReset, 'sendNewPassword').andReturn( this.sendNewPasswordDefer )
      spyOn(this.pwReset, 'cleanupPasswordReset').andReturn( this.cleanupPasswordResetDefer )
      spyOn(this.pwReset, 'markDocAsFailed').andReturn( this.markDocAsFailedDefer )

      this.pwReset.process.andCallThrough()
      this.pwReset.process()
    });
    
    _when('#prepare() succeeds', function () {
      beforeEach(function() {
        this.prepareDefer.resolve()
      });
      it("should #checkIfUserExists()", function() {
        expect(this.pwReset.checkIfUserExists).wasCalled();
      });

      _and('#checkIfUserExists() succeeds', function () {
        beforeEach(function() {
          this.checkIfUserExistsDefer.resolve()
        });
        it("should #setUserObject()", function() {
          expect(this.pwReset.setUserObject).wasCalled();
        });

        _and('#setUserObject() succeeds', function () {
          beforeEach(function() {
            this.setUserObjectDefer.resolve()
          });
          it("should #generateNewPassword()", function() {
            expect(this.pwReset.generateNewPassword).wasCalled();
          });
          
          _and('#generateNewPassword() succeeds', function () {
            beforeEach(function() {
              this.generateNewPasswordDefer.resolve()
            });
            it("should #updateUserObject()", function() {
              expect(this.pwReset.updateUserObject).wasCalled();
            });

            _and('#updateUserObject() succeeds', function () {
              beforeEach(function() {
                this.updateUserObjectDefer.resolve()
              });
              it("should #sendNewPassword()", function() {
                expect(this.pwReset.sendNewPassword).wasCalled();
              });
              
              _and('#sendNewPassword() succeeds', function () {
                beforeEach(function() {
                  this.sendNewPasswordDefer.resolve()
                });
                it("should #cleanupPasswordReset()", function() {
                  expect(this.pwReset.cleanupPasswordReset).wasCalled();
                });
              });   

              doesMarkDocAsFailedWhenWhatFails('sendNewPassword')
            });    
            doesMarkDocAsFailedWhenWhatFails('updateUserObject')
          });
          doesMarkDocAsFailedWhenWhatFails('generateNewPassword')
        });
        doesMarkDocAsFailedWhenWhatFails('setUserObject')
      });
      doesMarkDocAsFailedWhenWhatFails('checkIfUserExists')
    });
    
    function doesMarkDocAsFailedWhenWhatFails(what) {
      _but('#'+what+'() fails', function () {
        beforeEach(function() {
          this[what+'Defer'].reject()
        });
        it("should #markDocAsFailed()", function() {
          expect(this.pwReset.markDocAsFailed).wasCalled();
        });
        
      });
    }
    doesMarkDocAsFailedWhenWhatFails('prepare')
  }); // #process()

  describe('#prepare()', function () {
    _when('email transport is not configured', function () {
      beforeEach(function() {
        this.pwReset.worker.config.app  = {}
        this.pwReset.worker.config.user = {}
        this.promise = this.pwReset.prepare()
      });

      it('should reject with an error', function () {
        expect(this.promise).toBeRejectedWith('sending emails is not yet configured for this app.');
      });
    });

    _when('email transport is configured by app admin', function () {
      beforeEach(function() {
        this.pwReset.worker.config.app  = {}
        this.pwReset.worker.config.user = {
          "email": {
              "transport": {
                  "service": "GMAIL",
                  "auth": {
                      "user": "g@minutes.io",
                      "pass": "funkyfresh"
                  }
              }
          }
        }
      });

      _but('email address is invalid', function () {
        beforeEach(function() {
          this.pwReset.emailAddress = 'invalid'
        });

        it('should reject with an error', function () {
          this.promise = this.pwReset.prepare()
          expect(this.promise).toBeRejectedWith('username (invalid) is not a valid email address.');
        });
      });
      
      _and('email is valid', function() {
        beforeEach(function() {
          this.pwReset.emailAddress = 'joe@example.com'
        });

        it("should default subject to 'Password Reset'", function() {
          this.pwReset.prepare()
          expect(this.pwReset.emailConfig.subject).toEqual('Password Reset');
        });

        it("should default text to 'Password Reset'", function() {
          this.pwReset.prepare()
          expect(this.pwReset.emailConfig.text).toEqual('Hey there,\n\nyou can now sign in with\n\nemail: {{email}}\npassword: {{password}}');
        });

        it("should resolve", function() {
          this.promise = this.pwReset.prepare()
          expect(this.promise).toBeResolved();
        });

        _and('subject or text has been configured by user configured', function () {
          beforeEach(function() {
            this.pwReset.worker.config.user = {
              "email": {
                  "subject": "Wanna Banana?",
                  "text": "Banana Banana!"
              }
            }
          });
          it("should set subject from configuration", function() {
            this.pwReset.prepare()
            expect(this.pwReset.emailConfig.subject).toEqual('Wanna Banana?');
          });
          it("should set text from configuration", function() {
            this.pwReset.prepare()
            expect(this.pwReset.emailConfig.text).toEqual('Banana Banana!');
          });
        });        
      });
    });
  });

  describe('#checkIfUserExists()', function () {
    beforeEach(function () {
      spyOn(this.pwReset, "handleUserNotFound");
      this.promise = this.pwReset.checkIfUserExists()
    });
    it('should load userId from couch', function () {
      expect(this.pwReset.worker.usersDatabase.get).wasCalledWithArgs('org.couchdb.user:user/joe@example.com');
    });

    _when('user could be found', function () {
      beforeEach(function() {
        var cb = this.pwReset.worker.usersDatabase.get.mostRecentCall.args[1];
        cb( null, 'w00t')
      });
      it('should resolve', function () {
        expect(this.promise).toBeResolvedWith('w00t');
      });
    });

    _when('user cannot be found', function () {
      beforeEach(function() {
        var cb = this.pwReset.worker.usersDatabase.get.mostRecentCall.args[1];
        cb( 'ooops')
      });
      it('should #handleUserNotFound()', function () {
        expect(this.pwReset.handleUserNotFound).wasCalledWith( new Error('ooops') );
      });
    });
  }); // #checkIfUserExists()

  describe('#setUserObject(userObject)', function () {
    it('should set this.userObject?', function () {
      expect(this.pwReset.userObject).toBeUndefined();
      this.pwReset.setUserObject( 'banana' )
      expect(this.pwReset.userObject).toBe('banana');
    });
  }); // #setUserObject(userObject)

  describe('#handleUserNotFound(error)', function () {
    it('should reject with error message', function () {
      this.promise = this.pwReset.handleUserNotFound( {} )
      expect(this.promise).toBeRejectedWith( "An account with the email address joe@example.com could not be found" );
    });
  }); // #handleUserNotFound(error)

  describe('#generateNewPassword()', function () {
    beforeEach(function() {
      this.pwReset.userObject = {
        salt : 'salt',
        password_sha : 'password_sha'
      }
      this.pwReset.generateNewPassword()
    });
    it('should remove salt and password_sha from userObject?', function () {
      expect(this.pwReset.userObject.salt).toBeUndefined();
      expect(this.pwReset.userObject.password_sha).toBeUndefined();
    });
    it("should generate new password", function() {
      expect(this.pwReset.newPassword).toEqual('uuid');
      expect(this.pwReset.userObject.password).toEqual('uuid');
    });
  }); // #generateNewPassword()

  describe('#updateUserObject()', function () {
    beforeEach(function () {
      this.pwReset.userObject = {
        _id : '_id', 
        _rev : '_rev'
      }
      this.promise = this.pwReset.updateUserObject()
      this.callback = this.pwReset.worker.usersDatabase.save.mostRecentCall.args[3];
    });
    it('should update user doc', function () {
      expect(this.pwReset.worker.usersDatabase.save).wasCalledWithArgs('_id', '_rev', this.pwReset.userObject);
    });

    _when('update succeeds', function () {
      beforeEach(function() { 
        this.callback( null, 'w00t')
      });
      it('should resolve', function () {
        expect(this.promise).toBeResolvedWith('w00t');
      });
    });

    _when('user cannot be found', function () {
      beforeEach(function() {
        this.callback( 'ooops')
      });
      it('should reject', function () {
        expect(this.promise).toBeRejectedWith( new Error('ooops') )
      });
    });
  }); // #updateUserObject()

  describe('#sendNewPassword()', function () {
    beforeEach(function() {
      spyOn(this.pwReset, "handleSendEmailError")

      this.pwReset.emailAddress = 'joe@example.com'
      this.pwReset.newPassword  = 'secret'
      this.pwReset.emailConfig = {
        transport : 'transportConfig',
        from : "password-reset@example.com",
        subject : "ohay {{email}}",
        text : "email: {{email}}, password: {{password}}"
      }

      this.promise  = this.pwReset.sendNewPassword()
      this.callback = nodemailerMock.transportMock.sendMail.mostRecentCall.args[1]
    });
    it('should create an email transport object', function () {
      expect(nodemailerMock.createTransport).wasCalledWith('SMTP', 'transportConfig');
    });
    it("should send the mail", function() {
      expect(nodemailerMock.transportMock.sendMail).wasCalledWithArgs({
        from : "password-reset@example.com",
        to : 'joe@example.com',
        subject : "ohay joe@example.com",
        text : "email: joe@example.com, password: secret"
      });
    });

    it("should return a promise", function() {
      expect(this.promise).toBePromise();
    });

    _when('sending email succeeds', function () {
      beforeEach(function() {
        this.callback( null, 'woot')
      });
      it('should resolve', function () {
        expect(this.promise).toBeResolvedWith('woot');
      });
    });

    _when('sending email fails', function () {
      beforeEach(function() {
        this.callback( 'ooops')
      });
      it('should #handleSendEmailError()', function () {
        expect(this.pwReset.handleSendEmailError).wasCalledWith( new Error('ooops') )
      });
    });
  }); // #sendNewPassword()

  describe('#cleanupPasswordReset()', function () {
    beforeEach(function() {
      this.pwReset.smtpTransport = nodemailerMock.transportMock
      spyOn(this.pwReset, "emit");
      this.promise  = this.pwReset.cleanupPasswordReset()
      this.callback = this.pwReset.worker.usersDatabase.remove.mostRecentCall.args[2];
    });
    it('should remove password reset doc from _users', function () {
      var id  = "org.couchdb.user:$passwordReset/joe@example.com/hash";
      var rev = "1-8d7d6e48c73ef2b311fcdfcdd2a8bf11";
      expect(this.pwReset.worker.usersDatabase.remove).wasCalledWithArgs(id, rev);
    });

    _when('cleanup succeeds', function () {
      beforeEach(function() {
        this.callback( null, 'w00t' )
      });
      it('should emit `deleted` event', function () {
        expect(this.pwReset.emit).wasCalledWith('deleted')
      });
      it('should close smtp transport connection', function () {
        expect(this.pwReset.smtpTransport.close).wasCalled()
      });
      it('should resolve', function () {
        expect(this.promise).toBeResolved()
      });
    });

    _when('cleanup fails', function () {
      beforeEach(function() {
        this.callback( 'ooops' )
      });
      it('should reject', function () {
        expect(this.promise).toBeRejectedWith( new Error('ooops') )
      });
    });
  });

  describe('#markDocAsFailed', function () {
    beforeEach(function() {
      this.pwReset.markDocAsFailed( 'banana' )
      this.callback = this.pwReset.worker.usersDatabase.save.mostRecentCall.args[3]
    });
    it('should add $error to properties', function () {
      expect(this.pwReset.properties.$error).toEqual('banana');
    });
    it('should update the document in _users', function () {
      var id  = "org.couchdb.user:$passwordReset/joe@example.com/hash";
      var rev = "1-8d7d6e48c73ef2b311fcdfcdd2a8bf11";
      var doc = this.passwordResetDoc
      expect(this.pwReset.worker.usersDatabase.save).wasCalledWithArgs(id, rev, doc);
    });

    _when('updating doc in _users succeeds', function () {
      beforeEach(function() {
        this.callback( null, 'w00t' )
      });
      // it just logs atm
    });

    _when('updating doc in _users fails', function () {
      beforeEach(function() {
        this.callback( 'ooops' )
      });
      it('should handle the error', function () {
        expect(this.pwReset.worker.handleError).wasCalledWith( 'ooops' )
      });
    });
  }); // #markDocAsFailed
}); // PasswordReset



