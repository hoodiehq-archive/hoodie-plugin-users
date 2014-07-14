var utils = require('./utils');

/**
 * Handles user _delete events
 */

var exports = module.exports = function (hoodie, doc) {
  exports.deleteUserDB(hoodie, doc, utils.logErrors('Error deleting user db'));
};

/**
 * Deletes a users's database when their account is removed
 */

exports.deleteUserDB = function (hoodie, doc, callback) {
  hoodie.database.remove(utils.userDB(doc), callback);
};
