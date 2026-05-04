const mongoose = require('mongoose')
const Transaction = require('../models/Transaction')
const Category    = require('../models/Category')
const AppError    = require('../utils/AppError')
const { parsePagination, buildMeta } = require('../utils/pagination')

// CRUD

const list = async (userId, query) => {
    const { page, limit, offset } = parsePagination(query)

    const filter = { userId }
    if (query.type)        filter.type = query.type
    if (query.category_id) filter.categoryId = query.category_id
    if (query.start_date || query.end_date) {
        filter.date = {}
        if (query.start_date) filter.date.$gte = new Date(query.start_date)
        if (query.end_date)   filter.date.$lte = new Date(query.end_date + 'T23:59:59.999Z')
    }
    if (query.search) {
        filter.$or = [
            { description: { $regex: query.search, $options: 'i' } },
            { notes:       { $regex: query.search, $options: 'i' } },
        ]
    }

    const sortMap = { date: 'date', amount: 'amount', created_at: 'createdAt' }
    const sortField = sortMap[query.sort] || 'date'
    const sortDir   = query.order === 'asc' ? 1 : -1

    const [total, rows] = await Promise.all([
        Transaction.countDocuments(filter),
        Transaction.find(filter)
            .populate('categoryId', 'name color icon')
            .sort({ [sortField]: sortDir })
            .skip(offset)
            .limit(limit)
            .lean(),
    ])

    return { data: rows.map(_format), meta: buildMeta(total, page, limit) }
}

const getById = async (userId, id) => {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

    const tx = await Transaction.findOne({ _id: id, userId })
        .populate('categoryId', 'name color icon')
        .lean()

    if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND')
    return _format(tx)
}

const create = async (userId, body) => {
    await _assertCategory(body.category_id, userId)

    const tx = await Transaction.create({
        userId,
        type:        body.type,
        amount:      body.amount,
        categoryId:  body.category_id,
        description: body.description,
        date:        new Date(body.date),
        tags:        body.tags || [],
        notes:       body.notes || null,
    })

    return getById(userId, tx._id)
}

const update = async (userId, id, body) => {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')

    const existing = await Transaction.findOne({ _id: id, userId })
    if (!existing) throw new AppError('Transaction not found', 404, 'NOT_FOUND')

    if (body.category_id) await _assertCategory(body.category_id, userId)

    const updates = {}
    if (body.type        !== undefined) updates.type        = body.type
    if (body.amount      !== undefined) updates.amount      = body.amount
    if (body.category_id !== undefined) updates.categoryId  = body.category_id
    if (body.description !== undefined) updates.description = body.description
    if (body.date        !== undefined) updates.date        = new Date(body.date)
    if (body.tags        !== undefined) updates.tags        = body.tags
    if (body.notes       !== undefined) updates.notes       = body.notes

    await Transaction.updateOne({ _id: id }, updates)
    return getById(userId, id)
}

const remove = async (userId, id) => {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid ID', 400, 'INVALID_ID')
    const result = await Transaction.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) throw new AppError('Transaction not found', 404, 'NOT_FOUND')
}

// Analytics

const getSummary = async (userId, year, month) => {
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59, 999)

    const rows = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ])

    const income  = rows.find((r) => r._id === 'income')?.total  || 0
    const expense = rows.find((r) => r._id === 'expense')?.total || 0
    const prefix  = `${year}-${String(month).padStart(2, '0')}`

    return { income, expense, balance: income - expense, month: prefix }
}

const getMonthlyTrend = async (userId, months = 6) => {
    const rows = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id:   { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
                total: { $sum: '$amount' },
            },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
    ])

    // Pivot into { month, income, expense }
    const map = {}
    for (const r of rows) {
        const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`
        if (!map[key]) map[key] = { month: key, income: 0, expense: 0 }
        map[key][r._id.type] = r.total
    }

    return Object.values(map)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-months)
}

const getCategoryBreakdown = async (userId, year, month, type = 'expense') => {
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59, 999)

    return Transaction.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                type,
                date: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id:   '$categoryId',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from:         'categories',
                localField:   '_id',
                foreignField: '_id',
                as:           'category',
            },
        },
        { $unwind: '$category' },
        {
            $project: {
                _id:   0,
                id:    '$_id',
                name:  '$category.name',
                color: '$category.color',
                icon:  '$category.icon',
                total: 1,
                count: 1,
            },
        },
        { $sort: { total: -1 } },
    ])
}

// helpers

const _assertCategory = async (categoryId, userId) => {
    if (!mongoose.isValidObjectId(categoryId)) {
        throw new AppError('Invalid category ID', 400, 'INVALID_ID')
    }
    const cat = await Category.findOne({
        _id: categoryId,
        $or: [{ isDefault: true }, { userId }],
    })
    if (!cat) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND')
}

const _format = (tx) => ({
    ...tx,
    id:             tx._id.toString(),
    _id:            tx._id.toString(),
    date:           tx.date instanceof Date ? tx.date.toISOString().slice(0, 10) : tx.date,
    category_id:    (tx.categoryId?._id || tx.categoryId)?.toString() || null,
    category_name:  tx.categoryId?.name  || null,
    category_color: tx.categoryId?.color || null,
    category_icon:  tx.categoryId?.icon  || null,
})

module.exports = { list, getById, create, update, remove, getSummary, getMonthlyTrend, getCategoryBreakdown }
