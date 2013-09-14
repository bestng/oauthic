var oauthic = require('../../')
  , request = oauthic._request

var inherits = require('util').inherits
  , stringify = require('querystring').stringify

var server = require('./server')

exports.client = exports.Client = Client
exports.TokenExpiredError = oauthic.TokenExpiredError
exports.EndpointError = oauthic.EndpointError

function Client (clientInfo) {
  if (!(this instanceof Client)) {
    return new Client(clientInfo)
  }

  oauthic.client.apply(this, arguments)
}

inherits(Client, oauthic.Client)

Client.prototype.BASE_URL = 'http://localhost:3000'

Client.prototype._authorize = function (options) {
  options = options || {}

  var query = {}

  query['client_id'] = this.clientId
  query['redirect_uri'] = this.redirectUri

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

Client.prototype._credentical = function (code, callback) {
  if ('make_error' === code) {
    return callback(new Error('I am an error.'))
  }

  request.post(this.BASE_URL + '/oauth2/token', { form: {
    'code': code
  , 'client_id': this.clientId
  , 'client_secret': this.clientSecret
  , 'redirect_uri': this.redirectUri
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
    , expiresAt: (server.token_created_at + json.expires_in) * 1000
    }, {
      id: json.user_id
    , picture: json.user_picture
    })
  })
}

Client.prototype._refresh = function (refreshToken, callback) {
  if ('make_error' === refreshToken) {
    return callback(new Error('I am an error.'))
  }

  request.post(this.BASE_URL + '/oauth2/token', { form: {
    'refresh_token': refreshToken
  , 'client_id': this.clientId
  , 'client_secret': this.clientSecret
  , 'redirect_uri': this.redirectUri
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
    , refreshToken: json.refresh_token
    , expiresAt: (server.token_created_at + json.expires_in) * 1000
    })
  })
}

Client.prototype._use = function (uri, options, method) {
  options.headers = options.headers || {}

  if (this.accessToken) {
    options.headers['Authorization'] = ['Bearer', this.accessToken].join(' ')
  }

  if ('undefined' == typeof options.json) {
    options.json = true
  }

  return uri
}
