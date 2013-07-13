OAuthic [![Build Status](https://travis-ci.org/bestng/oauthic.png?branch=master)](https://travis-ci.org/bestng/oauthic) [![Coverage Status](https://coveralls.io/repos/bestng/oauthic/badge.png)](https://coveralls.io/r/bestng/oauthic) [![Dependency Status](https://david-dm.org/bestng/oauthic.png)](https://david-dm.org/bestng/oauthic) [![NPM version](https://badge.fury.io/js/oauthic.png)](http://badge.fury.io/js/oauthic)
==========

This module is used by other `oauthic-*` modules as a base module only. You may not be interested in it.

## oauthic.client(clientInfo)

## Class: oauthic.Client

### client.authorize([options])

### client.credentical(code, callback)

### client.token(accessToken[, expiresAt])

### client.refresh([refreshToken, ]onRefreshed)

### client.expired(onExpired)

### client.accessToken

## Class: oauthic.TokenExpiredError

## oauthic.authorize(clientInfo, [options])

## oauthic.credentical(clientInfo, code, callback)

## oauthic.refresh(clientInfo, refreshToken, callback)

## oauthic.use(accessToken, options)
