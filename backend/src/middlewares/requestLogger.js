const logger = require('../utils/logger')

const requestLogger = (req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
        logger.http(req, res, Date.now() - start)
    })
    next()
}

module.exports = requestLogger
