var spies = []
var getSpy = function(name) {
  var spy = jasmine.createSpy(name)
  spies.push(spy)
  return spy
}
afterEach(function() {
  for (var i = 0; i < spies.length; i++) {
    spies[i].reset()
  }
});

var CouchMock = function(options) {
  this.options = options;
}
var changesApi = {}
changesApi.on = getSpy('on').andReturn(changesApi)

var databaseApi = {
  get     : getSpy('get'),
  save    : getSpy('save'),
  remove  : getSpy('remove'),
  changes : getSpy('changes').andReturn(changesApi)
}
CouchMock.prototype.changesApi  = changesApi
CouchMock.prototype.databaseApi = databaseApi 
CouchMock.prototype.database = getSpy('database').andReturn(databaseApi)

module.exports = CouchMock;
module.exports.changesApi = changesApi;
module.exports.databaseApi = databaseApi;

