var _ = require('lodash')

var changeUsername = require('./change-username')
var removeAccount = require('./remove-account')
var signUp = require('./signup')
var utils = require('./utils')

/**
 * Event handlers
 */

var sources = []

module.exports = function userChange (hoodie, doc) {
  if (doc.$error) {
    // don't do any further processing to user docs with $error
    return
  }
  if (doc._deleted && !doc.$newUsername) {
    return removeAccount(hoodie, doc)
  }
  if (doc.$newUsername) {
    return changeUsername(hoodie, doc)
  }
  if (!signUp.isConfirmed(doc) && !signUp.isUnconfirmed(doc)) {
    return signUp(hoodie, doc)
  }

  var dbName = utils.userDB(doc)
  if (_.includes(sources, dbName)) return

  // not a source yet
  hoodie.task.addSource(dbName)
  sources.push(dbName)
}
