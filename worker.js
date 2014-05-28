/**
 * Users plugin
 * Manages accounts and user dbs
 */

var async = require('async');


module.exports = function (hoodie, callback) {

  /**
   * Adds appropriate roles to user doc to enable user db
   * access and login ability on the frontend
   */

  function confirmUser(doc, callback) {
    var roles = [
      doc.hoodieId,
      'confirmed',
      'hoodie:read:user/' + doc.hoodieId,
      'hoodie:write:user/' + doc.hoodieId
    ];
    hoodie.account.update('user', doc.id, {roles: roles}, callback);
  }

  /**
   * Create user's personal database and grants them read/write access
   */

  function createUserDB(doc, callback) {
    var name = 'user/' + doc.hoodieId;
    hoodie.database.add(name, callback);
  }

  /**
   * Event handlers
   */

  hoodie.account.on('user:change', function (doc) {
    async.applyEachSeries([createUserDB, confirmUser], doc, function (err) {
      if (err) {
        console.error('Error confirming user: %s', err);
        console.error(err);
        return;
      }
    });
  });

  // plugin initialization complete
  callback();

};
