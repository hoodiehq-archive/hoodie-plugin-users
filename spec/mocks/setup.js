var when = require('when');
var CouchMock = require('./couch');

module.exports = function(config) {
  this.couch = new CouchMock(config);
  return when.resolve();
};