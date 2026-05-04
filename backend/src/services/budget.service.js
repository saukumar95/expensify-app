const mongoose = require('mongoose')
const Budget      = require('../models/Budget')
const Category    = require('../models/Category')
const Transaction = require('../models/Transaction')
const AppError    = require('../utils/AppError')

const list = async (userId, year, month) => {
    const budgets = await Budget.find({ userId, year, month })
        .populate('categoryId', 'name color icon')
        .lean()

    // Attach actual spending for each budget
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59, 999)

    return Promise.all(
        budgets.map(async (b) => {
            const [agg] = await Transaction.aggregate([
                {
                    $match: {
                        userId:     new mongoose.Types.ObjectId(userId),
                        categoryId: b.categoryId._id,
                        type:       'expense',
                        date:       { $gte: start, $lte: end },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ])
            const spent = agg?.total || 0
            return {
                ...b,
                id:             b._id,
                category_name:  b.categoryId.name,
                category_color: b.categoryId.color,
                category_icon:  b.categoryId.icon,
                category_id:    b.categoryId._id,
                spent,
                remaining: b.amount - spent,
            }
        })
    )
}

const upsert = async (userId, { category_id, amount, year, month }) => {
    if (!mongoose.isValidObjectId(category_id)) {
        throw new AppError('Invalid category ID', 400, 'INVALID_ID')
    }

    const cat = await Category.findOne({
        _id: category_id,
        $or: [{ isDefault: true }, { userId }],
    })
    if (!cat) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')

    await Budget.findOneAndUpdate(
        { userId, categoryId: category_id, year, month },
        { amount },
        { upsert: true, new: true }
    )

    const all = await list(userId, year, month)
    return all.find((b) => b.category_id.toString() === category_id.toString())
}

const remove = async (userId, id) => {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')
    const result = await Budget.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) throw new AppError('Budget not found', 404, 'NOT_FOUND')
}

module.exports = { list, upsert, remove }
