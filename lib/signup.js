var utils = require('./utils');
var async = require('async');

/**
 * Handles user change events for users not confirmed
 */

var exports = module.exports = function (hoodie, doc) {
  var callback = utils.logErrors('Error confirming user');
  return async.applyEachSeries(
    [exports.createUserDB, exports.confirmUser],
    hoodie,
    doc,
    callback
  );
};

/**
 * Returns true if user is confirmed, false otherwise
 */

exports.isConfirmed = utils.hasRole('confirmed');

/**
 * Create user's personal database and grants them read/write access
 */

exports.createUserDB = function (hoodie, doc, callback) {
  hoodie.database.add(utils.userDB(doc), callback);
};

/**
 * Adds appropriate roles to user doc to enable user db
 * access and login ability on the frontend
 */

exports.confirmUser = function (hoodie, doc, callback) {
  var roles = [
    doc.hoodieId,
    'confirmed',
    'hoodie:read:' + utils.userDB(doc),
    'hoodie:write:' + utils.userDB(doc)
  ];
  hoodie.account.update('user', doc.id, {roles: roles}, callback);
};
