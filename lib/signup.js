var _ = require('lodash')
var async = require('async')

var utils = require('./utils')

/**
 * Handles user change events for users not confirmed
 */

var exports = module.exports = function (hoodie, doc) {
  var callback = utils.logErrors('Error confirming user')
  return async.applyEachSeries(
    [exports.createUserDB, exports.createAdditionalDBs, exports.confirmUser],
    hoodie,
    doc,
    callback
  )
}

/**
 * Returns true if user is confirmed, false otherwise
 */

exports.isConfirmed = utils.hasRole('confirmed')

/**
 * Returns true if user as unconfirmed role, false otherwise
 */

exports.isUnconfirmed = utils.hasRole('unconfirmed')

/**
 * Create user's personal database and grants them read/write access
 */

exports.createUserDB = function (hoodie, doc, callback) {
  hoodie.database.add(utils.userDB(doc), callback)
}

/*
 * Create additional user datbases and grant them read/write access
 */
exports.createAdditionalDBs = function (hoodie, doc, callback) {
  // lil helper
  function createDatabase (db, cb) {
    var db_name = `${utils.userDB(doc)}-${db}`
    hoodie.database.add(db_name, cb)
  }

  var additionalUserDbs = hoodie.config.get('additional_user_dbs')
  if (Array.isArray(additionalUserDbs)) {
    async.eachSeries(additionalUserDbs, createDatabase, callback)
  } else {
    callback()
  }
}

/**
 * Adds appropriate roles to user doc to enable user db
 * access and login ability on the frontend
 */

exports.confirmUser = function (hoodie, doc, callback) {
  // runs all user.confirm hooks defined by plugins
  // if one of them returns false, we don’t confirm
  // the user. Error reporting happens out of band.
  // If no hooks are defined, returns true as well.
  hoodie.env.hooks.every.emit('plugin.user.confirm', [doc], function (allowConfirm) {
    if (hasRoles && !isAnonymousUser) {
      return callback()
    }

    var roles = [
      doc.hoodieId,
      'hoodie:read:' + utils.userDB(doc),
      'hoodie:write:' + utils.userDB(doc)
    ]

    roles.push(allowConfirm || isAnonymousUser(doc) ? 'confirmed' : 'unconfirmed')

    _.each(hoodie.config.get('additional_user_dbs'), function (db) {
      roles.concat(
        buildRole('hoodie:read:', utils.userDB(doc), db),
        buildRole('hoodie:write:', utils.userDB(doc), db)
      )
    })

    hoodie.account.update(doc.type, doc.id, {roles: roles}, callback)
  })
}

function buildRole (prefix, user, database) {
  return `${prefix}${user}-${database}`
}

function hasRoles (doc) {
  return _.contains(doc.roles, doc.hoodieId)
}

function isAnonymousUser (doc) {
  return /anonymous/.test(doc.name)
}
