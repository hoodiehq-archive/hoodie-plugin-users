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
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function () {
        hoodie.store.on('sync', function () {
          $.getJSON('/_api/_all_dbs')
            .fail(function (err) {
              assert.ok(false, err.message);
            })
            .done(function (data) {
              assert.notEqual(data.indexOf('user/' + hoodie.id()), -1);
              done();
            });
        });
        hoodie.store.add('example', {title: 'foo'});
      });
  });

});
