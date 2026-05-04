const mongoose = require('mongoose')
const Category    = require('../models/Category')
const Transaction = require('../models/Transaction')
const AppError    = require('../utils/AppError')

const list = async (userId) => {
    const cats = await Category.find({
        $or: [{ isDefault: true }, { userId }],
    })
        .sort({ isDefault: -1, name: 1 })
        .lean()

    // Normalise _id → id so the frontend can use c.id consistently
    return cats.map((c) => ({ ...c, id: c._id.toString() }))
}

const create = async (userId, { name, type, color, icon }) => {
    const existing = await Category.findOne({
        name,
        type,
        $or: [{ isDefault: true }, { userId }],
    })
    if (existing) throw new AppError('Category already exists', 409, 'CATEGORY_EXISTS')

    return Category.create({
        name,
        type,
        color: color || '#6b7280',
        icon:  icon  || 'tag',
        userId,
    })
}

const remove = async (userId, id) => {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

    const cat = await Category.findOne({ _id: id, userId, isDefault: false })
    if (!cat) throw new AppError('Category not found or not deletable', 404, 'NOT_FOUND')

    const inUse = await Transaction.countDocuments({ categoryId: id })
    if (inUse > 0) throw new AppError('Category is in use by transactions', 409, 'CATEGORY_IN_USE')

    await Category.deleteOne({ _id: id })
}

module.exports = { list, create, remove }
