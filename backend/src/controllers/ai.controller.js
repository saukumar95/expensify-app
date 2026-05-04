const aiService = require('../services/ai.service')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/AppError')

const categorize = asyncHandler(async (req, res) => {
    const { description } = req.body
    if (!description) throw new AppError('description is required', 422, 'VALIDATION_ERROR')
    const result = aiService.categorize(description)
    res.json({ success: true, data: result })
})

const getInsights = asyncHandler(async (req, res) => {
    const data = await aiService.getInsights(req.user.id)
    res.json({ success: true, data })
})

const getBudgetSuggestions = asyncHandler(async (req, res) => {
    const data = await aiService.getBudgetSuggestions(req.user.id)
    res.json({ success: true, data })
})

module.exports = { categorize, getInsights, getBudgetSuggestions }
