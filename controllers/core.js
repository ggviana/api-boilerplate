const router = require('express').Router()
const Core  = require('../services/core')

module.exports = router

router.get('/core/menu', (req, res) => {

  Core.findActiveActions()
    .then(modules => {
      res.send(modules)
    })
    .catch(error => res.status(404).send())
})
