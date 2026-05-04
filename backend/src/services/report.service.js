const Transaction = require('../models/Transaction')
const { toObjectId, toSafeDate } = require('../utils/sanitize')

const getMonthlySummary = async (userId, year) => {
    const uid      = toObjectId(userId, 'userId')
    const safeYear = parseInt(year, 10)

    const rows = await Transaction.aggregate([
        {
            $match: {
                userId: uid,
                date: {
                    $gte: new Date(safeYear, 0, 1),
                    $lte: new Date(safeYear, 11, 31, 23, 59, 59, 999),
                },
            },
        },
        {
            $group: {
                _id:   { month: { $month: '$date' }, type: '$type' },
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.month': 1 } },
    ])

    const months = {}
    for (const r of rows) {
        const key = `${safeYear}-${String(r._id.month).padStart(2, '0')}`
        if (!months[key]) months[key] = { month: key, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 }
        months[key][r._id.type]           = r.total
        months[key][`${r._id.type}Count`] = r.count
    }

    return Object.values(months).map((m) => ({
        ...m,
        balance:     m.income - m.expense,
        savingsRate: m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0,
    }))
}

const exportCsv = async (userId, startDate, endDate) => {
    const uid = toObjectId(userId, 'userId')

    // toSafeDate validates YYYY-MM-DD format — breaks taint chain for date query values
    const safeStart = toSafeDate(startDate)
    const safeEnd   = toSafeDate(endDate)

    const filter = { userId: uid }
    if (safeStart || safeEnd) {
        filter.date = {}
        if (safeStart) filter.date.$gte = new Date(safeStart)
        if (safeEnd)   filter.date.$lte = new Date(safeEnd + 'T23:59:59.999Z')
    }

    const rows = await Transaction.find(filter)
        .populate('categoryId', 'name')
        .sort({ date: -1 })
        .lean()

    const header = 'Date,Type,Description,Category,Amount,Notes'
    const lines  = rows.map((r) => {
        const date     = r.date.toISOString().slice(0, 10)
        const category = r.categoryId?.name || ''
        const desc     = `"${r.description.replace(/"/g, '""')}"`
        const notes    = `"${(r.notes || '').replace(/"/g, '""')}"`
        return [date, r.type, desc, category, r.amount.toFixed(2), notes].join(',')
    })

    return [header, ...lines].join('\n')
}

module.exports = { getMonthlySummary, exportCsv }
