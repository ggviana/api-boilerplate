const path = require('path')
const rootPath = path.normalize(__dirname)

const database = {
  user: 'USER',
  pass: 'PASS',
  host: 'localhost',
  port: 667
}

const env = process.env.NODE_ENV || 'development'

const configs = {
  development: {
    root: rootPath,
    app: {
      name: 'api-development',
      port: 3000,
      secret: 'bc2ad353f4f01b2629115119887d2c71d15ab5ba',
      tokenExpiration: '24h'
    },
    db: {
      connectionURI: `mssql://${database.user}:${database.pass}@${database.host}:${database.port}/development`
    }
  },

  test: {
    root: rootPath,
    app: {
      name: 'api-test',
      port: 3000,
      secret: 'bc2ad353f4f01b2629115119887d2c71d15ab5ba',
      tokenExpiration: '24h'
    },
    db: {
      connectionURI: `mssql://${database.user}:${database.pass}@${database.host}:${database.port}/development`
    }
  },

  production: {
    root: rootPath,
    app: {
      name: 'api',
      port: 3000,
      secret: 'bc2ad353f4f01b2629115119887d2c71d15ab5ba',
      tokenExpiration: '24h'
    },
    db: {
      connectionURI: `mssql://${database.user}:${database.pass}@${database.host}:${database.port}/production`
    }
  }
}

module.exports = configs[env]
