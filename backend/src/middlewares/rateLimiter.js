const rateLimit = require('express-rate-limit')
const { rateLimitWindowMs, rateLimitMax } = require('../config/env')

const defaultLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.', code: 'RATE_LIMITED' },
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts, please try again later.', code: 'RATE_LIMITED' },
})

module.exports = { defaultLimiter, authLimiter }
