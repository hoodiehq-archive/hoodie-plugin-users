require('./spec_helper.js');
var when = require("when");

var UserAccountMock = {
  on : jasmine.createSpy(),
  emit : jasmine.createSpy(),
}
var PasswordResetMock = {
  on : jasmine.createSpy(),
  emit : jasmine.createSpy(),
}
var setupMock = require('./mocks/setup')
var couchMock = require('./mocks/couch')

var UserAccountSpy   = spyOnModule('./../lib/user_account.js').andReturn( UserAccountMock );
var PasswordResetSpy = spyOnModule('./../lib/password_reset.js').andReturn( PasswordResetMock );
var Worker           = require("./../lib/worker.js");

describe("Worker", function() {

  beforeEach(function(){
    this.setupDefer = when.defer()
    spyOn(Worker.prototype, "setup").andReturn( this.setupDefer.promise )
    spyOn(Worker.prototype, "handleError");
    PasswordResetSpy.reset()
    UserAccountSpy.reset()
  })
  
  describe('constructor', function () {
    beforeEach(function() {
      spyOn(Worker.prototype, "launch");
      this.worker = new Worker();
    });
    it("should call #setup()", function() {
      expect(this.worker.setup).wasCalled();
    });
    
    _when('setup succeeds', function () {
      beforeEach(function() {
        this.setupDefer.resolve()
      });
      it('should call #launch', function () {
        expect(this.worker.launch).wasCalled();
      });
    });
    
    _when('setup fails', function () {
      beforeEach(function() {
        this.setupDefer.reject( 'error' )
      });
      it('should handle error', function () {
        expect( this.worker.handleError ).wasCalledWith( 'error' );
      });
    });
  }); // constructor

  describe('#launch()', function () {
    beforeEach(function() {
      Worker.prototype.setup.andCallFake( setupMock )
      spyOn(Worker.prototype, "handleChange");
      this.worker = new Worker();
    });
    it('should make a shortcut for _users database', function () {
      expect(this.worker.couch.database).wasCalledWith('_users');
      expect(this.worker.usersDatabase).toEqual(couchMock.databaseApi);
    });
    it("should start listening to changes", function() {
      expect(this.worker.usersDatabase.changes).wasCalledWith({include_docs:true});
    });
    it("should handle changes", function() {
      var args = couchMock.changesApi.on.calls[0].args
      expect(args[0]).toEqual('change');
      args[1]('change')
      expect(this.worker.handleChange).wasCalledWith('change');
    });
    it("should handle errors", function() {
      var args = couchMock.changesApi.on.calls[1].args
      expect(args[0]).toEqual('error');
      args[1]('error')
      expect(this.worker.handleError).wasCalledWith('error');
    });
  }); // #launch()

  describe("#handleChange(change)", function() {
    beforeEach(function() {
      spyOn(Worker.prototype, "launch");
      this.worker = new Worker();
      this.setupDefer.resolve()
    });
    it("should ignore invalid user docs", function() {
      this.worker.handleChange({ _id: 'invalid'})
      expect(UserAccountSpy).wasNotCalled();
    });
    
    _when('when password reset doc passed', function () {
      beforeEach(function() {
        var passwordResetDoc = {
           "_id": "org.couchdb.user:$passwordReset/woot/hash",
           "_rev": "1-8d7d6e48c73ef2b311fcdfcdd2a8bf11",
           "name": "$passwordReset/woot/hash",
           "type": "user"
        }
        this.change = {
          id  : passwordResetDoc._id,
          doc : passwordResetDoc
        }
        this.worker.handleChange( this.change )
      });

      it('should init a new password reset', function () {
        expect(PasswordResetSpy.callCount).toBe(1);
      });
      it('should not init a new user account', function () {
        expect(UserAccountSpy).wasNotCalled()
      });
      it("should cache new password reset", function() {
        expect(this.worker.passwordResets['org.couchdb.user:$passwordReset/woot/hash']).toEqual( PasswordResetMock )
      });
      it("should no reinitiate a password reset", function() {

        this.worker.handleChange( this.change )
        this.worker.handleChange( this.change )
        expect(PasswordResetSpy.callCount).toBe(1);
      });
    });

    _when('when valid user doc passed', function () {
      beforeEach(function() {
        this.validUserDoc = {
          "_id": "org.couchdb.user:user/joe@example.com",
          "name": "user/joe@example.com",
          "type": "user",
          "ownerHash": "hash",
          "database": "user/hash"
        }
        this.worker.handleChange( { doc : this.validUserDoc } )
      });

      it('should init a new user account', function () {
        expect(UserAccountSpy.callCount).toBe(1);
      });
      it("should cache new user account", function() {
        expect(this.worker.userAccounts['user/hash']).toEqual( UserAccountMock )
      });
      it("should no reinitiate a user account", function() {
        this.worker.handleChange( { doc : this.validUserDoc } )
        this.worker.handleChange( { doc : this.validUserDoc } )
        expect(UserAccountSpy.callCount).toBe(1);
      });
      it("should emit the change on the user account", function() {
        expect(UserAccountMock.emit).wasCalledWith( 'change', { doc : this.validUserDoc } );
      });
      it("should subscribe to `deleted` event on user account", function() {
        var args = UserAccountMock.on.mostRecentCall.args
        expect(args[0]).toEqual('deleted');
        expect(this.worker.userAccounts['user/hash']).toBeDefined();
        args[1](); // callback cleans up user account from cache
        expect(this.worker.userAccounts['user/hash']).toBeUndefined();
      });
    });
  }); // #handleChange(change)
});