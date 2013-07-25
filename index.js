var request = exports._request = require('request')
  , inherits = require('util').inherits

exports.client = function (clientInfo) {
  return new Client(clientInfo)
}

function Client (clientInfo) {
  this.clientInfo = clientInfo
}

Client.prototype.BASE_URL = ''

Object.keys(request).forEach(function (key) {
  Client.prototype[key] = 'function' === typeof request[key]
                        ? request[key].bind(request)
                        : request[key]
})

!['get', 'post', 'put', 'patch', 'head', 'del'].forEach(function (key) {
  var original = Client.prototype[key]
  Client.prototype[key] = function (uri, options, callback) {
    if ('function' === typeof options) {
      callback = options
      options = {}
    }

    options = options || {}

    var self = this

    if (uri && 'string' === typeof uri && '/' === uri.slice(0, 1)) {
      uri = self.BASE_URL + uri
    }

    if (self.expiresAt && self.expiresAt - new Date() < 60000) {
      if (self.refreshToken && 'function' === typeof self._onRefreshed) {
        self._refresh(self.refreshToken, function (err, refreshed) {
          if (err) {
            if ('function' === typeof self._onExpired) {
              self._onExpired(self.accessToken)
            }
            return callback(err)
          }

          self._onRefreshed(refreshed.accessToken, refreshed.expiresAt, function (err) {
            if (err) {
              if ('function' === typeof self._onExpired) {
                self._onExpired(self.accessToken)
              }
              return callback(err)
            }

            self.accessToken = refreshed.accessToken
            self.expiresAt = refreshed.expiresAt

            self._use(options)

            return original(uri, options, callback)
          })
        })
      }
      else {
        if ('function' === typeof self._onExpired) {
          self._onExpired(self.accessToken)
        }
        return callback(new exports.TokenExpiredError(self.accessToken))
      }
    }
    else {
      if (self.accessToken) {
        self._use(options)
      }

      return original(uri, options, callback)
    }
  }
})

Client.prototype.authorize = function (options) {
  return this._authorize(options)
}

Client.prototype.credentical = function (code, callback) {
  var self = this

  self._credentical(code, function (err, credentical, userInfo) {
    if (err) {
      return callback(err)
    }

    self.accessToken = credentical.accessToken

    if (credentical.expiresAt) {
      self.expiresAt = new Date(credentical.expiresAt)
    }

    if (credentical.refreshToken) {
      self.refreshToken = credentical.refreshToken
    }

    return callback(null, credentical, userInfo)
  })

  return self
}

Client.prototype.token = function (accessToken, expiresAt) {
  this.accessToken = accessToken

  if (expiresAt) {
    this.expiresAt = new Date(expiresAt)
  }

  return this
}

Client.prototype.refresh = function (refreshToken, onRefreshed) {
  if ('function' === typeof refreshToken && !onRefreshed) {
    this._onRefreshed = refreshToken
  }
  else {
    this.refreshToken = refreshToken
    this._onRefreshed = onRefreshed
  }
  return this
}

Client.prototype.expired = function (onExpired) {
  this._onExpired = onExpired
  return this
}

Client.prototype._authorize = function (options) {
  throw new Error('You can\'t call this method without override it.')
}

Client.prototype._credentical = function (code, callback) {
  throw new Error('You can\'t call this method without override it.')
}

Client.prototype._refresh = function (refreshToken, callback) {
  throw new Error('You can\'t call this method without override it.')
}

Client.prototype._use = function (options) {
  throw new Error('You can\'t call this method without override it.')
}

exports.Client = Client

function TokenExpiredError (/* ..., */token) {
  Error.apply(this, [].slice.call(arguments, 0, -1))
  this.token = [].slice.call(arguments, -1)[0]
}

exports.TokenExpiredError = TokenExpiredError
inherits(TokenExpiredError, Error)

function extend (to, from) {
  Object.keys(from).forEach(function (key) {
    to[key] = form[key]
  })
}
