suite('create anonymous user db', function () {

  setup(function (done) {
    // phantomjs seems to keep session data between runs,
    // so clear before running tests
    localStorage.clear();
    hoodie.account.signOut()
      .fail(function () { done(); })
      .done(function () { done(); });
  });

  test('anonymous user database added with task', function (done) {
    this.timeout(10000);
    hoodie.task.start('testtask', {title: 'foo'});
    setTimeout(function () {
      $.getJSON('/_api/_all_dbs')
        .fail(function (err) {
          assert.ok(false, err.message);
        })
        .done(function (data) {
          console.log(['anonymous user alldbs', data]);
          var dbname = 'user/' + hoodie.id();
          assert.notEqual(data.indexOf(dbname), -1);
          $.getJSON('/_api/' + encodeURIComponent(dbname) + '/_all_docs?' +
            'include_docs=true&' +
            'start_key=%22%24testtask%22&' +
            'end_key=%22%24testtask%7B%7D%22')
          .fail(function (err) {
            assert.ok(false, err.message);
          })
          .done(function (data) {
            console.log(['anonymous user data', data]);
            assert.equal(data.rows[0].doc.title, 'foo');
            done();
          });
        });
    }, 2000);
  });

});
