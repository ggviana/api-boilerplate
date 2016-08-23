const jwt    = require('jsonwebtoken')
const config = require('../config')

const options = {
  algorithm: 'HS512',
  expiresIn: config.app.tokenExpiration
}

module.exports.create = object => {
  return new Promise((resolve, reject) => {
    jwt.sign(object, config.app.secret, options, (err, token) => {
      if (err) return reject(err)
      return resolve(token)
    })
  })
}

module.exports.validate = token => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.app.secret, (err, decoded) => {
      if (err) return reject(err)
      return resolve(decoded)
    })
  })
}