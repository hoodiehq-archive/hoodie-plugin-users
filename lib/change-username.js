var _ = require('lodash')

var utils = require('./utils')

/**
 * Handles users which get $newUsername property set
 */

var exports = module.exports = function (hoodie, doc) {
  var callback = utils.logErrors('Error changing username')
  exports.changeUsername(hoodie, doc, callback)
}

/**
 * Deletes the old user doc causing the client-side promise to be
 * successfully resolved
 */

exports.success = function (hoodie, doc, callback) {
  return hoodie.account.remove(doc.type, doc.id, callback)
}

/**
 * Removes the $newUsername property and adds an $error property causing
 * the client-side promise to fail
 */

exports.fail = _.curry(function (props, hoodie, doc, callback) {
  return hoodie.account.update(doc.type, doc.id, {
    $newUsername: undefined,
    $error: props
  }, callback)
})

/**
 * Used when creating the new user doc with updated username fails
 */

exports.createUserError = exports.fail({
  message: 'Failed to create new user account'
})

/**
 * Creates a new user doc with the updated username. Deletes the old user
 * doc on success and adds an $error property and deletes the $newUsername
 * property on failure.
 */

exports.changeUsername = function (hoodie, old_user, callback) {
  var hook = 'plugin.user.confirm.changeUsername'
  hoodie.env.hooks.every.emit(hook, [old_user], function (/*  allowConfirm */) {
    var new_doc = _(old_user).omit([
      '_id',
      '_rev',
      'name',
      '$newUsername',
      '$error'
    ]).cloneDeep().value()

    new_doc.id = old_user.$newUsername
    hoodie.account.add('user', new_doc, function (err) {
      if (err) {
        return exports.createUserError(hoodie, old_user, callback)
      }
      return exports.success(hoodie, old_user, callback)
    })
  })
}
