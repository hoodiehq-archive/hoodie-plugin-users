require('./spec_helper.js');

var when            = require("when");
var AccountMock     = require("./mocks/user_account.js");
var UsernameChange  = require("./../lib/username_change.js");

setTimeout( function() {

describe('UsernameChange', function () {
  beforeEach(function() {
    spyOn(UsernameChange.prototype, "process");
    this.usernameChange = new UsernameChange(AccountMock, 'new username')
  });

  describe('constructor', function () {
    it("should set account", function() {
      expect(this.usernameChange.account).toEqual(AccountMock);
    });
    it("should clone account properties", function() {
      expect(this.usernameChange.oldProperties).toEqual(AccountMock.properties);
      this.usernameChange.oldProperties.funky = 'fresh'
      expect(AccountMock.properties.funky).toBeUndefined();
    });
    it("should set newUsername", function() {
      expect(this.usernameChange.newUsername).toEqual('new username');
    });
  }); // constructor

  describe('#process()', function () {
    beforeEach(function() {
      this.usernameChange.process.andCallThrough()
      this.createNewUsersDocDefer = when.defer();
      spyOn(this.usernameChange, "createNewUsersDoc").andReturn(this.createNewUsersDocDefer.promise);
      spyOn(this.usernameChange, "removeOldUsersDoc");
      this.usernameChange.process()
    });
    it('should #createNewUsersDoc()', function () {
      expect(this.usernameChange.createNewUsersDoc).wasCalled();
    });
    _when('#createNewUsersDoc() succeeds', function () {
      beforeEach(function() {
        this.createNewUsersDocDefer.resolve()
      });
      it('should #removeOldUsersDoc', function () {
        expect(this.usernameChange.removeOldUsersDoc).wasCalled();
      });
    });
  }); // #process()

  describe('#createNewUsersDoc()', function () {
    beforeEach(function() {
      spyOn(this.usernameChange, "handleSaveSuccess");
      spyOn(this.usernameChange, "handleSaveError").andReturn( when.reject() );
      this.usernameChange.oldProperties = {
        $newUsername : 'new username',
        _rev : '123'
      }
      this.promise  = this.usernameChange.createNewUsersDoc()
      this.save = this.usernameChange.account.worker.usersDatabase.save
      this.savedId = this.save.mostRecentCall.args[0]
      this.savedProperties = this.save.mostRecentCall.args[1]
      this.callback = this.save.mostRecentCall.args[2]
    });
    it('should set new _id', function () {
      expect(this.savedProperties._id).toEqual('org.couchdb.user:user/new username');
    });
    it('should set new name', function () {
      expect(this.savedProperties.name).toEqual('user/new username');
    });
    it("should remove $newUsername property", function() {
      expect(this.savedProperties.$newUsername).toBeUndefined();
    });
    it("should remove _rev property", function() {
      expect(this.savedProperties._rev).toBeUndefined();
    });
    it("should save the new _users doc", function() {
      expect(this.save).wasCalledWithArgs('org.couchdb.user:user/new username', {
        _id : 'org.couchdb.user:user/new username',
        name : 'user/new username'
      });
    });

    describe('save succeeds', function () {
      beforeEach(function() {
        this.callback( null, 'w00t' )
      });
      it('should #handleSaveSuccess()', function () {
        expect(this.usernameChange.handleSaveSuccess).wasCalledWith('w00t');
      });
      it("should resolve", function() {
        expect(this.promise).toBeResolved();
      });
    });

    describe('save fails', function () {
      beforeEach(function() {
        this.callback( 'oops' )
      });
      it('should #handleSaveError()', function () {
        expect(this.usernameChange.handleSaveError).wasCalledWith('oops');
      });
      it("should reject", function() {
        expect(this.promise).toBeRejected();
      });
    });
  }); // #createNewUsersDoc()

  describe('#removeOldUsersDoc()', function () {
    beforeEach(function() {
      spyOn(this.usernameChange, "handleRemoveOldUsersDocSuccess");
      spyOn(this.usernameChange, "handleRemoveOldUsersDocError").andReturn( when.reject() );
      this.usernameChange.oldProperties = {
        _id : 'abc',
        _rev : '123'
      }
      this.promise  = this.usernameChange.removeOldUsersDoc()
      this.remove = this.usernameChange.account.worker.usersDatabase.remove
      this.callback = this.remove.mostRecentCall.args[2]
    });
    it('should make the remove call', function () {
      expect(this.remove).wasCalledWithArgs('abc', '123');
    });

    describe('save succeeds', function () {
      beforeEach(function() {
        this.callback( null, 'w00t' )
      });
      it('should #handleRemoveOldUsersDocSuccess()', function () {
        expect(this.usernameChange.handleRemoveOldUsersDocSuccess).wasCalledWith('w00t');
      });
      it("should resolve", function() {
        expect(this.promise).toBeResolved();
      });
    });

    describe('save fails', function () {
      beforeEach(function() {
        this.callback( 'oops' )
      });
      it('should #handleRemoveOldUsersDocError()', function () {
        expect(this.usernameChange.handleRemoveOldUsersDocError).wasCalledWith('oops');
      });
      it("should reject", function() {
        expect(this.promise).toBeRejected();
      });
    });
  }); // #removeOldUsersDoc()
}); // UserAccount

}, 100)