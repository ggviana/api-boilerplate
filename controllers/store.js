const router                = require('express').Router()
const Store                 = require('../services/store')
const getOptionsFromRequest = require('../util/query-utils').getOptionsFromRequest

module.exports = router

router.get('/stores/:id', (req, res) => {

  Store.findById(req.params.id)
    .then(store => res.send(store))
    .catch(error => res.status(404).send())
})

router.get('/stores', (req, res) => {
  const options = getOptionsFromRequest(req)

  Store.find(options)
    .then(stores => res.send(stores))
    .catch(error => res.status(500).send(error))
})

router.post('/stores', (req, res) => {

  Store.create(req.body)
    .then(store => res.send(store))
    .catch(error => res.status(500).send(error))
})

router.put('/stores/:id', (req, res) => {

  Store.findById(req.params.id)
    .catch(error => res.status(404).send())
    .then(store => Store.update(store, req.body))
    .then(store => res.send(store))
    .catch(error => res.status(500).send(error))
})