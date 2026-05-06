const router = require('express').Router()
const ctrl = require('../controllers/transaction.controller')
const validate = require('../middlewares/validate')
const { createTransactionSchema, updateTransactionSchema, filterSchema } = require('../validations/transaction.validation')

router.get('/',                  validate(filterSchema, 'query'), ctrl.list)
router.get('/summary',           ctrl.getSummary)
router.get('/trend',             ctrl.getMonthlyTrend)
router.get('/breakdown',         ctrl.getCategoryBreakdown)
router.get('/:id',               ctrl.getOne)
router.post('/',                 validate(createTransactionSchema), ctrl.create)
router.put('/:id',               validate(updateTransactionSchema), ctrl.update)
router.delete('/:id',            ctrl.remove)

module.exports = router
