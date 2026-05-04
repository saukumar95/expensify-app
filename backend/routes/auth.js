const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = express.Router()
const SECRET = process.env.JWT_SECRET || 'expensify_secret_key'

router.post('/register', (req, res) => {
    const { name, email, password } = req.body
    if (!name || !email || !password)
        return res.status(400).json({ message: 'All fields required' })

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const hashed = bcrypt.hashSync(password, 10)
    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashed)
    const token = jwt.sign({ id: result.lastInsertRowid, name, email }, SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: result.lastInsertRowid, name, email } })
})

router.post('/login', (req, res) => {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({ message: 'All fields required' })

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user || !bcrypt.compareSync(password, user.password))
        return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
})

module.exports = router
