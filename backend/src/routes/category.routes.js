const router = require('express').Router()
const ctrl = require('../controllers/category.controller')

router.get('/',      ctrl.list)
router.post('/',     ctrl.create)
router.delete('/:id', ctrl.remove)

module.exports = router
