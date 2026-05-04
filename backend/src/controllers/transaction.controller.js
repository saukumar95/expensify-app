const txService = require('../services/transaction.service')
const asyncHandler = require('../utils/asyncHandler')

const list = asyncHandler(async (req, res) => {
    const result = await txService.list(req.user.id, req.query)
    res.json({ success: true, ...result })
})

const getOne = asyncHandler(async (req, res) => {
    const tx = await txService.getById(req.user.id, req.params.id)
    res.json({ success: true, data: tx })
})

const create = asyncHandler(async (req, res) => {
    const tx = await txService.create(req.user.id, req.body)
    res.status(201).json({ success: true, data: tx })
})

const update = asyncHandler(async (req, res) => {
    const tx = await txService.update(req.user.id, req.params.id, req.body)
    res.json({ success: true, data: tx })
})

const remove = asyncHandler(async (req, res) => {
    await txService.remove(req.user.id, req.params.id)
    res.json({ success: true, message: 'Transaction deleted' })
})

const getSummary = asyncHandler(async (req, res) => {
    const now   = new Date()
    const year  = parseInt(req.query.year)  || now.getFullYear()
    const month = parseInt(req.query.month) || now.getMonth() + 1
    const data  = await txService.getSummary(req.user.id, year, month)
    res.json({ success: true, data })
})

const getMonthlyTrend = asyncHandler(async (req, res) => {
    const months = parseInt(req.query.months) || 6
    const data   = await txService.getMonthlyTrend(req.user.id, months)
    res.json({ success: true, data })
})

const getCategoryBreakdown = asyncHandler(async (req, res) => {
    const now   = new Date()
    const year  = parseInt(req.query.year)  || now.getFullYear()
    const month = parseInt(req.query.month) || now.getMonth() + 1
    const type  = req.query.type || 'expense'
    const data  = await txService.getCategoryBreakdown(req.user.id, year, month, type)
    res.json({ success: true, data })
})

module.exports = { list, getOne, create, update, remove, getSummary, getMonthlyTrend, getCategoryBreakdown }
