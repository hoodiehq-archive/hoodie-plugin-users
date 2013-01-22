var Q       = require("q"),
    url     = require("url"),
    fs      = require("fs"),
    cradle  = require("cradle");

var package_json = JSON.parse(fs.readFileSync("./package.json"));
// turn 'hoodie-worker-whatever' in 'whatever'
var workerName   = package_json.name.substr(14);


var InstallHelper = function(worker, config) {
  worker.name = workerName;
  worker.config = config;
  var install = new Install(worker);
  return install.assureInstallation().fail( install._handleError );
};

var Install = function(worker) {
  this.worker = worker;
  this.initCouchConnection();
};

Install.prototype.initCouchConnection = function() {
  var options = url.parse(this.worker.config.server);

  if (this.worker.config.admin) {
    options.auth = {
      username: this.worker.config.admin.user,
      password: this.worker.config.admin.pass
    };
  }
  this.worker.couch = new(cradle.Connection)(options);
};

Install.prototype.assureInstallation = function() {
  return this.readGlobalConfig().then( this.readWorkerConfig.bind(this) );
};

Install.prototype.readGlobalConfig = function() {
  var defer = Q.defer();

  this.worker.couch.database('modules').get('global_config', function(error, object) {
    if (error) {
      error.context = 'readGlobalConfig';
      defer.reject(error);
      return;
    }

    this.setGlobalConfig(object.config);
    defer.resolve();
  }.bind(this));

  return defer.promise;
};

Install.prototype.readWorkerConfig = function() {
  var defer = Q.defer();

  this.worker.couch.database('modules').get(this.worker.name, function(error, object) {
    if (error) {
      if (error.reason === "missing" || error.reason === "deleted") {

        this._log("/modules/%s not yet installed", this.worker.name);
        this.installMe().then( defer.resolve ).fail( defer.reject );

      } else {
        error.context = 'assureInstallation';
        defer.reject(error);
        return defer.promise;
      }
    } else {

      // already installed
      this._log("/modules/%s already installed.", this.worker.name);
      console.log(object);
      this.setWorkerConfig(object.config);
      defer.resolve();

    }
  }.bind(this));

  return defer.promise;
};

Install.prototype.setGlobalConfig = function(object) {
  this.worker.config.app = object;
};

Install.prototype.setWorkerConfig = function(object) {
  this.worker.config.user = object;
};

Install.prototype.installMe = function() {
  return this.createConfigInModulesDatabase();
};

//    - create object in /modules
Install.prototype.createConfigInModulesDatabase = function() {
  this._log('creatinging object in modules database ...');

  var doc = {
    "_id"       : this.worker.name,
    "createdAt" : new Date(),
    "updatedAt" : new Date(),
    "config"    : {}
  };
  this.setWorkerConfig(doc.config);

  return promisify( this.worker.couch.database('modules'), 'save', 'createConfigInModulesDatabase' )( doc );
};

Install.prototype._handleError = function(error) {
  this._log("Something went wrong ... ");
  this._log("%j", error);
};

Install.prototype._log = function(message) {
  message = "["+this.worker.name+"Worker install] " + message;
  console.log.apply(null, arguments);
};

// http://howtonode.org/promises
function promisify(context, nodeAsyncFnName, calledFrom) {
  return function() {
    var defer = Q.defer(),
        args = Array.prototype.slice.call(arguments);

    args.push(function(err, val) {

      if (err !== null) {
        err.context = calledFrom;
        return defer.reject(err);
      }

      return defer.resolve(val);
    });

    context[nodeAsyncFnName].apply(context, args);

    return defer.promise;
  };
}

module.exports = InstallHelper;