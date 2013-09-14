var should = require('should')
var oauthic = require('../')
  , request = require('request')

describe('oauthic.Client', function () {
  describe('interfaces', function () {

    it('should expose mikeal/request instance as `oauthic._request`', function () {
      oauthic.should.have.property('_request').with.equal(request)
    })

    describe('oauthic.client(clientInfo)', function () {

      it('should return new instance of oauthic.Client', function () {
        oauthic.client().should.be.an.instanceof(oauthic.Client)
      })

      it('should new Client without `new`', function () {
        oauthic.Client().should.be.an.instanceof(oauthic.Client)
      })

      it('should pass `clientInfo` to the new instance as a parameter', function () {
        var client = oauthic.client({ this_is: 'a_test_param'})
        should.exists(client)
        client.should.have.property('this_is', 'a_test_param')
      })

      it('should always create a new instance', function () {
        var instanceA = oauthic.client().token('token_a')
          , instanceB = oauthic.client()

        should.exists(instanceA)
        should.exists(instanceB)

        instanceA.accessToken.should.not.equal(instanceB.accessToken)
      })

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
})