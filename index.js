/* global emit */ // couchdb globals

/**
 * Users plugin
 * Manages accounts and user dbs
 */

var _ = require('lodash')
var async = require('async')

/**
* Adds a database to the pool of task event sources
* Makes sure it only happens once per database
* Maybe move the dedupe logic to hoodie-plugins-manager
*/

module.exports = function (hoodie, callback) {
  var userChange = _.partial(require('./lib/user-change'), hoodie)

  hoodie.account.on('user:change', userChange)
  hoodie.account.on('user_anonymous:change', userChange)
  hoodie.account.on('$passwordReset:change', _.partial(require('./lib/password-reset'), hoodie))

  async.series([
    async.apply(exports.createIndex, hoodie, 'by-name', 'name'),
    async.apply(exports.createIndex, hoodie, 'by-created-at', 'doc.createdAt')
  ], function (err) {
    if (err) return callback(err)
    /**
     * Loops through all user accounts and runs them through
     * the new user procedure. For most users that will mean
     * that their user database will be added as a listener
     * to the event system.
     */

    // bootstrap existing users
    hoodie.account.findAll(function (error, accounts) {
      if (error) {
        console.log('hoodie-plugin-users: can’t bootstrap existing accounts')
        return callback(error)
      }
      accounts.forEach(userChange)
      callback()
    })
  })
}

exports.createIndex = function (hoodie, name, toEmit, callback) {
  var usersDb = hoodie.database('_users')

  var mapReduce = {
    map: function (doc) {
      var name = doc.name.split('/')[1]
      var state
      if (doc.roles.indexOf('error') !== -1) {
        state = 'error'
      } else {
        state = doc.roles.indexOf('confirmed') === -1 ? 'unconfirmed' : 'confirmed'
      }

      var result = {
        id: doc.id,
        name: name,
        createdAt: doc.createdAt,
        state: state
      }
      emit(toEmit, result)
    }.toString().replace('toEmit', toEmit)
  }
  usersDb.addIndex(name, mapReduce, callback)
}
