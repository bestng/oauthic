var should = require('should')

var restify = require('restify')
  , request = require('request')
  , stringify = require('querystring').stringify

var oauthic = require('../')

//
// prepares test server
//

var server = restify.createServer()

server.use(restify.queryParser())
server.use(restify.bodyParser({ mapParams: false }))

var token_created_at = Math.round(+new Date() / 1000)
  , token_expires_in = 5 * 60

server.post('/protected', function (req, res, next) {
  if ('Bearer correct_token' == req.header('authorization')) {
    res.send(200, 'token:correct_token')
    return next()
  }
  else {
    res.send(400, 'wrong')
    return next()
  }
})

server.post('/oauth2/token', function (req, res, next) {
  if ('correct_client_id' == req.body.client_id
    && 'correct_client_secret' == req.body.client_secret
    && 'authorization_code' == req.body.grant_type
    && 'correct_code' == req.body.code
    && 'correct_redirect_uri' == req.body.redirect_uri) {
    res.send({
      'access_token': 'correct_token'
    , 'expires_in': token_expires_in
    , 'refresh_token': 'correct_refresh_token'
    , 'user_id': 12345678
    , 'user_picture': 'picture_of_user'
    })
    return next()
  }
  else if ('correct_client_id' == req.body.client_id
    && 'correct_client_secret' == req.body.client_secret
    && 'refresh_token' == req.body.grant_type
    && 'correct_refresh_token' == req.body.refresh_token) {
    res.send({
      'access_token': 'correct_token'
    , 'expires_in': token_expires_in
    })
    return next()
  }
  else {
    res.send({
      'error': 'wrong param'
    })
    return next()
  }
})

//
// test cases
//

describe('oauthic.test.js', function () {

  before(function (done) {
    server.listen(0, function () {
      oauthic.Client.prototype.BASE_URL = 'http://localhost:'
                                        + server.address().port
      done()
    })
  })

  after(function () {
    server.close()
  })

  describe('interfaces', function () {

    it('should expose mikeal/request instance as `oauthic._request`', function () {
      oauthic.should.have.property('_request').with.equal(request)
    })

    describe('oauthic.Client.prototype._authorize()', function () {
      it('should throw without implementing', function () {
        oauthic.Client.prototype._authorize.should.throw()
      })
    })

    describe('oauthic.Client.prototype._credentical()', function () {
      it('should throw without implementing', function () {
        oauthic.Client.prototype._credentical.should.throw()
      })
    })

    describe('oauthic.Client.prototype._refresh()', function () {
      it('should throw without implementing', function () {
        oauthic.Client.prototype._refresh.should.throw()
      })
    })

    describe('oauthic.Client.prototype._use()', function () {
      it('should throw without implementing', function () {
        oauthic.Client.prototype._use.should.throw()
      })
    })

  })

  describe('lib', function () {

    before(function () {
      oauthic.Client.prototype._authorize = function (options) {
        this.clientInfo = this.clientInfo || {}
        options = options || {}

        var query = {}

        query['client_id'] = this.clientInfo.clientId
        query['redirect_uri'] = this.clientInfo.redirectUri

        if (options.scope) {
          query['scope'] = Array.isArray(options.scope)
                          ? options.scope.join(' ')
                          : options.scope
        }

        if (options.state) {
          query['state'] = String(options.state)
        }

        return this.BASE_URL + '/oauth2/authorize?' + stringify(query)
      }

      oauthic.Client.prototype._credentical = function (code, callback) {
        this.clientInfo = this.clientInfo || {}

        if ('make_error' === code) {
          return callback(new Error('I am an error.'))
        }

        request.post(this.BASE_URL + '/oauth2/token', { form: {
          'code': code
        , 'client_id': this.clientInfo.clientId
        , 'client_secret': this.clientInfo.clientSecret
        , 'redirect_uri': this.clientInfo.redirectUri
        , 'grant_type': 'authorization_code'
        }}, function (err, res, body) {
          if (err) {
            return callback(err)
          }

          var json
          try {
            json = JSON.parse(body)
          }
          catch (e) {
            return callback(e)
          }

          callback(null, {
            accessToken: json.access_token
          , refreshToken: json.refresh_token
          , expiresAt: (token_created_at + json.expires_in) * 1000
          }, {
            id: json.user_id
          , picture: json.user_picture
          })
        })
      }

      oauthic.Client.prototype._refresh = function (refreshToken, callback) {
        this.clientInfo = this.clientInfo || {}

        if ('make_error' === refreshToken) {
          return callback(new Error('I am an error.'))
        }

        request.post(this.BASE_URL + '/oauth2/token', { form: {
          'refresh_token': refreshToken
        , 'client_id': this.clientInfo.clientId
        , 'client_secret': this.clientInfo.clientSecret
        , 'redirect_uri': this.clientInfo.redirectUri
        , 'grant_type': 'refresh_token'
        }}, function (err, res, body) {
          if (err) {
            return callback(err)
          }

          var json
          try {
            json = JSON.parse(body)
          }
          catch (e) {
            return callback(e)
          }

          callback(null, {
            accessToken: json.access_token
          , expiresAt: (token_created_at + json.expires_in) * 1000
          })
        })
      }

      oauthic.Client.prototype._use = function (options) {
        options.headers = options.headers || {}

        if (this.accessToken) {
          options.headers['Authorization'] = ['Bearer', this.accessToken].join(' ')
        }

        return options
      }
    })

    describe('oauthic.client(clientInfo)', function () {

      it('should return new instance of oauthic.Client', function () {
        oauthic.client().should.be.an.instanceof(oauthic.Client)
      })

      it('should pass `clientInfo` to the new instance as a parameter', function () {
        var client = oauthic.client({ this_is: 'a_test_param'})
        should.exists(client)
        should.exists(client.clientInfo)
        should.exists(client.clientInfo.this_is)
        client.clientInfo.this_is.should.equal('a_test_param')
      })

      it('should always create a new instance', function () {
        var instanceA = oauthic.client().token('token_a')
          , instanceB = oauthic.client()

        should.exists(instanceA)
        should.exists(instanceB)

        instanceA.accessToken.should.not.equal(instanceB.accessToken)
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

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (token, expiresAt, next) {
            next()
          })

          client.post('/protected', function (err, res, body) {
            should.not.exist(err)
            should.exist(body)
            body.should.equal('"token:correct_token"')
            done()
          })
        })

        it('should bypass `refreshToken`', function (done) {
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refreshToken = 'correct_refresh_token'

          client.refresh(function (token, expiresAt, next) {
            next()
          })

          client.post('/protected', function (err, res, body) {
            should.not.exist(err)
            should.exist(body)
            body.should.equal('"token:correct_token"')
            done()
          })
        })

        it('should call `onRefreshed` after refreshed and before request', function (done) {
          var i = 1
          var client = oauthic.client({
            clientId: 'correct_client_id'
          , clientSecret: 'correct_client_secret'
          })

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (token, expiresAt, next) {
            should.exist(token)
            token.should.equal('correct_token')

            should.exist(expiresAt)
            expiresAt.should.equal(token_created_at * 1000
                                 + token_expires_in * 1000)

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

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (token, expiresAt, next) {
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

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (token, expiresAt, next) {
            next('i am an error')
          })

          client.post('/protected', function (err, res, body) {
            client.should.have.property('accessToken', 'expired_token')
            done()
          })
        })

      })

      describe('client.expired(onExpired)', function () {

        it('should call `onExpired` if expired when request', function (done) {
          var i = 1
          var client = oauthic.client()

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.expired(function () {
            i.should.equal(2)
            done()
          })

          i = 2

          client.post('/protected', function (err, res, body) {})
        })

        it('should call `onExpired` when expired and `.refresh` fails', function (done) {
          var client = oauthic.client()

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (token, expiresAt, next) {
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

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('make_error', function (token, expiresAt, next) {
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

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('correct_refresh_token', function (token, expiresAt, next) {
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

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.post('/protected', function (err, res, body) {
            should.exist(err)
            err.should.be.an.instanceof(oauthic.TokenExpiredError)

            should.exist(err.token)
            err.token.should.equal('expired_token')

            done()
          })
        })

        it('should callbacks with the error when refresh fails', function (done) {
          var client = oauthic.client()

          client.token('expired_token', (token_created_at - 60) * 1000)

          client.refresh('make_error', function (token, expiresAt, next) {
            next()
          })

          client.post('/protected', function (err, res, body) {
            should.exist(err)
            done()
          })
        })

      })
    })

    describe('oauthic.TokenExpiredError', function () {

      it('should has property `token`', function () {
        var err = new oauthic.TokenExpiredError('the_token')
        err.should.have.property('token', 'the_token')
      })

      it('should trust last parameter as `token`', function () {
        var err = new oauthic.TokenExpiredError(1, 2, 3, 4, 5, 'the_token')
        err.should.have.property('token', 'the_token')
      })

    })
  })

  describe('oauth2', function () {

    var client = oauthic.client({
      clientId: 'correct_client_id'
    , clientSecret: 'correct_client_secret'
    , redirectUri: 'correct_redirect_uri'
    })

    it('should request without token before authorize', function (done) {
      client.post('/protected', function (err, res, body) {
        should.not.exist(err)
        should.exist(body)
        done()
      })
    })

    it('should authorize with code', function (done) {
      client.credentical('correct_code', function (err, credentical, userInfo) {
        should.not.exist(err)
        credentical.accessToken.should.equal('correct_token')

        var expiresAt = +credentical.expiresAt
        expiresAt.should.equal(token_created_at * 1000
                             + token_expires_in * 1000)
        done()
      })
    })

    it('should request with token after authorized', function (done) {
      client.post('/protected', function (err, res, body) {
        should.not.exist(err)
        should.exist(body)
        body.should.equal('"token:correct_token"')
        done()
      })
    })

  })
})

