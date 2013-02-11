require('./spec_helper.js');

var when          = require("when");
var PasswordReset = require("./../lib/password_reset.js");
var WorkerMock    = require("./mocks/worker.js");
var nodemailer    = require("nodemailer");

// spyOn(nodemailer, "createTransport").andReturn( jasmine.createSpy('smtpTransport') );

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
    this.pwReset = new PasswordReset(this.passwordResetDoc, WorkerMock)
  });

  describe('constructor', function () {
    it('should set this.worker', function (done) {
      expect(this.pwReset.worker).toEqual(WorkerMock);
    });
    it('should set this.properties', function (done) {
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
          var promise = this.pwReset.prepare()
          expect(promise).toBeResolved();
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
}); // PasswordReset



