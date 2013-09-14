var should = require('should')

var oauthic = require('../')

describe('oauthic.TokenExpiredError', function () {

  it('should be an instance of Error', function () {
    var err = new oauthic.TokenExpiredError
    err.should.be.an.instanceof(Error)
  })

  it('should named `TokenExpiredError`', function () {
    var err = new oauthic.TokenExpiredError
    err.should.have.property('name', 'TokenExpiredError')
  })

  it('should has property `token`', function () {
    var err = new oauthic.TokenExpiredError('the_token')
    err.should.have.property('token', 'the_token')
  })

  it('should trust last parameter as `token`', function () {
    var err = new oauthic.TokenExpiredError(1, 2, 3, 4, 5, 'the_token')
    err.should.have.property('token', 'the_token')
  })

})
