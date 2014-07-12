suite('password reset', function () {

  setup(function (done) {
    // phantomjs seems to keep session data between runs,
    // so clear before running tests
    localStorage.clear();
    hoodie.account.signOut().done(function () {
      done();
    });
  });

  test('user does not exist', function (done) {
    this.timeout(30000);
    hoodie.account.resetPassword('userdoesnotexist')
      .fail(function (err) {
        console.log(['FAIL', err]);
        assert.ok(/user userdoesnotexist could not be found/.test(err.message));
        assert.equal(err.error, 'not_found');
        done();
      })
      .done(function () {
        console.log('DONE');
        assert.ok(false, 'expected error');
      });
  });

  /*
  test('reset password', function (done) {
    this.timeout(10000);
    hoodie.account.signUp('reset-testuser', 'password')
      .fail(function (err) {
        assert.ok(false, err.message);
      })
      .done(function () {
        assert.equal(
          hoodie.account.username,
          'reset-testuser',
          'should be logged in after signup'
        );
        hoodie.account.sign
        done();
      });
  });
  */

});
