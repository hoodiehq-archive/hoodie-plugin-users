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

var UserDatabaseMock = {
  hash : 'hash',
  on : getSpy('on')
};

module.exports = UserDatabaseMock;