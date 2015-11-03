var util = require('util')

var async = require('async')

var utils = require('./utils')

/**
 * Handles user _delete events
 */

var exports = module.exports = function (hoodie, doc) {
  var callback = utils.logErrors('Error deleting user db')
  async.applyEachSeries([
    exports.deleteUserDB,
    exports.deleteAdditionalDBs
  ], hoodie, doc, callback)
}

/**
 * Deletes a users's database when their account is removed
 */

exports.deleteUserDB = function (hoodie, doc, callback) {
  hoodie.database.remove(utils.userDB(doc), callback)
}

/**
 * Delete additional databases, if a user has any
 */
exports.deleteAdditionalDBs = function (hoodie, doc, callback) {
  function deleteDatabase (db, cb) {
    var db_name = util.format('%s-%s', utils.userDB(doc), db)
    hoodie.database.remove(db_name, cb)
  }

  var additionalUserDbs = hoodie.config.get('additional_user_dbs')
  if (util.isArray(additionalUserDbs)) {
    return async.eachSeries(additionalUserDbs, deleteDatabase, callback)
  }
  callback()
}
