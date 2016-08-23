const mssql   = require('mssql')
const config  = require('./config')

module.exports.connect = () => mssql
  .connect(config.db.connectionURI)
