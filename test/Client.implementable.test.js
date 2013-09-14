var should = require('should')
var request = require('request')
var server = require('./helpers/server')
var oauthic = require('./helpers/implement')

describe('oauthic.Client', function () {
  describe('implementable', function () {

    before(function (done) {
      server.listen(3000, done)
    })

    after(function () {
      server.close()
    })

    describe('client.authorize([options])', function () {

      var client = oauthic.client({
        clientId: 'correct_client_id'
      , redirectUri: 'correct_redirect_uri'
      })

      it('should returns correct authorize url', function () {
        var url = client.authorize({ state: 'test' })
        url.should.be.a('string')
      })

    })

    describe('client.credentical(code, callback)', function () {

      var client = oauthic.client({
        clientId: 'correct_client_id'
      , clientSecret: 'correct_client_secret'
      , redirectUri: 'correct_redirect_uri'
      })

      it('should callback `credentical` and `userInfo` if success', function (done) {
        client.credentical('correct_code', function (err, credentical, userInfo) {
          should.not.exist(err)

          should.exist(credentical)
          should.exist(credentical.accessToken)
          should.exist(credentical.expiresAt)

          should.exist(userInfo)
          should.exist(userInfo.id)
          should.exist(userInfo.picture)

          done()
        })
      })

      it('should set `client.accessToken` after success', function () {
        client.should.have.property('accessToken', 'correct_token')
      })

      it('should error', function (done) {
        client.credentical('make_error', function (err, credentical, userInfo) {
          should.exist(err)
          done()
        })
      })

    })

    describe('client.token(accessToken[, expiresAt])', function () {

      var client = oauthic.client()

      it('should set `client.accessToken`', function () {
        client.token('token_for_test')
        client.should.have.property('accessToken', 'token_for_test')
      })

    })

    describe('client.refresh([refreshToken, ]onRefreshed)', function () {

      it('should be used to refresh when expired', function (done) {
        var client = oauthic.client({
          clientId: 'correct_client_id'
        , clientSecret: 'correct_client_secret'
        })

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('correct_refresh_token', function (refreshed, next) {
          next()
        })

        client.post('/protected', function (err, res, body) {
          should.not.exist(err)
          body.headers.should.have.property('authorization', 'Bearer correct_token')
          done()
        })
      })

      it('should bypass `refreshToken`', function (done) {
        var client = oauthic.client({
          clientId: 'correct_client_id'
        , clientSecret: 'correct_client_secret'
        })

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refreshToken = 'correct_refresh_token'

        client.refresh(function (refreshed, next) {
          next()
        })

        client.post('/protected', function (err, res, body) {
          should.not.exist(err)
          body.headers.should.have.property('authorization', 'Bearer correct_token')
          done()
        })
      })

      it('should call `onRefreshed` after refreshed and before request', function (done) {
        var i = 1
        var client = oauthic.client({
          clientId: 'correct_client_id'
        , clientSecret: 'correct_client_secret'
        })

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('correct_refresh_token', function (refreshed, next) {
          should.exist(refreshed.accessToken)
          refreshed.accessToken.should.equal('correct_token')

          should.exist(refreshed.expiresAt)
          refreshed.expiresAt.should.equal(server.token_created_at * 1000
                                         + server.token_expires_in * 1000)

          i = 2

          next()
        })

        client.post('/protected', function (err, res, body) {
          i.should.equal(2)
          done()
        })
      })

      it('should renew `client.accessToken` after refreshed', function (done) {
        var client = oauthic.client({
          clientId: 'correct_client_id'
        , clientSecret: 'correct_client_secret'
        })

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('correct_refresh_token', function (refreshed, next) {
          next()
        })

        client.post('/protected', function (err, res, body) {
          client.should.have.property('accessToken', 'correct_token')
          done()
        })
      })

      it('should not renew `client.accessToken` if error', function (done) {
        var client = oauthic.client({
          clientId: 'correct_client_id'
        , clientSecret: 'correct_client_secret'
        })

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('correct_refresh_token', function (refreshed, next) {
          next('i am an error')
        })

        client.post('/protected', function (err, res, body) {
          client.should.have.property('accessToken', 'expired_token')
          done()
        })
      })

      it('should renew `client.refreshToken` after refreshed', function (done) {
        var client = oauthic.client({
          clientId: 'correct_client_id'
        , clientSecret: 'correct_client_secret'
        })

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('old_refresh_token', function (refreshed, next) {
          next()
        })

        client.post('/protected', function (err, res, body) {
          client.should.have.property('refreshToken', 'new_refresh_token')
          done()
        })
      })

    })

    describe('client.expired(onExpired)', function () {

      it('should call `onExpired` if expired when request', function (done) {
        var i = 1
        var client = oauthic.client()

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.expired(function () {
          i.should.equal(2)
          done()
        })

        i = 2

        client.post('/protected', function (err, res, body) {})
      })

      it('should call `onExpired` when expired and `.refresh` fails', function (done) {
        var client = oauthic.client()

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('correct_refresh_token', function (refreshed, next) {
          next('i am an error')
        })

        client.expired(function (token) {
          should.exist(token)
          token.should.equal('expired_token')
          done()
        })

        client.post('/protected', function (err, res, body) {})
      })

      it('should call `onExpired` if error when refresh', function (done) {
        var client = oauthic.client()

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('make_error', function (refreshed, next) {
          next()
        })

        client.expired(function (token) {
          should.exist(token)
          token.should.equal('expired_token')
          done()
        })

        client.post('/protected', function (err, res, body) {})
      })

      it('should not call `onExpired` if refreshed successfully', function (done) {
        var client = oauthic.client({
          clientId: 'correct_client_id'
        , clientSecret: 'correct_client_secret'
        })

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('correct_refresh_token', function (refreshed, next) {
          next()
        })

        client.expired(function () {
          throw new Error('This callback should not be called')
        })

        client.post('/protected', function (err, res, body) {
          client.should.have.property('accessToken', 'correct_token')
          done()
        })
      })

    })

    describe('client.post(uri[, options][, callback])', function () {

      it('should callbacks `oauthic.TokenExpiredError` if expired', function (done) {
        var client = oauthic.client()

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.post('/protected', function (err, res, body) {
          should.exist(err)
          err.should.have.property('name', 'TokenExpiredError')
          err.should.have.property('token', 'expired_token')
          done()
        })
      })

      it('should callbacks with the error when refresh fails', function (done) {
        var client = oauthic.client()

        client.token('expired_token', (server.token_created_at - 60) * 1000)

        client.refresh('make_error', function (refreshed, next) {
          next()
        })

        client.post('/protected', function (err, res, body) {
          should.exist(err)
          done()
        })
      })

    })

  })
})

