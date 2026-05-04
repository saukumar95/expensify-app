const mongoose = require('mongoose')

const toObjectId = (value, label = 'ID') => {
    const str = String(value ?? '').trim()
    if (!mongoose.isValidObjectId(str)) {
        const AppError = require('./AppError')
        throw new AppError(`Invalid ${label}`, 400, 'INVALID_ID')
    }
    return new mongoose.Types.ObjectId(str)
}

const toSafeString = (value, maxLength = 1000) => {
    if (value === null || value === undefined) return null
    return String(value).trim().slice(0, maxLength) || null
}

const toEnum = (value, allowed, fallback) => {
    const str = String(value ?? '').trim()
    return allowed.includes(str) ? str : fallback
}

const toPositiveInt = (value, fallback = null) => {
    const n = parseInt(value, 10)
    return Number.isFinite(n) && n > 0 ? n : fallback
}

module.exports = { toObjectId, toSafeString, toEnum, toPositiveInt }
