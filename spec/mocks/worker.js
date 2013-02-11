var when = require('when');
var promisify = require('when-promisify');
var couchMock = require('./couch.js')

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

var worker = {
  when : when,
  promisify : promisify,
  config : {
    app : {},
    user : {}
  },
  usersDatabase : couchMock.databaseApi,
  couch : couchMock,
  handleError : getSpy('handleError'),
  handleErrorWithMessage : getSpy('handleErrorWithMessage')
};
module.exports = worker;