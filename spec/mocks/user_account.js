var WorkerMock = require('./worker.js')
var when = require('when');
var promisify = require('when-promisify');

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

var UserAccount = {
  on  : getSpy('on'),
  log : getSpy('log'),
  properties : {},
  worker : WorkerMock,
  when : when,
  promisify : promisify
};

module.exports = UserAccount;