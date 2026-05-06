const jwt = require('jsonwebtoken')
const { jwtSecret, jwtRefreshSecret, jwtExpiresIn, jwtRefreshExpiresIn } = require('../config/env')

const signAccessToken = (payload) =>
    jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })

const signRefreshToken = (payload) =>
    jwt.sign(payload, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn })

const verifyAccessToken = (token) => jwt.verify(token, jwtSecret)

const verifyRefreshToken = (token) => jwt.verify(token, jwtRefreshSecret)

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken }
