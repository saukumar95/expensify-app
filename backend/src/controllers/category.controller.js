const categoryService = require('../services/category.service')
const asyncHandler = require('../utils/asyncHandler')

const list = asyncHandler(async (req, res) => {
    const data = await categoryService.list(req.user.id)
    res.json({ success: true, data })
})

const create = asyncHandler(async (req, res) => {
    const data = await categoryService.create(req.user.id, req.body)
    res.status(201).json({ success: true, data })
})

const remove = asyncHandler(async (req, res) => {
    await categoryService.remove(req.user.id, req.params.id)
    res.json({ success: true, message: 'Category deleted' })
})

module.exports = { list, create, remove }
