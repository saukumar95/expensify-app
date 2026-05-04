const budgetService = require('../services/budget.service')
const asyncHandler = require('../utils/asyncHandler')

const list = asyncHandler(async (req, res) => {
    const now   = new Date()
    const year  = parseInt(req.query.year)  || now.getFullYear()
    const month = parseInt(req.query.month) || now.getMonth() + 1
    const data  = await budgetService.list(req.user.id, year, month)
    res.json({ success: true, data })
})

const upsert = asyncHandler(async (req, res) => {
    const data = await budgetService.upsert(req.user.id, req.body)
    res.json({ success: true, data })
})

const remove = asyncHandler(async (req, res) => {
    await budgetService.remove(req.user.id, req.params.id)
    res.json({ success: true, message: 'Budget deleted' })
})

module.exports = { list, upsert, remove }
