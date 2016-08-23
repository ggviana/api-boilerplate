const db       = require('./db')
const config   = require('./config')
const schedule = require('./schedule')
const server   = require('./server')

db.connect()
  // Starts a new server
  .then(() => {
    server(config.app.name, config.root, config.app.port)
  })
  // Starts scheduled tasks
  .then(() => schedule.start())
  // There was a connection error
  .catch(error => {
    console.log(error)
  })