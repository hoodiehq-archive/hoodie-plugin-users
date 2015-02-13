suite('delete user db on account.destroy', function () {

  setup(function (done) {
    // phantomjs seems to keep session data between runs,
    // so clear before running tests
    localStorage.clear();
    hoodie.account.signOut().done(function () {
      done();
    });
  });

  test('user db is removed', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('destroytest1', 'password')
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function () {
        var dburl = '/_api/user%2F' + hoodie.id();
        $.getJSON(dburl)
          .fail(function (err) {
            assert.ok(false, JSON.stringify(err));
          })
          .done(function (data) {
            assert.ok(data.db_name, 'get db info');
            hoodie.account.destroy()
              .fail(function (err) {
                assert.ok(false, '' + err);
              })
              .done(function () {
                setTimeout(function () {
                  $.ajax({
                    type: 'GET',
                    url: dburl,
                    dataType: 'json',
                    complete: function (req) {
                      // db should have been deleted
                      assert.equal(req.status, 404);
                      done();
                    }
                  });
                }, 1000);
              });
          });
      });
  });

  function enableAdditionalDbs(dbs, callback) {
    $.ajax({
      url: '/_api/app/config',
      type: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa('admin:testing')
      },
      dataType: 'json'
    })
      .fail(function(err) {
        assert.ok(false, err.message);
      })
      .done(function(doc) {
        doc.config.additional_user_dbs = dbs;
        $.ajax({
          url: '/_api/app/config',
          type: 'PUT',
          contentType: 'application/json',
          processData: false,
          data: JSON.stringify(doc),
          headers: {
            'Authorization': 'Basic ' + btoa('admin:testing')
          }
        }).fail(function(err) {
          assert.ok(false, err.message);
        }).done(function() {
          callback();
        });
      });
  }

  test('additional dbs are removed', function (done) {
    this.timeout(10000);

    var has_db = function (db, callback) {
      var dburl = '/_api/user%2F' + hoodie.id() + '-' + db;
      setTimeout(function() {
        $.ajax({
          type: 'GET',
          url: dburl,
          dataType: 'json',
          complete: function (req) {
            // db should have been deleted
            assert.equal(req.status, 404);
            callback();
          }
        });
      }, 1000);
    };

    enableAdditionalDbs(['photos', 'horses'], function() {
      hoodie.account.signUp('destroytest1', 'password')
        .fail(function (err) {
          assert.ok(false, err.message);
        })
        .done(function() {

          hoodie.account.destroy()
            .fail(function (err) {
              assert.ok(false, '' + err);
            })
            .done(function() {
              has_db('photos', function() {
                has_db('horses', function() {
                  done();
                });
              });
            });
        });
      });
    });

});
