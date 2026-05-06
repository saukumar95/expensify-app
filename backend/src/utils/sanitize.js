const mongoose = require('mongoose')
const AppError  = require('./AppError')

const EMAIL_RE   = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
const ISO_DATE_RE = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/
const TOKEN_RE   = /^[A-Za-z0-9\-_\.]{10,512}$/

const toObjectId = (value, label = 'ID') => {
    const str = String(value ?? '').trim()
    if (!mongoose.isValidObjectId(str)) {
        throw new AppError(`Invalid ${label}`, 400, 'INVALID_ID')
    }
    return new mongoose.Types.ObjectId(str)
}

const toSafeEmail = (value) => {
    const str = String(value ?? '').trim().toLowerCase().slice(0, 254)
    if (!EMAIL_RE.test(str)) {
        throw new AppError('Invalid email address', 422, 'VALIDATION_ERROR')
    }
    return str
}

const toSafeDate = (value) => {
    if (value === null || value === undefined || value === '') return null
    const str = String(value).trim()
    // Accept full ISO datetime — extract the date part
    const datePart = str.slice(0, 10)
    if (!ISO_DATE_RE.test(datePart)) {
        throw new AppError('Invalid date format, expected YYYY-MM-DD', 422, 'VALIDATION_ERROR')
    }
    return datePart
}

const toSafeToken = (value) => {
    if (value === null || value === undefined || value === '') return null
    const str = String(value).trim()
    if (!TOKEN_RE.test(str)) {
        throw new AppError('Invalid token format', 401, 'INVALID_TOKEN')
    }
    return str
}

const toSafeString = (value, maxLength = 1000) => {
    if (value === null || value === undefined) return null
    return String(value).trim().slice(0, maxLength) || null
}

const toEnum = (value, allowed, fallback) => {
    const str = String(value ?? '').trim()
    // Return the matched element from the allowed array (a literal), not the user string
    const match = allowed.find((a) => a === str)
    return match !== undefined ? match : fallback
}

const toPositiveInt = (value, fallback = null) => {
    const n = parseInt(value, 10)
    return Number.isFinite(n) && n > 0 ? n : fallback
}

module.exports = { toObjectId, toSafeEmail, toSafeDate, toSafeToken, toSafeString, toEnum, toPositiveInt }
