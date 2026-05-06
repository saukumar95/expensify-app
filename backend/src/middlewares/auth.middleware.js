const { verifyAccessToken } = require('../utils/jwt')
const AppError = require('../utils/AppError')

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('No token provided', 401, 'NO_TOKEN'))
    }

    const token = authHeader.split(' ')[1]
    try {
        req.user = verifyAccessToken(token)
        next()
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'))
        }
        return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'))
    }
}

const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return next(new AppError('Forbidden', 403, 'FORBIDDEN'))
    }
    next()
}

module.exports = { authenticate, authorize }
