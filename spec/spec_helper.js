// shortcuts
_when = function(description, specs) {
  describe("when " + description, specs)
} 
_and  = function(description, specs) {
  describe("and " + description, specs)
} 
_but  = function(description, specs) {
  describe("but " + description, specs)
} 

// https://gist.github.com/jbpros/1135181
var moduleSpies = {};
var originalJsLoader = require.extensions['.js'];
 
spyOnModule = function spyOnModule(module) {
  var path          = require.resolve(module);
  var spy           = createSpy("spy on module \"" + module + "\"");
  moduleSpies[path] = spy;
  delete require.cache[path];
  return spy;
};
 
require.extensions['.js'] = function (obj, path) {
  if (moduleSpies[path])
    obj.exports = moduleSpies[path];
  else
    return originalJsLoader(obj, path);
};
 
afterEach(function() {
  for (var path in moduleSpies) {
    delete moduleSpies[path];
  }
});

// https://gist.github.com/gr2m/2191748
// addjusted for when.js
JasminePromiseMatchers = {}
JasminePromiseMatchers.wasCalledWithArgs = function() {
  var expectedArgs = jasmine.util.argsToArray(arguments);
  var actualArgs = this.actual.argsForCall[0].slice(0);
  actualArgs.pop()
  actualArgs = [actualArgs]
  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }

  this.message = function() {
    var invertedMessage = "Expected spy " + this.actual.identity + " not to have been called with " + jasmine.pp(expectedArgs) + " but it was.";
    var positiveMessage = "";
    if (this.actual.callCount === 0) {
      positiveMessage = "Expected spy " + this.actual.identity + " to have been called with " + jasmine.pp(expectedArgs) + " but it was never called.";
    } else {
      positiveMessage = "Expected spy " + this.actual.identity + " to have been called with " + jasmine.pp(expectedArgs) + " but actual calls were " + jasmine.pp(actualArgs).replace(/^\[ | \]$/g, '')
    }
    return [positiveMessage, invertedMessage];
  };


  return this.env.contains_(actualArgs, expectedArgs);
}
JasminePromiseMatchers.toBePromise = function() {
  return this.actual.then && !this.actual.resolve;
};
 
JasminePromiseMatchers.toBeRejected = function() {
  var rejected = false
  this.actual.otherwise( function () { rejected = true });
  return rejected
};
 
JasminePromiseMatchers.toBeResolved = function() {
  var resolved = false
  this.actual.then( function () { resolved = true });
  return resolved
};
 
JasminePromiseMatchers.toBeResolvedWith = function() {
  var done, expectedArgs;
  expectedArgs = jasmine.util.argsToArray(arguments);
  if (!this.actual.then) {
    throw new Error('Expected a promise, but got ' + jasmine.pp(this.actual) + '.');
  }
  done = jasmine.createSpy('done');
  this.actual.then(done);
  this.message = function() {
    if (done.callCount === 0) {
      return ["Expected spy " + done.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but it was never resolved.", "Expected spy " + done.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but it was."];
    } else {
      return ["Expected spy " + done.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(done.argsForCall), "Expected spy " + done.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(done.argsForCall)];
    }
  };
  return this.env.contains_(done.argsForCall, expectedArgs);
};
 
JasminePromiseMatchers.toBeRejectedWith = function() {
  var expectedArgs, fail;
  expectedArgs = jasmine.util.argsToArray(arguments);
  if (!this.actual.otherwise) {
    throw new Error('Expected a promise, but got ' + jasmine.pp(this.actual) + '.');
  }
  fail = jasmine.createSpy('fail');
  this.actual.otherwise(fail);
  this.message = function() {
    if (fail.callCount === 0) {
      return ["Expected spy " + fail.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but it was never resolved.", "Expected spy " + fail.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but it was."];
    } else {
      return ["Expected spy " + fail.identity + " to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(fail.argsForCall), "Expected spy " + fail.identity + " not to have been resolved with " + jasmine.pp(expectedArgs) + " but was resolved with " + jasmine.pp(fail.argsForCall)];
    }
  };
  return this.env.contains_(fail.argsForCall, expectedArgs);
};

jasmine.Matchers.wrapInto_(JasminePromiseMatchers, jasmine.Matchers)