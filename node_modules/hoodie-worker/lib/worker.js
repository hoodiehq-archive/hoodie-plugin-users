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
  // custom installation routines come in here
  console.log(this.resolve())
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
// 
// this.promisify(something, 'method', 'called in here').then
// 
Worker.prototype.promisify = function(context, nodeAsyncFnName, calledFrom) {
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