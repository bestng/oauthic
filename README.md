OAuthic
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
