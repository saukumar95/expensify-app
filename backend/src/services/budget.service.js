const mongoose = require('mongoose')
const Budget      = require('../models/Budget')
const Category    = require('../models/Category')
const Transaction = require('../models/Transaction')
const AppError    = require('../utils/AppError')
const { toObjectId } = require('../utils/sanitize')

const toSafeInt = (value, fieldName) => {
    if (typeof value === 'object' || value === null) {
        throw new AppError(`${fieldName} must be a number`, 400, 'VALIDATION_ERROR')
    }
    const n = Number(value)
    if (!Number.isInteger(n)) {
        throw new AppError(`${fieldName} must be a number`, 400, 'VALIDATION_ERROR')
    }
    return n
}

const list = async (userId, year, month) => {
    const safeUserId = toObjectId(userId, 'userId')
    const safeYear   = toSafeInt(year, 'year')
    const safeMonth  = toSafeInt(month, 'month')

    const budgets = await Budget.find({ userId: safeUserId, year: safeYear, month: safeMonth })
        .populate('categoryId', 'name color icon')
        .lean()

    const start = new Date(safeYear, safeMonth - 1, 1)
    const end   = new Date(safeYear, safeMonth, 0, 23, 59, 59, 999)

    return Promise.all(
        budgets.map(async (b) => {
            // Cast categoryId to ObjectId before using in aggregate $match
            const safeCatId = new mongoose.Types.ObjectId(b.categoryId._id.toString())

            const [agg] = await Transaction.aggregate([
                {
                    $match: {
                        userId:     safeUserId,
                        categoryId: safeCatId,
                        type:       'expense',
                        date:       { $gte: start, $lte: end },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ])
            const spent = agg?.total || 0
            return {
                ...b,
                id:             b._id.toString(),
                category_id:    b.categoryId._id.toString(),
                category_name:  b.categoryId.name,
                category_color: b.categoryId.color,
                category_icon:  b.categoryId.icon,
                spent,
                remaining: b.amount - spent,
            }
        })
    )
}

const upsert = async (userId, { category_id, amount, year, month }) => {
    const safeUserId = toObjectId(userId, 'userId')
    const safeCatId  = toObjectId(category_id, 'category_id')
    const safeYear   = toSafeInt(year, 'year')
    const safeMonth  = toSafeInt(month, 'month')

    const cat = await Category.findOne({
        _id: safeCatId,
        $or: [{ isDefault: true }, { userId: safeUserId }],
    })
    if (!cat) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')

    await Budget.findOneAndUpdate(
        { userId: safeUserId, categoryId: safeCatId, year: safeYear, month: safeMonth },
        { amount },
        { upsert: true, new: true }
    )

    const all = await list(userId, safeYear, safeMonth)
    return all.find((b) => b.category_id === safeCatId.toString())
}

const remove = async (userId, id) => {
    const safeId     = toObjectId(id, 'budget id')
    const safeUserId = toObjectId(userId, 'userId')
    const result = await Budget.deleteOne({ _id: safeId, userId: safeUserId })
    if (result.deletedCount === 0) throw new AppError('Budget not found', 404, 'NOT_FOUND')
}

module.exports = { list, upsert, remove }
