const Category    = require('../models/Category')
const Transaction = require('../models/Transaction')
const AppError    = require('../utils/AppError')
const { toObjectId, toSafeString, toEnum } = require('../utils/sanitize')

const list = async (userId) => {
    const safeUserId = toObjectId(userId, 'userId')

    const cats = await Category.find({
        $or: [{ isDefault: true }, { userId: safeUserId }],
    })
        .sort({ isDefault: -1, name: 1 })
        .lean()

    return cats.map((c) => ({ ...c, id: c._id.toString() }))
}

const create = async (userId, { name, type, color, icon }) => {
    const safeUserId = toObjectId(userId, 'userId')
    const safeName   = toSafeString(name, 80)
    const safeType   = toEnum(type, ['income', 'expense'], null)
    const safeColor  = toSafeString(color, 20) || '#6b7280'
    const safeIcon   = toSafeString(icon, 50)  || 'tag'

    if (!safeName) throw new AppError('Category name is required', 400, 'VALIDATION_ERROR')
    if (!safeType) throw new AppError('Type must be income or expense', 400, 'VALIDATION_ERROR')

    const existing = await Category.findOne({
        name: safeName,
        type: safeType,
        $or: [{ isDefault: true }, { userId: safeUserId }],
    })
    if (existing) throw new AppError('Category already exists', 409, 'CATEGORY_EXISTS')

    return Category.create({
        name:   safeName,
        type:   safeType,
        color:  safeColor,
        icon:   safeIcon,
        userId: safeUserId,
    })
}

const remove = async (userId, id) => {
    const safeId     = toObjectId(id, 'category id')
    const safeUserId = toObjectId(userId, 'userId')

    const cat = await Category.findOne({ _id: safeId, userId: safeUserId, isDefault: false })
    if (!cat) throw new AppError('Category not found or not deletable', 404, 'NOT_FOUND')

    const inUse = await Transaction.countDocuments({ categoryId: safeId })
    if (inUse > 0) throw new AppError('Category is in use by transactions', 409, 'CATEGORY_IN_USE')

    await Category.deleteOne({ _id: safeId })
}

module.exports = { list, create, remove }
