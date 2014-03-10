// this is how a passwordReset doc looks like (a bit simplified):
//
// {
//   _id: "org.couchdb.user:$passwordReset/joe@example.com/uuid789",
//   name: "$passwordReset/joe@example.com/uuid789",
//   type: 'user',
//   roles: []
// };
//
// 1. check if username exists
// 2. generate new password
// 3. update current user object
// 4. send out new password via email
// 5. remove $resetPassword object
//

var util = require('util');
module.exports = function (hoodie) {

  //
  //
  //
  function handleChange (passwordResetObject) {

    // worarkound for https://github.com/hoodiehq/hoodie-plugins-api/issues/6
    if(passwordResetObject.doc) {
      passwordResetObject = passwordResetObject.doc;
    }

    if (passwordResetObject._deleted) {
      return
    }
    if (passwordResetObject.$error) {
      return
    }

    handlePasswordReset(passwordResetObject);
  }


  //
  //
  //
  function handlePasswordReset (passwordResetObject) {
    console.log('passwordResetObject')
    console.log(passwordResetObject)
    var username = passwordResetObject.id.replace(/\/\w+$/, '');

    checkIfUserExists(username, function(error, userObject) {
      if (error) {
        hoodie.account.update('$passwordReset', passwordResetObject.id, {
          $error: {
            error: 'not_found',
            message: util.format('user %s could not be found', username)
          }
        }, function(error) {
          if(error) {
            console.log("FATAL: couldn't set user error for %s", username)
          }
        })
        return
      }

      setNewPassword(passwordResetObject, userObject);
    })
  }

  //
  //
  //
  function checkIfUserExists (username, callback) {
    hoodie.account.find('user', username, callback)
  }

  //
  //
  //
  function setNewPassword (passwordResetObject, userObject) {
    var password = generatePassword();
    hoodie.account.update('user', userObject.id, { password: password }, function(error) {
      if (error) {
        console.log("FATAL: couldn't update password for %s", userObject)
        return
      }

      sendNewPassword(passwordResetObject, userObject.id, password)
    });
  }

  function sendNewPassword(passwordResetObject, username, password) {
    var appName = hoodie.config.get('app_name');
    var fromEmail = hoodie.config.get('email_from');

    var email = {
      to: username,
      from: fromEmail,
      subject: '['+appName+'] new Password' ,
      text: 'Hey there,\n\nyou can now sign in to your ' + appName + ' account using\n\nusername: ' + username +'\npassword: ' + password + '\n\nBest,\n' +appName + ' Team'
    }
    hoodie.sendEmail(email, function(error) {
      if(error) {
        hoodie.account.update('$passwordReset', passwordResetObject.id, {
          $error: error
        }, function(error) {
          if(error) {
            console.log("FATAL: couldn't set passwordReset error for %s", passwordResetObject.id)
          }
        })
        return;
      }

      removePasswordResetObject(passwordResetObject);
    });
  }

  function removePasswordResetObject (passwordResetObject) {
    hoodie.account.remove('$passwordReset', passwordResetObject.id, function(error) {
      if (error) {
        console.log("FATAL: could not remove passwordReset object %s", passwordResetObject.id)
      }
    })
  }

  //
  // TODO: make this proper
  //
  function generatePassword () {
    var len, chars, i, radix;

    len   = 5;
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;

    return ((function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        _results.push(chars[0 | Math.random() * radix]);
      }
      return _results;
    })()).join('');
  }

  return {
    handleChange : handleChange
  }
}