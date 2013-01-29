var setup        = require("./setup.js");
var Q            = require("q");
var util         = require('util');
var EventEmitter = require('events').EventEmitter;

function Worker(config) {}
util.inherits(Worker, EventEmitter);

Worker.prototype.setup = function(config) {
  return setup(this, config);
};
Worker.prototype.install = function() {
  return this.resolve();
};

// 
// promise FTW!
// 
Worker.prototype.defer = function() {
  return Q.defer();
};
Worker.prototype.resolve = function() {
  var defer = this.defer()
  defer.resolve.apply(this, arguments);
  return defer.promise;
};
Worker.prototype.reject = function() {
  var defer = this.defer()
  defer.reject.apply(this, arguments);
  return defer.promise;
};
Worker.prototype.resolveWith = function() {
  var defer = this.defer()
  defer.resolve.apply(this, arguments);
  return defer.promise;
};
Worker.prototype.rejectWith = function() {
  var defer = this.defer()
  defer.reject.apply(this, arguments);
  return defer.promise;
};
Worker.prototype.when = function() {
  return Q.all.apply(null, arguments);
}

// 
// this.promisify(something, 'method', 'called in here').then
// 
Worker.prototype.promisify = function(context, nodeAsyncFnName) {
  return function() {
    var args = Array.prototype.slice.call(arguments)
    return Q.ninvoke.apply(null, [context, nodeAsyncFnName].concat(args))
  };
};

// 
// helper for nicer logging
// 
Worker.prototype.log = function(message) {
  message = "[" + this.name + "Worker] " + message;
  console.log.apply(null, arguments);
};
//
// report errors nicely
//
Worker.prototype.handleError = function(error) {
  this.log("error: %j", error);
};
Worker.prototype.handleErrorWithMessage = function(message) {
  return function(error) {
    this.log("%s: %j", message, error);
  };
};

module.exports = Worker;