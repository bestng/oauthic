var slice = Array.prototype.slice

module.exports = EndpointError

function EndpointError (json) {
  var e = new Error

  e.name = 'EndpointError'

  if ('object' == typeof json) {
    Object.keys(json).forEach(function (key) {
      e[key] = json[key]
    })
  }

  return e
}
