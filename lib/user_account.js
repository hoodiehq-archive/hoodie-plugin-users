module.exports = function (hoodie) {

  var handleUsernameChange = require('./username_change.js')(hoodie);

  //
  //
  //
  function handleChange (object) {

    // worarkound for https://github.com/hoodiehq/hoodie-plugins-api/issues/6
    if (object.doc) {
      object = object.doc;
    }

    // handle removed objects
    if (object._deleted) {

      // ignore removed objects coming from a username change
      if (object.$newUsername) {
        return
      }

      console.log('handleUserDestroy')
      console.log(object)
      handleUserDestroy(object);
      return
    }

    if (object.$newUsername) {
      handleUsernameChange(object);
      return
    }

    // if object has an error, ignore.
    if (object.$error) {
      return
    }

    if (object.roles.length === 0) {
      handleNewUser(object);
      return
    }
    else {
      hoodie.task.addSource(object.database);
    }
  }


  // 1. create database
  // 2. grant access
  // 3. confirm user
  //
  function handleNewUser (userObject) {

    var typeAndUsername = userObject.name.split(/\//)
    var type = typeAndUsername[0];
    var username = typeAndUsername[1];
    var dbName = 'user/' + userObject.hoodieId;

    // TODO: assure that the hoodieId does not exist yet.

    // for now, we confirm new user / anonymous_user accounts right away.
    // We plan to add settings for that though.
    hoodie.database.add(dbName, function(error) {

      if (error) {
        if (error.error !== 'file_exists') {
          return handleUserError('hoodie.database.add', type, userObject, error);
        }
        // ignore error, if datbase exists already
        error = undefined;
      }

      hoodie.database(dbName).grantWriteAccess(type, username, function(error, object) {
        if(error) {
          return handleUserError('hoodie.database("'+dbName+'").grantReadAccess("'+type+'", "'+username+'")', type, userObject, error);
        }

        confirmUser(type, userObject, function(error) {
          if(error) {
            return handleUserError('confirmUser', type, userObject, error);
          }
        });
      })
    });
  }

  function handleUserError(context, type, userObject, error) {
    console.log("%s: %s", context, error);
    console.log(error);

    hoodie.account.update(type, userObject.id, {$state: "error", error: error}, function(error) {
      if (error) {
        console.log("hoodie.account.update: %s", error)
      }
    });
  }

  function confirmUser(type, userObject, callback) {
    var readRole = 'hoodie:read:user/' + userObject.hoodieId;
    var writeRole = 'hoodie:write:user/' + userObject.hoodieId;
    var roles = [userObject.hoodieId, 'confirmed', readRole, writeRole].concat(userObject.roles);
    hoodie.account.update(type, userObject.id, {roles: roles}, callback);
  }

  function handleUserDestroy(userObject) {
    var dbName = 'user/' + userObject.hoodieId;
    hoodie.database.remove(dbName, function(error) {
      if (error) {
        console.log("Could not drop database %s", dbName)
        return
      }

      console.log('dropped %s', dbName)
      hoodie.task.removeSource(dbName);
    })
  }

  return {
    handleChange : handleChange
  }
}
