const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User         = require('../models/User')
const RefreshToken = require('../models/RefreshToken')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')
const AppError     = require('../utils/AppError')
const { toSafeEmail, toSafeToken, toSafeString, toObjectId } = require('../utils/sanitize')
const { jwtRefreshExpiresIn } = require('../config/env')

const SALT_ROUNDS = 12

// register

const register = async ({ name, email, password }) => {
    // toSafeEmail validates format with a strict regex — breaks CodeQL taint chain
    const safeEmail = toSafeEmail(email)
    const safeName  = toSafeString(name, 80)
    const safePwd   = toSafeString(password, 128)

    if (!safeName || !safePwd) {
        throw new AppError('All fields required', 400, 'VALIDATION_ERROR')
    }

    const existing = await User.findOne({ email: safeEmail })
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS')

    const hashed = await bcrypt.hash(safePwd, SALT_ROUNDS)
    const user   = await User.create({ name: safeName, email: safeEmail, password: hashed })

    const { accessToken, refreshToken } = await _issueTokens(user)
    return { user: user.toJSON(), accessToken, refreshToken }
}

// login

const login = async ({ email, password }) => {
    const safeEmail = toSafeEmail(email)
    const safePwd   = toSafeString(password, 128)

    if (!safePwd) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

    // select('+password') because the field has select:false on the schema
    const user = await User.findOne({ email: safeEmail }).select('+password')
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

    const valid = await bcrypt.compare(safePwd, user.password)
    if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

    const { accessToken, refreshToken } = await _issueTokens(user)
    return { user: user.toJSON(), accessToken, refreshToken }
}

// refresh

const refresh = async (rawRefreshToken) => {
    // toSafeToken validates format with a strict regex — breaks CodeQL taint chain
    const safeToken = toSafeToken(rawRefreshToken)
    if (!safeToken) throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')

    let payload
    try {
        payload = verifyRefreshToken(safeToken)
    } catch {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')
    }

    // toObjectId validates and casts — CodeQL recognises isValidObjectId as a sanitizer
    const safeUserId = toObjectId(payload.id, 'userId')

    const stored = await RefreshToken.findOne({
        token:     safeToken,
        userId:    safeUserId,
        expiresAt: { $gt: new Date() },
    })
    if (!stored) throw new AppError('Refresh token revoked or expired', 401, 'REFRESH_TOKEN_EXPIRED')

    const user = await User.findById(safeUserId)
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

    // Rotate: delete old token, issue new pair
    await RefreshToken.deleteOne({ _id: stored._id })
    const { accessToken, refreshToken } = await _issueTokens(user)
    return { accessToken, refreshToken }
}

// logout

const logout = async (rawRefreshToken) => {
    // Validate token format before using in a query
    let safeToken
    try { safeToken = toSafeToken(rawRefreshToken) } catch { return }
    if (safeToken) {
        await RefreshToken.deleteOne({ token: safeToken })
    }
}

// getProfile

const getProfile = async (userId) => {
    // userId comes from verified JWT — still cast to ObjectId to satisfy CodeQL
    const safeId = toObjectId(userId, 'userId')
    const user   = await User.findById(safeId)
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')
    return user.toJSON()
}

// helpers

const _issueTokens = async (user) => {
    const payload = { id: user._id.toString(), email: user.email, role: user.role }
    const accessToken  = signAccessToken(payload)
    // jti (random bytes) ensures uniqueness even when issued within the same second
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
    const match  = str.match(/^(\d+)([smhd])$/)
    if (!match) return 7 * 86400000
    return parseInt(match[1], 10) * (units[match[2]] || 86400000)
}

module.exports = { register, login, refresh, logout, getProfile }
