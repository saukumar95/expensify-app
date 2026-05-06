const { nodeEnv } = require('../config/env')

const levels = { error: 0, warn: 1, info: 2, debug: 3 }
const colors = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', debug: '\x1b[90m', reset: '\x1b[0m' }

const log = (level, message, meta) => {
    if (nodeEnv === 'test') return
    const ts = new Date().toISOString()
    const color = colors[level] || ''
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    console.log(`${color}[${ts}] [${level.toUpperCase()}] ${message}${metaStr}${colors.reset}`)
}

const logger = {
    error: (msg, meta) => log('error', msg, meta),
    warn:  (msg, meta) => log('warn',  msg, meta),
    info:  (msg, meta) => log('info',  msg, meta),
    debug: (msg, meta) => log('debug', msg, meta),
    http:  (req, res, duration) => {
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
        log(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
    },
}

module.exports = logger
