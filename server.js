const express    = require('express')
const bodyParser = require('body-parser')
const compress   = require('compression')
const cors       = require('cors')
const glob       = require('glob')

module.exports = (name, rootPath, port) => {
  const server = express()

  // Responds with compression
  server.use(compress())

  // Add CORS headers to responses
  server.use(cors())

  // Parse request body content as JSON
  server.use(bodyParser.json())

  server.use(bodyParser.urlencoded({
      extended: true
  }))

  // Connect controllers
  glob.sync(`${rootPath}/controllers/*.js`)
      .forEach(controllerPath => server.use(require(controllerPath)))

  // If a path was not found, throw 404
  server.use((req, res, next) => {
      var err = new Error('Not Found')
      err.status = 404
      next(err)
  })

  // Enable debug mode if the enviroment is development
  if(server.get('env') === 'development'){
      server.use((err, req, res, next) => {
          res.status(err.status || 500).send({
              message: err.message,
              error: err,
              title: 'error'
          })
      })
  }

  // If any error was found, throw 500
  server.use((err, req, res, next) => {
      res.status(err.status || 500).send({
          message: err.message,
          error: {},
          title: 'error'
      })
  })

  // Use port defined in configurations
  server.listen(port)

  console.log(`${name} running at port ${port}`)

  return server
}