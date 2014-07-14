suite('create user db', function () {

  setup(function (done) {
    // phantomjs seems to keep session data between runs,
    // so clear before running tests
    localStorage.clear();
    hoodie.account.signOut().done(function () {
      done();
    });
  });

  test('user database added on signUp', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('dbtest', 'password')
      .then(function () {
        return $.getJSON('/_api/_all_dbs');
      })
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function (data) {
        assert.notEqual(data.indexOf('user/' + hoodie.id()), -1);
        done();
      });
  });

  test('user db is writable by user', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('dbtest2', 'password')
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function () {
        hoodie.store.add('example', {title: 'foo'})
          .fail(function (err) {
            assert.ok(false, err.message);
          })
          .done(function (doc) {
            setTimeout(function () {
              $.getJSON('/_api/user%2F' + hoodie.id() + '/example%2F' + doc.id)
                .fail(function (err) {
                  assert.ok(false, JSON.stringify(err));
                })
                .done(function (data) {
                  assert.equal(data.title, 'foo');
                  done();
                });
            }, 3000);
          });
      });
  });

  test('user db is not readable by anonymous users', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('dbtest3', 'password')
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function () {
        var otherId = hoodie.id();
        hoodie.account.signOut().done(function (doc) {
          $.getJSON('/_api/user%2F' + otherId)
            .fail(function (err) {
              assert.equal(err.status, 401, 'expects unauthorized');
              done();
            })
            .done(function (data) {
              assert.ok(false, 'should be unauthorized');
            });
        });
      });
  });

  test('user db is not readable by other users', function (done) {
    this.timeout(10000);
    var firstId;
    hoodie.account.signUp('dbtest4', 'password')
      .then(function () {
        firstId = hoodie.id();
        return hoodie.account.signOut();
      })
      .then(function () {
        return hoodie.account.signUp('dbtest5', 'password');
      })
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function () {
        assert.equal(hoodie.account.username, 'dbtest5');
        $.getJSON('/_api/user%2F' + firstId)
          .fail(function (err) {
            assert.equal(err.status, 401, 'expects unauthorized');
            done();
          })
          .done(function (data) {
            assert.ok(false, 'should be unauthorized');
          });
      });
  });

});
