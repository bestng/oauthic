var slice = Array.prototype.slice

module.exports = TokenExpiredError

function TokenExpiredError (/* ..., */token) {
  var e = Error.apply(Error, slice.call(arguments, 0, -1))
  e.name = 'TokenExpiredError'
  e.token = slice.call(arguments, -1)[0]
  return e
}
