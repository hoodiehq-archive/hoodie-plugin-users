var crypto = require('crypto')

var _ = require('lodash')
var async = require('async')
var base58 = require('bs58')

var utils = require('./utils')

/*
 * Handles new $passwordReset user docs
 */

var exports = module.exports = function (hoodie, doc) {
  if (doc._deleted || doc.$error) return
  exports.passwordReset(hoodie, doc, utils.logErrors('Error resetting password'))
}

/**
 * Removes the $passwordReset doc, resulting in successful resolution of
 * the promise on the client-side
 */

exports.success = function (hoodie, doc, callback) {
  hoodie.account.remove('$passwordReset', doc.id, callback)
}

/**
 * Updates the $passwordReset doc with an $error property, causing
 * the promise to fail
 */

exports.fail = _.curry(function (props, hoodie, doc, callback) {
  return hoodie.account.update('$passwordReset', doc.id, {$error: props}, callback)
})

/**
 * Used when the account to reset the password for can not be found
 */

exports.notFoundError = exports.fail({
  error: 'not_found',
  message: 'User could not be found'
})

/**
 * Used when the account has no email address associated with it to
 * send a new password to
 */

exports.missingEmailError = exports.fail({
  message: 'No email address found'
})

/**
 * Used when sending the password reset email failed
 */

exports.sendEmailError = exports.fail({
  message: 'Failed to send password reset email'
})

/**
 * Does a password reset, emailing the user a newly generated password
 * and deleting the $passwordReset doc
 */

exports.passwordReset = function (hoodie, reset_doc, callback) {
  hoodie.account.find(
    'user',
    reset_doc.name.split('/')[1],
    function (err, user) {
      if (err) {
        return exports.notFoundError(hoodie, reset_doc, callback)
      }

      // do the password reset
      var email = exports.getUserEmail(user)
      if (!email) {
        return exports.missingEmailError(hoodie, reset_doc, callback)
      }

      exports.generatePassword(function (err, password) {
        if (err) {
          return callback(err)
        }

        async.series([
          exports.setPassword(hoodie, user, password),
          exports.sendPassword(hoodie, reset_doc, email, user.id, password)
        ], callback)
      })
    }
  )
}

/**
 * Creates an email object suitable for nodemailer containing
 * the password reset email body and subject etc.
 */

exports.createResetEmail = function (context) {
  return {
    to: context.to,
    from: context.from,
    subject: `[${context.app_name}] New password`,
    text: `Hey there,

You can now sign in to your ${context.app_name} account using:

username: ${context.username}
password: ${context.password}

Best,
${context.app_name} Team`
  }
}

/**
 * Changes the user's password to the provided value
 */

exports.setPassword = _.curry(function (hoodie, user, password, callback) {
  hoodie.account.update('user', user.id, {password: password}, callback)
})

/**
 * Emails an unhashed password to the user and removes the associated
 * $resetPassword doc on success
 */

exports.sendPassword = _.curry(
  function (hoodie, reset_doc, recipient, username, password, callback) {
    var email = exports.createResetEmail({
      to: recipient,
      from: hoodie.config.get('email_from'),
      app_name: hoodie.config.get('app_name'),
      username: username,
      password: password
    })

    hoodie.sendEmail(email, function (err) {
      exports[err ? 'sendEmailError' : 'success'](hoodie, reset_doc, callback)
    })
  }
)

/**
 * Attempts to return an associated email address for a user doc, otherwise
 * returns null
 */

exports.getUserEmail = function (doc) {
  // if the user id looks like an email address, use that
  // otherwise, return null
  return /@/.test(doc.id) ? doc.id : null
}

/**
 * Generates a new password using a random source and base58 encoding
 */

exports.generatePassword = function (callback) {
  crypto.randomBytes(10, function (err, buf) {
    return callback(err, !err && base58.encode(buf))
  })
}
