const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const { defaultLimiter } = require('./middlewares/rateLimiter')
const requestLogger = require('./middlewares/requestLogger')
const errorHandler = require('./middlewares/errorHandler')
const { authenticate } = require('./middlewares/auth.middleware')

const authRoutes        = require('./routes/auth.routes')
const transactionRoutes = require('./routes/transaction.routes')
const categoryRoutes    = require('./routes/category.routes')
const budgetRoutes      = require('./routes/budget.routes')
const aiRoutes          = require('./routes/ai.routes')
const reportRoutes      = require('./routes/report.routes')

const app = express()

// Security & parsing
app.use(helmet())
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

//  Logging
app.use(requestLogger)

//  Rate limiting
app.use('/api', defaultLimiter)

// Health check 
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Routes 
app.use('/api/auth',         authRoutes)
app.use('/api/transactions', authenticate, transactionRoutes)
app.use('/api/categories',   authenticate, categoryRoutes)
app.use('/api/budgets',      authenticate, budgetRoutes)
app.use('/api/ai',           authenticate, aiRoutes)
app.use('/api/reports',      authenticate, reportRoutes)

// 404 
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' }))

// Error handler 
app.use(errorHandler)

module.exports = app
