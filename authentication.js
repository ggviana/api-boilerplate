const router     = require('express').Router()
const mergePaths = require('../util/mergePaths')
const TokenUtils = require('../util/token-utils')

module.exports = router

const authenticationOptional = targetPath => {
  const paths = [
  ]

  return mergePaths(paths).test(targetPath)
}

const authenticationNotRequired = targetPath => {
  const paths = [
  ]

  return mergePaths(paths).test(targetPath)
}

router.all('*', (req, res, next) => {
  var token

  // Take anything that looks like a token
  token = req.body.api_token || req.query.api_token || req.headers['x-api-token'] || false

  // If request doesn't need to be authenticated then let it pass
  if ((authenticationOptional(req.path) && !token) || authenticationNotRequired(req.path)) {
    return next()
  }

  // At this point if the token was not sent, stop the request
  if (!token) {
    return res.status(401).send({
      message: 'No token provided'
    })
  }

  // Validate token

  TokenUtils
    .validate(token)
    .catch(error => {
      // If had error validating, stops request
      return res.status(401).send({
        message: 'Invalid token'
      })
    })
    .then(decoded => {
      // Else user is authenticated, let it pass
      req.user = decoded
      return next()
    })
})