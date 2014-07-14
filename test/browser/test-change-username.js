suite('change username', function () {

  setup(function (done) {
    // phantomjs seems to keep session data between runs,
    // so clear before running tests
    localStorage.clear();
    hoodie.account.signOut().done(function () {
      done();
    });
  });

  test('delete old user after username change', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('changename1', 'password')
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function (data) {
        hoodie.account.changeUsername('password', 'changename2')
          .fail(function (err) {
            assert.ok(false, err.message);
          })
          .done(function () {
            assert.equal(hoodie.account.username, 'changename2');
            // log in as admin
            $.ajax({
              type: 'POST',
              url: '/_api/_session',
              contentType: 'application/json',
              data: JSON.stringify({name: 'admin', password: 'testing'}, null, 4),
              processData: false
            })
            .fail(function (err) {
              assert.ok(false, err.message);
            })
            .done(function () {
              $.getJSON('/_api/_users/org.couchdb.user:user%2Fchangename1')
                .fail(function (err) {
                  $.getJSON('/_api/_users/org.couchdb.user:user%2Fchangename2')
                    .fail(function (err) {
                      assert.ok(false, err.message);
                    })
                    .done(function (data) {
                      done();
                    });
                })
                .done(function (data) {
                  assert.ok(false, 'expected 404 for old user');
                });
            });
          });
      });
  });

  test('login after username change', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('changename3', 'password')
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function (data) {
        hoodie.account.changeUsername('password', 'changename4')
          .then(function () {
            return hoodie.account.signOut()
          })
          .then(function () {
            return hoodie.account.signIn('changename4', 'password');
          })
          .fail(function (err) {
            assert.ok(false, err.message);
          })
          .done(function () {
            assert.equal(hoodie.account.username, 'changename4');
            done();
          });
      });
  });

  test('data carried over to new account', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('changename5', 'password')
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function (data) {
        hoodie.store.add('example', {id: 'foo', title: 'bar'})
          .then(function () {
            return hoodie.account.changeUsername('password', 'changename6')
          })
          .then(function () {
            return hoodie.account.signOut()
          })
          .then(function () {
            return hoodie.account.signIn('changename6', 'password');
          })
          .fail(function (err) {
            assert.ok(false, err.message);
          })
          .done(function () {
            assert.equal(hoodie.account.username, 'changename6');
            hoodie.store.find('example', 'foo')
              .fail(function (err) {
                assert.ok(false, err.message);
              })
              .done(function (data) {
                assert.equal(data.title, 'bar');
                var id = hoodie.id();
                $.getJSON('/_api/user%2F' + id + '/example%2Ffoo')
                  .fail(function (err) {
                    assert.ok(
                      false, 'failed to get user/' + id + ' example/foo doc'
                    );
                  })
                  .done(function (data2) {
                    assert.equal(data2.title, 'bar');
                    done();
                  });
              });
          });
      });
  });

});
