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
      it('should #removeOldUsersDoc', function (done) {
        expect(this.usernameChange.removeOldUsersDoc).wasCalled();
      });
    });
  }); // #process()
}); // UserAccount

}, 100)
