const router = require('express').Router()
const ctrl = require('../controllers/ai.controller')

router.post('/categorize',          ctrl.categorize)
router.get('/insights',             ctrl.getInsights)
router.get('/budget-suggestions',   ctrl.getBudgetSuggestions)

module.exports = router
