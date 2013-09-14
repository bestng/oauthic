var should = require('should')

var oauthic = require('../')

describe('oauthic.EndpointError', function () {

  it('should be an instance of Error', function () {
    var err = new oauthic.EndpointError
    err.should.be.an.instanceof(Error)
  })

  it('should named `EndpointError`', function () {
    var err = new oauthic.EndpointError
    err.should.have.property('name', 'EndpointError')
  })

  it('should accepts json', function () {
    var err = new oauthic.EndpointError({ 'hahaha': true })
    err.should.have.property('hahaha', true)
  })

})
