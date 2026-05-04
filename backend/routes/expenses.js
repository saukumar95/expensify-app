const express = require('express')
const db = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()

// All routes require auth
router.use(auth)

// GET all expenses for logged-in user
router.get('/', (req, res) => {
    const expenses = db
        .prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC')
        .all(req.user.id)
    res.json(expenses)
})

// POST create expense
router.post('/', (req, res) => {
    const { title, amount, category, date, note } = req.body
    if (!title || !amount || !category || !date)
        return res.status(400).json({ message: 'title, amount, category and date are required' })

    const result = db
        .prepare('INSERT INTO expenses (user_id, title, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, title, Number(amount), category, date, note || null)

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(expense)
})

// PUT update expense
router.put('/:id', (req, res) => {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!expense) return res.status(404).json({ message: 'Expense not found' })

    const { title, amount, category, date, note } = req.body
    db.prepare('UPDATE expenses SET title=?, amount=?, category=?, date=?, note=? WHERE id=?')
        .run(
            title ?? expense.title,
            amount !== undefined ? Number(amount) : expense.amount,
            category ?? expense.category,
            date ?? expense.date,
            note !== undefined ? note : expense.note,
            req.params.id
        )

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id)
    res.json(updated)
})

// DELETE expense
router.delete('/:id', (req, res) => {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!expense) return res.status(404).json({ message: 'Expense not found' })

    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id)
    res.json({ message: 'Deleted' })
})

module.exports = router
