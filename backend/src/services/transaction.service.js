const mongoose = require('mongoose')
const Transaction = require('../models/Transaction')
const Category    = require('../models/Category')
const AppError    = require('../utils/AppError')
const { toObjectId, toSafeString, toEnum } = require('../utils/sanitize')
const { parsePagination, buildMeta } = require('../utils/pagination')

// CRUD

const list = async (userId, query) => {
    const { page, limit, offset } = parsePagination(query)

    // Sanitize every user-supplied filter value before building the query object
    const ownerFilter = { userId: toObjectId(userId, 'userId') }

    const filter = { ...ownerFilter }

    const safeType = toEnum(query.type, ['income', 'expense'], null)
    if (safeType) filter.type = safeType

    if (query.category_id) {
        filter.categoryId = toObjectId(query.category_id, 'category_id')
    }

    if (query.start_date || query.end_date) {
        filter.date = {}
        if (query.start_date) {
            const d = new Date(toSafeString(query.start_date, 10))
            if (!isNaN(d)) filter.date.$gte = d
        }
        if (query.end_date) {
            const d = new Date((toSafeString(query.end_date, 10) ?? '') + 'T23:59:59.999Z')
            if (!isNaN(d)) filter.date.$lte = d
        }
    }

    if (query.search) {
        // Escape regex special chars to prevent ReDoS
        const escaped = toSafeString(query.search, 100)
            ?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (escaped) {
            filter.$or = [
                { description: { $regex: escaped, $options: 'i' } },
                { notes:       { $regex: escaped, $options: 'i' } },
            ]
        }
    }

    const sortMap = { date: 'date', amount: 'amount', created_at: 'createdAt' }
    const sortField = sortMap[toEnum(query.sort, Object.keys(sortMap), 'date')] ?? 'date'
    const sortDir   = toEnum(query.order, ['asc', 'desc'], 'desc') === 'asc' ? 1 : -1

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
    const safeId     = toObjectId(id, 'transaction id')
    const safeUserId = toObjectId(userId, 'userId')

    const tx = await Transaction.findOne({ _id: safeId, userId: safeUserId })
        .populate('categoryId', 'name color icon')
        .lean()

    if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND')
    return _format(tx)
}

const create = async (userId, body) => {
    const safeUserId = toObjectId(userId, 'userId')
    await _assertCategory(body.category_id, safeUserId)

    const tx = await Transaction.create({
        userId:      safeUserId,
        type:        toEnum(body.type, ['income', 'expense'], 'expense'),
        amount:      body.amount,
        categoryId:  toObjectId(body.category_id, 'category_id'),
        description: toSafeString(body.description, 255),
        date:        new Date(body.date),
        tags:        Array.isArray(body.tags) ? body.tags.map((t) => toSafeString(t, 50)).filter(Boolean) : [],
        notes:       toSafeString(body.notes, 1000),
    })

    return getById(userId, tx._id)
}

const update = async (userId, id, body) => {
    const safeId     = toObjectId(id, 'transaction id')
    const safeUserId = toObjectId(userId, 'userId')

    const existing = await Transaction.findOne({ _id: safeId, userId: safeUserId })
    if (!existing) throw new AppError('Transaction not found', 404, 'NOT_FOUND')

    if (body.category_id) await _assertCategory(body.category_id, safeUserId)

    const updates = {}
    if (body.type        !== undefined) updates.type        = toEnum(body.type, ['income', 'expense'], existing.type)
    if (body.amount      !== undefined) updates.amount      = body.amount
    if (body.category_id !== undefined) updates.categoryId  = toObjectId(body.category_id, 'category_id')
    if (body.description !== undefined) updates.description = toSafeString(body.description, 255)
    if (body.date        !== undefined) updates.date        = new Date(body.date)
    if (body.tags        !== undefined) updates.tags        = Array.isArray(body.tags)
        ? body.tags.map((t) => toSafeString(t, 50)).filter(Boolean)
        : []
    if (body.notes !== undefined) updates.notes = toSafeString(body.notes, 1000)

    await Transaction.updateOne({ _id: safeId }, updates)
    return getById(userId, safeId)
}

const remove = async (userId, id) => {
    const safeId     = toObjectId(id, 'transaction id')
    const safeUserId = toObjectId(userId, 'userId')
    const result = await Transaction.deleteOne({ _id: safeId, userId: safeUserId })
    if (result.deletedCount === 0) throw new AppError('Transaction not found', 404, 'NOT_FOUND')
}

// Analytics

const getSummary = async (userId, year, month) => {
    const safeUserId = toObjectId(userId, 'userId')
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59, 999)

    const rows = await Transaction.aggregate([
        { $match: { userId: safeUserId, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ])

    const income  = rows.find((r) => r._id === 'income')?.total  || 0
    const expense = rows.find((r) => r._id === 'expense')?.total || 0
    const prefix  = `${year}-${String(month).padStart(2, '0')}`

    return { income, expense, balance: income - expense, month: prefix }
}

const getMonthlyTrend = async (userId, months = 6) => {
    const safeUserId = toObjectId(userId, 'userId')

    const rows = await Transaction.aggregate([
        { $match: { userId: safeUserId } },
        {
            $group: {
                _id:   { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
                total: { $sum: '$amount' },
            },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
    ])

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
    const safeUserId = toObjectId(userId, 'userId')
    const safeType   = toEnum(type, ['income', 'expense'], 'expense')
    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59, 999)

    return Transaction.aggregate([
        { $match: { userId: safeUserId, type: safeType, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        {
            $project: {
                _id: 0, id: '$_id',
                name:  '$category.name',
                color: '$category.color',
                icon:  '$category.icon',
                total: 1, count: 1,
            },
        },
        { $sort: { total: -1 } },
    ])
}

// helpers

const _assertCategory = async (categoryId, safeUserId) => {
    const safeCatId = toObjectId(categoryId, 'category_id')
    const cat = await Category.findOne({
        _id: safeCatId,
        $or: [{ isDefault: true }, { userId: safeUserId }],
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

module.exports = {
    list, getById, create, update, remove,
    getSummary, getMonthlyTrend, getCategoryBreakdown,
}
