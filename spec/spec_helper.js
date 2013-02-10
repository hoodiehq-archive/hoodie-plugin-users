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