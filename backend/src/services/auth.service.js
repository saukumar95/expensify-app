const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const RefreshToken = require('../models/RefreshToken')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')
const AppError = require('../utils/AppError')
const { toSafeString, toObjectId } = require('../utils/sanitize')
const { jwtRefreshExpiresIn } = require('../config/env')

const SALT_ROUNDS = 12

const register = async ({ name, email, password }) => {
    // Sanitize before any query — prevents CodeQL user-controlled-source alerts
    const safeEmail = toSafeString(email, 254)?.toLowerCase()
    const safeName  = toSafeString(name, 80)
    const safePwd   = toSafeString(password, 128)

    if (!safeEmail || !safeName || !safePwd) {
        throw new AppError('All fields required', 400, 'VALIDATION_ERROR')
    }

    const existing = await User.findOne({ email: safeEmail })
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS')

    const hashed = await bcrypt.hash(safePwd, SALT_ROUNDS)
    const user = await User.create({ name: safeName, email: safeEmail, password: hashed })

    const { accessToken, refreshToken } = await _issueTokens(user)
    return { user: user.toJSON(), accessToken, refreshToken }
}

const login = async ({ email, password }) => {
    const safeEmail = toSafeString(email, 254)?.toLowerCase()
    const safePwd   = toSafeString(password, 128)

    if (!safeEmail || !safePwd) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }

    // select('+password') because password field has select:false
    const user = await User.findOne({ email: safeEmail }).select('+password')
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

    const valid = await bcrypt.compare(safePwd, user.password)
    if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

    const { accessToken, refreshToken } = await _issueTokens(user)
    return { user: user.toJSON(), accessToken, refreshToken }
}

const refresh = async (rawRefreshToken) => {
    // Sanitize the token string before using it in a query
    const safeToken = toSafeString(rawRefreshToken, 512)
    if (!safeToken) throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')

    let payload
    try {
        payload = verifyRefreshToken(safeToken)
    } catch {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')
    }

    // Cast userId from JWT payload to ObjectId before querying
    const userId = toObjectId(payload.id, 'userId')

    const stored = await RefreshToken.findOne({
        token:     safeToken,
        userId,
        expiresAt: { $gt: new Date() },
    })
    if (!stored) throw new AppError('Refresh token revoked or expired', 401, 'REFRESH_TOKEN_EXPIRED')

    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

    await RefreshToken.deleteOne({ _id: stored._id })
    const { accessToken, refreshToken } = await _issueTokens(user)
    return { accessToken, refreshToken }
}

const logout = async (rawRefreshToken) => {
    const safeToken = toSafeString(rawRefreshToken, 512)
    if (safeToken) {
        await RefreshToken.deleteOne({ token: safeToken })
    }
}

const getProfile = async (userId) => {
    const safeId = toObjectId(userId, 'userId')
    const user = await User.findById(safeId)
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')
    return user.toJSON()
}

// helpers

const _issueTokens = async (user) => {
    const payload = { id: user._id.toString(), email: user.email, role: user.role }
    const accessToken  = signAccessToken(payload)
    // jti makes each token unique even when issued within the same second
    const refreshToken = signRefreshToken({
        id:  user._id.toString(),
        jti: crypto.randomBytes(16).toString('hex'),
    })

    const ms = _parseDuration(jwtRefreshExpiresIn)
    await RefreshToken.create({
        userId:    user._id,
        token:     refreshToken,
        expiresAt: new Date(Date.now() + ms),
    })

    return { accessToken, refreshToken }
}

const _parseDuration = (str) => {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
    const match = str.match(/^(\d+)([smhd])$/)
    if (!match) return 7 * 86400000
    return parseInt(match[1], 10) * (units[match[2]] || 86400000)
}

module.exports = { register, login, refresh, logout, getProfile }
