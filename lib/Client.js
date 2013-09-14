var request = require('request')
  , TokenExpiredError = require('./TokenExpiredError')
  , EndpointError = require('./EndpointError')

module.exports = Client

function Client (clientInfo) {
  if (!(this instanceof Client)) {
    return new Client(clientInfo)
  }

  if ('object' == typeof clientInfo) {
    Object.keys(clientInfo).forEach(function (key) {
      this[key] = clientInfo[key]
    }, this)
  }
}

// base url for url shortcut
Client.prototype.BASE_URL = ''

// copies request.js
Object.keys(request).forEach(function (key) {
  Client.prototype[key] = 'function' === typeof request[key]
                        ? request[key].bind(request)
                        : request[key]
})

// modifies request methods to be oauthic
!['get', 'post', 'put', 'patch', 'head', 'del'].forEach(function (key) {
  var original = Client.prototype[key]

  Client.prototype[key] = function (uri, options, callback) {
    if ('function' === typeof options) {
      callback = options
      options = {}
    }

    options = options || {}

    var self = this

    // if uri is written in short-form, append it to base url
    if ('string' == typeof uri && '/' == uri.slice(0, 1)) {
      uri = self.BASE_URL + uri
    }

    // if it is about to expire in 1 minute
    if (self.expiresAt && (self.expiresAt - new Date()) < 1 * 60 * 1000) {
      // if it could be refresh, refresh it; otherwise, throw TokenExpiredError
      if (self.refreshToken && 'function' == typeof self._onRefreshed) {
        self._refresh(self.refreshToken, function (err, refreshed) {
          if (err) {
            if ('function' == typeof self._onExpired) {
              self._onExpired(self.accessToken)
            }
            return callback(err)
          }

          self._onRefreshed(refreshed, function (err) {
            if (err) {
              if ('function' == typeof self._onExpired) {
                self._onExpired(self.accessToken)
              }
              return callback(err)
            }

            self.accessToken = refreshed.accessToken

            if (refreshed.expiresAt) {
              self.expiresAt = refreshed.expiresAt
            }

            if (refreshed.refreshToken) {
              self.refreshToken = refreshed.refreshToken
            }

            uri = self._use(uri, options, key) || uri
            return original(uri, options, callback)
          })
        })
      }
      else {
        if ('function' == typeof self._onExpired) {
          self._onExpired(self.accessToken)
        }
        return callback(new TokenExpiredError(self.accessToken))
      }
    }
    else {
      uri = self._use(uri, options, key) || uri
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
  if ('function' == typeof refreshToken && !onRefreshed) {
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
