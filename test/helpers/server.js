var restify = restify = require('restify')
var server = exports = module.exports = restify.createServer()

server.use(restify.queryParser())
server.use(restify.bodyParser({ mapParams: false }))

var token_created_at = exports.token_created_at = Math.round(+new Date() / 1000)
  , token_expires_in = exports.token_expires_in = 5 * 60

server.post('/protected', function (req, res, next) {
  res.send({
    headers: req.headers
  , body: req.body
  , query: req.query
  })
  return next()
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
  else if ('correct_client_id' == req.body.client_id
    && 'correct_client_secret' == req.body.client_secret
    && 'refresh_token' == req.body.grant_type
    && 'old_refresh_token' == req.body.refresh_token) {
    res.send({
      'access_token': 'correct_token'
    , 'expires_in': token_expires_in
    , 'refresh_token': 'new_refresh_token'
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
