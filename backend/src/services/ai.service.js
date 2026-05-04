const mongoose = require('mongoose')
const Transaction = require('../models/Transaction')
const Budget      = require('../models/Budget')

// Rule-based categorization 

const KEYWORD_MAP = [
    { keywords: ['salary', 'payroll', 'wage', 'paycheck'],                    category: 'Salary',        type: 'income'  },
    { keywords: ['freelance', 'contract', 'consulting', 'invoice'],           category: 'Freelance',     type: 'income'  },
    { keywords: ['dividend', 'stock', 'investment', 'interest', 'return'],    category: 'Investment',    type: 'income'  },
    { keywords: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food',
                 'lunch', 'dinner', 'breakfast', 'grocery', 'supermarket',
                 'uber eats', 'doordash', 'grubhub', 'takeout'],              category: 'Food',          type: 'expense' },
    { keywords: ['uber', 'lyft', 'taxi', 'bus', 'metro', 'subway', 'train',
                 'gas', 'fuel', 'parking', 'toll', 'transport'],              category: 'Transport',     type: 'expense' },
    { keywords: ['amazon', 'ebay', 'shopping', 'clothes', 'shoes', 'mall',
                 'store', 'purchase', 'buy', 'order'],                        category: 'Shopping',      type: 'expense' },
    { keywords: ['doctor', 'hospital', 'pharmacy', 'medicine', 'health',
                 'dental', 'clinic', 'medical', 'prescription'],              category: 'Health',        type: 'expense' },
    { keywords: ['netflix', 'spotify', 'hulu', 'disney', 'cinema', 'movie',
                 'game', 'concert', 'entertainment', 'subscription'],         category: 'Entertainment', type: 'expense' },
    { keywords: ['rent', 'electricity', 'water', 'internet', 'phone',
                 'utility', 'bill', 'insurance', 'mortgage'],                 category: 'Bills',         type: 'expense' },
    { keywords: ['course', 'book', 'tuition', 'school', 'university',
                 'education', 'training', 'udemy', 'coursera'],               category: 'Education',     type: 'expense' },
    { keywords: ['flight', 'hotel', 'airbnb', 'travel', 'vacation',
                 'trip', 'booking', 'airline'],                               category: 'Travel',        type: 'expense' },
]

const categorize = (description) => {
    const lower = description.toLowerCase()
    for (const rule of KEYWORD_MAP) {
        if (rule.keywords.some((kw) => lower.includes(kw))) {
            return { category: rule.category, type: rule.type, confidence: 'high' }
        }
    }
    return { category: 'Other', type: 'expense', confidence: 'low' }
}

// Spending insights 

const getInsights = async (userId) => {
    const insights = []
    const uid = new mongoose.Types.ObjectId(userId)

    const now       = new Date()
    const thisYear  = now.getFullYear()
    const thisMonth = now.getMonth() + 1
    const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1
    const lastYear  = thisMonth === 1 ? thisYear - 1 : thisYear

    const monthRange = (y, m) => ({
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59, 999),
    })

    const sumByType = async (y, m, type) => {
        const [r] = await Transaction.aggregate([
            { $match: { userId: uid, type, date: monthRange(y, m) } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        return r?.total || 0
    }

    // 1. Month-over-month total expense change
    const [thisExpense, lastExpense] = await Promise.all([
        sumByType(thisYear, thisMonth, 'expense'),
        sumByType(lastYear, lastMonth, 'expense'),
    ])

    if (lastExpense > 0) {
        const pct = ((thisExpense - lastExpense) / lastExpense) * 100
        if (Math.abs(pct) >= 5) {
            insights.push({
                type:    pct > 0 ? 'warning' : 'positive',
                title:   pct > 0 ? 'Spending increased' : 'Spending decreased',
                message: `Your total expenses ${pct > 0 ? 'increased' : 'decreased'} by ${Math.abs(pct).toFixed(0)}% compared to last month.`,
                value:   pct,
            })
        }
    }

    // 2. Top spending category this month
    const [topCat] = await Transaction.aggregate([
        { $match: { userId: uid, type: 'expense', date: monthRange(thisYear, thisMonth) } },
        { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        { $project: { name: '$cat.name', total: 1 } },
    ])

    if (topCat) {
        insights.push({
            type:    'info',
            title:   'Top spending category',
            message: `Your biggest expense category this month is ${topCat.name} ($${topCat.total.toFixed(2)}).`,
            value:   topCat.total,
        })
    }

    // 3. Category-level MoM comparison
    const catAgg = async (y, m) => Transaction.aggregate([
        { $match: { userId: uid, type: 'expense', date: monthRange(y, m) } },
        { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        { $project: { name: '$cat.name', total: 1 } },
    ])

    const [thisCats, lastCats] = await Promise.all([
        catAgg(thisYear, thisMonth),
        catAgg(lastYear, lastMonth),
    ])

    const lastMap = Object.fromEntries(lastCats.map((r) => [r.name, r.total]))
    for (const cat of thisCats) {
        const prev = lastMap[cat.name]
        if (prev && prev > 0) {
            const pct = ((cat.total - prev) / prev) * 100
            if (pct >= 30) {
                insights.push({
                    type:    'warning',
                    title:   `${cat.name} spending up`,
                    message: `You spent ${pct.toFixed(0)}% more on ${cat.name} this month ($${cat.total.toFixed(2)} vs $${prev.toFixed(2)}).`,
                    value:   pct,
                })
            }
        }
    }

    // 4. Savings rate
    const thisIncome = await sumByType(thisYear, thisMonth, 'income')
    if (thisIncome > 0) {
        const savingsRate = ((thisIncome - thisExpense) / thisIncome) * 100
        insights.push({
            type:    savingsRate >= 20 ? 'positive' : savingsRate >= 0 ? 'info' : 'warning',
            title:   'Savings rate',
            message: savingsRate >= 0
                ? `You saved ${savingsRate.toFixed(0)}% of your income this month.`
                : `You spent ${Math.abs(savingsRate).toFixed(0)}% more than your income this month.`,
            value: savingsRate,
        })
    }

    // 5. Budget alerts
    const budgets = await Budget.find({ userId: uid, year: thisYear, month: thisMonth })
        .populate('categoryId', 'name')
        .lean()

    await Promise.all(
        budgets.map(async (b) => {
            const [agg] = await Transaction.aggregate([
                {
                    $match: {
                        userId:     uid,
                        categoryId: b.categoryId._id,
                        type:       'expense',
                        date:       monthRange(thisYear, thisMonth),
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ])
            const spent = agg?.total || 0
            const pct   = (spent / b.amount) * 100
            if (pct >= 90) {
                insights.push({
                    type:    pct >= 100 ? 'danger' : 'warning',
                    title:   `Budget ${pct >= 100 ? 'exceeded' : 'almost reached'}: ${b.categoryId.name}`,
                    message: `You've used ${pct.toFixed(0)}% of your ${b.categoryId.name} budget ($${spent.toFixed(2)} / $${b.amount.toFixed(2)}).`,
                    value:   pct,
                })
            }
        })
    )

    return insights
}

// Budget suggestions (50/30/20 rule)

const getBudgetSuggestions = async (userId) => {
    const uid = new mongoose.Types.ObjectId(userId)

    const rows = await Transaction.aggregate([
        { $match: { userId: uid, type: 'income' } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 3 },
    ])

    if (rows.length === 0) return []

    const avgIncome = rows.reduce((s, r) => s + r.total, 0) / rows.length

    return [
        { category: 'Needs (50%)',   description: 'Rent, groceries, utilities, transport', suggested: avgIncome * 0.5, rule: '50/30/20' },
        { category: 'Wants (30%)',   description: 'Entertainment, dining out, shopping',   suggested: avgIncome * 0.3, rule: '50/30/20' },
        { category: 'Savings (20%)', description: 'Emergency fund, investments, debt',     suggested: avgIncome * 0.2, rule: '50/30/20' },
    ]
}

module.exports = { categorize, getInsights, getBudgetSuggestions }
