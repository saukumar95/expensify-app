const bcrypt = require('bcryptjs')
const User = require('../models/User')
const RefreshToken = require('../models/RefreshToken')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')
const AppError = require('../utils/AppError')
const { jwtRefreshExpiresIn } = require('../config/env')

const SALT_ROUNDS = 12

const register = async ({ name, email, password }) => {
    const existing = await User.findOne({ email })
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS')

    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await User.create({ name, email, password: hashed })

    const { accessToken, refreshToken } = await _issueTokens(user)
    return { user: user.toJSON(), accessToken, refreshToken }
}

const login = async ({ email, password }) => {
    // Select password explicitly (excluded by toJSON transform)
    const user = await User.findOne({ email }).select('+password')
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')

    const { accessToken, refreshToken } = await _issueTokens(user)
    return { user: user.toJSON(), accessToken, refreshToken }
}

const refresh = async (rawRefreshToken) => {
    let payload
    try {
        payload = verifyRefreshToken(rawRefreshToken)
    } catch {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')
    }

    const stored = await RefreshToken.findOne({
        token: rawRefreshToken,
        userId: payload.id,
        expiresAt: { $gt: new Date() },
    })
    if (!stored) throw new AppError('Refresh token revoked or expired', 401, 'REFRESH_TOKEN_EXPIRED')

    const user = await User.findById(payload.id)
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')

    // Rotate — delete old, issue new
    await RefreshToken.deleteOne({ _id: stored._id })
    const { accessToken, refreshToken } = await _issueTokens(user)
    return { accessToken, refreshToken }
}

const logout = async (rawRefreshToken) => {
    if (rawRefreshToken) {
        await RefreshToken.deleteOne({ token: rawRefreshToken })
    }
}

const getProfile = async (userId) => {
    const user = await User.findById(userId)
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')
    return user.toJSON()
}

//  helpers 

const crypto = require('crypto')

const _issueTokens = async (user) => {
    const payload = { id: user._id.toString(), email: user.email, role: user.role }
    const accessToken  = signAccessToken(payload)
    // Add a unique jti so tokens issued in the same second are distinct
    const refreshToken = signRefreshToken({ id: user._id.toString(), jti: crypto.randomBytes(16).toString('hex') })

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
    return parseInt(match[1]) * (units[match[2]] || 86400000)
}

module.exports = { register, login, refresh, logout, getProfile }
