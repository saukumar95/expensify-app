const logger = require('../utils/logger')
const { nodeEnv } = require('../config/env')

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const isOperational = err.isOperational === true

    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
        statusCode,
        code: err.code,
        stack: nodeEnv === 'development' ? err.stack : undefined,
    })

    res.status(statusCode).json({
        success: false,
        message: isOperational ? err.message : 'Internal server error',
        code:    err.code || 'INTERNAL_ERROR',
        ...(nodeEnv === 'development' && { stack: err.stack }),
    })
}

module.exports = errorHandler
