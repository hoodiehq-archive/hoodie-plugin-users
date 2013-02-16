require('./spec_helper.js');

var when            = require("when");
var UserAccountMock = require("./mocks/user_account.js");
var CouchMock       = require("./mocks/couch.js");
var UserDatabase    = require("./../lib/user_database.js");

setTimeout( function() {

describe('UserDatabase', function () {
  beforeEach(function() {
    spyOn(UserDatabase.prototype, "log");
    spyOn(UserDatabase.prototype, "listenUp");
    spyOn(UserDatabase.prototype, "emit");
    this.database = new UserDatabase('user/hash', UserAccountMock, CouchMock)
  });

  describe('constructor', function () {
    it("should set name", function() {
      expect(this.database.name).toEqual('user/hash');
    });
    it("should set name", function() {
      expect(this.database.hash).toEqual('hash');
    });
    it("should set account", function() {
      expect(this.database.account).toEqual(UserAccountMock);
    });
    it("should set couch connection", function() {
      expect(this.database.couch).toEqual(CouchMock);
    });
    it("should listen up!", function() {
      expect(this.database.listenUp).wasCalled();
    });
  }); // constructor

  describe('#listenUp()', function () {
    beforeEach(function() {
      spyOn(this.database, "create");
      spyOn(this.database, "drop");
      this.database.listenUp.andCallThrough()
      this.account = UserAccountMock
      this.database.listenUp()
    });
    it('should listen to created event', function () {
      var args = this.database.account.on.calls[0].args
      expect(args[0]).toEqual('created');
      args[1]('created')
      expect(this.database.create).wasCalledWith('created');
    });
    it('should listen to deleted event', function () {
      var args = this.database.account.on.calls[1].args
      expect(args[0]).toEqual('deleted');
      args[1]('deleted')
      expect(this.database.drop).wasCalledWith('deleted');
    });
  }); // #listenUp()

  describe('#create()', function () {
    beforeEach(function() {
      this.createSecurityDefer = when.defer();
      spyOn(this.database, "createSecurity").andReturn( this.createSecurityDefer.promise );
      this.database.name = 'user/hash'
      this.database.couch = new CouchMock
      this.promise = this.database.create()
      this.callback = this.database.couch.database().create.mostRecentCall.args[0]
    });
    it('create database "user/hash"', function () {
      expect(this.database.couch.database).wasCalledWith('user/hash');
      expect(this.database.couch.database().create).wasCalled();
    });

    _when('create succeeds', function () {
      beforeEach(function() {
        this.callback( null, 'woot')
      });
      it('should create security', function () {
        expect(this.database.createSecurity).wasCalled();
      });
    });
  }); // #create()

  describe('#createSecurity()', function () {
    beforeEach(function() {
      this.database.couch = new CouchMock
      this.database.hash = 'hashhash'
      this.promise = this.database.createSecurity()
      this.callback = this.database.couch.database().query.mostRecentCall.args[1]
    });
    it('should do what?', function () {
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
            roles:['hashhash']
          }
        }
      }
      expect(this.database.couch.database().query).wasCalledWithArgs( options );
    });

    _and('creating security succeeds', function () {
      beforeEach(function() {
        this.callback(null, 'woot')
      });
      it('should emit "created" event', function () {
        expect(this.database.emit).wasCalledWith('created');
      });
    });
  });

  describe('#drop()', function () {
    beforeEach(function() {
      this.database.couch = new CouchMock;
      this.database.name = 'user/hash'
      spyOn(global, "setTimeout").andCallFake( function( cb ) { cb() });
      this.database.drop()
    });
    it('should wait 3sec', function () {
      expect(global.setTimeout.callCount).toBe( 1 );
      var timeout = global.setTimeout.mostRecentCall.args[1]
      expect(timeout).toEqual( 3000 );
    });
    it("should drop the database", function() {
      expect(this.database.couch.database).wasCalledWith('user/hash');
      expect(this.database.couch.database(this.name).destroy).wasCalled();
    });
  }); // #drop()
}); // UserAccount

}, 100)
