const reportService = require('../services/report.service')
const asyncHandler = require('../utils/asyncHandler')

const monthlySummary = asyncHandler(async (req, res) => {
    const year = parseInt(req.query.year) || new Date().getFullYear()
    const data = await reportService.getMonthlySummary(req.user.id, year)
    res.json({ success: true, data })
})

const exportCsv = asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query
    const csv = await reportService.exportCsv(req.user.id, start_date, end_date)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"')
    res.send(csv)
})

module.exports = { monthlySummary, exportCsv }
