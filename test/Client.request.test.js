var should = require('should')
var server = require('./helpers/server')
var oauthic = require('./helpers/implement')

describe('oauthic.Client', function () {
  describe('request', function () {

    before(function (done) {
      server.listen(3000, done)
    })

    after(function () {
      server.close()
    })

    var client = oauthic.client({
      clientId: 'correct_client_id'
    , clientSecret: 'correct_client_secret'
    , redirectUri: 'correct_redirect_uri'
    })

    it('should request without token before authorize', function (done) {
      client.post('/protected', function (err, res, body) {
        should.not.exist(err)
        body.headers.should.not.have.property('authorization')
        done()
      })
    })

    it('should authorize with code', function (done) {
      client.credentical('correct_code', function (err, credentical, userInfo) {
        should.not.exist(err)
        credentical.accessToken.should.equal('correct_token')

        var expiresAt = +credentical.expiresAt
        expiresAt.should.equal(server.token_created_at * 1000
                             + server.token_expires_in * 1000)
        done()
      })
    })

    it('should request with token after authorized', function (done) {
      client.post('/protected', function (err, res, body) {
        should.not.exist(err)
        body.headers.should.have.property('authorization', 'Bearer correct_token')
        done()
      })
    })

  })
})