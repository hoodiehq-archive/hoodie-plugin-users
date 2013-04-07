require('./spec_helper.js');

var when               = require("when");
var UserDatabaseMock   = require("./mocks/user_database.js");
var UsernameChangeMock = require("./mocks/username_change.js");
var UserDatabaseSpy    = spyOnModule('./../lib/user_database.js').andReturn( UserDatabaseMock );
var UsernameChangeSpy  = spyOnModule('./../lib/username_change.js').andReturn( UsernameChangeMock );
var UserAccount        = require("./../lib/user_account.js");
var WorkerMock         = require("./mocks/worker.js");

describe('UserAccount', function () {
  beforeEach(function() {
    spyOn(UserAccount.prototype, "setProperties");
    spyOn(UserAccount.prototype, "listenUp");
    spyOn(UserAccount.prototype, "emit");
    spyOn(UserAccount.prototype, "log");

    this.properties = {
      database : 'database',
      name : 'name',
      _id : 'id',
      _rev : 'rev'
    }
    this.account = new UserAccount(this.properties, WorkerMock)
  });

  describe('constructor', function () {
    it('should set properties', function () {
      expect(this.account.setProperties).wasCalledWith(this.properties);
    });
    it('should set worker', function () {
      expect(this.account.worker).toBe(WorkerMock);
    });
    it('should set database', function () {
      UserAccount.prototype.setProperties.andCallThrough();
      this.account = new UserAccount(this.properties, WorkerMock)
      expect(UserDatabaseSpy).wasCalledWith('database', this.account, WorkerMock);
      expect(this.account.database).toBe(UserDatabaseMock);
    });
    it("should set hash", function() {
      expect(this.account.hash).toEqual('hash');
    });

    it('should listen to changes', function () {
      expect(this.account.listenUp).wasCalled();
    });
  }); // constructor

  describe('#setProperties(properties)', function () {
    beforeEach(function() {
      expect(this.account.properties).toBeUndefined();
      expect(this.account.name).toBeUndefined();
      this.account.setProperties.andCallThrough()
      this.account.setProperties( this.properties )
    });
    it('should set properties', function () {
      expect(this.account.properties).toEqual(this.properties);
    });
    it('should set name', function () {
      expect(this.account.name).toEqual( 'database' );
    });
  }); // #setProperties(properties)

  describe('#listenUp()', function () {
    beforeEach(function() {
      spyOn(this.account, "on");
      spyOn(this.account, "handleChange");
      spyOn(this.account, "handleUsernameChange");
      spyOn(this.account, "confirm");
      this.account.listenUp.andCallThrough()
      this.account.listenUp()
    });
    it('should subscribe to change events', function () {
      var args = this.account.on.calls[0].args
      expect(args[0]).toEqual('change');
      args[1]('change')
      expect(this.account.handleChange).wasCalledWith('change');
    });
    it('should subscribe to usernamechange events', function () {
      var args = this.account.on.calls[1].args
      expect(args[0]).toEqual('usernamechange');
      args[1]('usernamechange')
      expect(this.account.handleUsernameChange).wasCalledWith('usernamechange');
    });
    it('should subscribe to database create events', function () {
      var args = this.account.database.on.calls[0].args
      expect(args[0]).toEqual('created');
      args[1]('created')
      expect(this.account.confirm).wasCalledWith('created');
    });
  }); // #listenUp(properties)

  describe('#handleChange( change )', function () {
    it('should set properties from change.doc', function () {
      this.account.handleChange( { doc : 'doc' } )
      expect(this.account.setProperties).wasCalledWith('doc');
    });

    _when('change is a username change request', function () {
      beforeEach(function() {
        this.doc = {
          "$newUsername" : 'new username'
        }
        this.account.handleChange( { doc : this.doc } )
      });
      it('should emit usernamechange event', function () {
        expect(this.account.emit).wasCalledWith('usernamechange', 'new username');
      });
    });

    _when('change is a deleted user that has been confirmed before', function () {
      beforeEach(function() {
        this.change = {
          doc : { "$state" : 'confirmed' },
          deleted : true
        }
        this.account.handleChange( this.change )
      });
      it('should emit deleted event', function () {
        expect(this.account.emit).wasCalledWith('deleted');
      });
    });

    _when('change is a newly created account', function () {
      beforeEach(function() {
        this.account.name = "new account"
        this.account.handleChange( { doc: {} } )
      });
      it('should emit created event', function () {
        expect(this.account.emit).wasCalledWith('created');
      });
    });
  }); // #handleChange( change )

  describe('#handleUsernameChange(newUsername)', function () {
    beforeEach(function() {
      this.account.handleUsernameChange('new username')
    });
    it('should init a username change', function () {
      expect(UsernameChangeSpy).wasCalledWith(this.account, 'new username');
    });
  }); // #handleUsernameChange(newUsername)

  describe('#confirm()', function () {
    beforeEach(function() {
      this.saveDefer = when.defer()
      spyOn(this.account, "save").andReturn( this.saveDefer.promise );
      spyOn(this.account, "handleSignUpError");
      this.account.properties = {}
      this.hash = 'hash'
      this.account.confirm()
    });
    it('should state to confirmed', function () {
      expect(this.account.properties.$state).toEqual('confirmed');
    });
    it('should set roles to user hash and confirmed', function () {
      expect(this.account.properties.roles).toEqual(['hash', 'confirmed']);
    });
    it("should save", function() {
      expect(this.account.save).wasCalled();
    });

    _when('save fails', function () {
      beforeEach(function() {
        this.saveDefer.reject('ooops')
      });
      it('should #handleSignUpError( error )', function () {
        expect(this.account.handleSignUpError).wasCalledWith('ooops');
      });
    });
  }); // #confirm()

  describe('#save()', function () {
    beforeEach(function() {
      spyOn(this.account, "handleSaveSuccess");
      this.account.properties = this.properties
      this.promise = this.account.save()
      this.callback = this.account.worker.usersDatabase.save.mostRecentCall.args[3]
    });
    it('should update _users doc', function () {
      expect(this.account.worker.usersDatabase.save).wasCalledWithArgs('id', 'rev', this.properties);
    });

    _when('saving succeeds', function () {
      beforeEach(function() {
        this.callback(null, 'woot')
      });
      it('should #handleSaveSuccess()', function () {
        expect(this.account.handleSaveSuccess).wasCalledWith('woot');
      });
      it("should return a resolved promise", function() {
        expect(this.promise).toBeResolved();
      });
    });

    _when('saving fails', function () {
      beforeEach(function() {
        this.callback('ooops')
      });
      it("should return a rejected promise", function() {
        expect(this.promise).toBeRejectedWith( { message : 'ooops' } );
      });
    });
  }); // '#save()

  describe('#handleSaveSuccess(response)', function () {
    beforeEach(function() {
      this.account.properties = {}
      this.account.handleSaveSuccess( {rev : 'rev123'})
    });
    it('shoul update properties._rev', function () {
      expect(this.account.properties._rev).toEqual('rev123');
    });
  }); // #handleSaveSuccess(response)


  describe('#handleSignUpError(error)', function () {
    beforeEach(function() {
      this.error = {
        reason : 'ooops'
      }
      this.account.properties = {
        "$state" : "confirmed",
        roles : ["hash", "confirmed"]
      }
      this.saveDefer = when.defer()
      spyOn(this.account, "save").andReturn( this.saveDefer.promise );
      this.promise = this.account.handleSignUpError( this.error )
    });
    it('should set state to $error', function () {
      expect(this.account.properties['$state']).toEqual('error');
    });
    it('should set $error', function () {
      expect(this.account.properties['$error']).toEqual( this.error );
    });
    it('should empty roles', function () {
      expect(this.account.properties.roles).toEqual([]);
    });
    it("should save", function() {
      expect(this.account.save).wasCalled();
    });
    it("should return a rejected promise", function() {
      expect(this.promise).toBeRejectedWith( this.error );
    });
  }); // #handleSignUpError(error)
}); // UserAccount