const router = require('express').Router()
const ctrl = require('../controllers/report.controller')

router.get('/monthly', ctrl.monthlySummary)
router.get('/export',  ctrl.exportCsv)

module.exports = router
