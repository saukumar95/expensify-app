const router = require('express').Router()
const ctrl = require('../controllers/budget.controller')
const validate = require('../middlewares/validate')
const { upsertBudgetSchema } = require('../validations/budget.validation')

router.get('/',      ctrl.list)
router.post('/',     validate(upsertBudgetSchema), ctrl.upsert)
router.delete('/:id', ctrl.remove)

module.exports = router
