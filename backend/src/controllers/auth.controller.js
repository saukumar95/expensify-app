const authService = require('../services/auth.service')
const asyncHandler = require('../utils/asyncHandler')

const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body)
    res.status(201).json({ success: true, data: result })
})

const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body)
    res.json({ success: true, data: result })
})

const refresh = asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken)
    res.json({ success: true, data: result })
})

const logout = asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken)
    res.json({ success: true, message: 'Logged out' })
})

const getProfile = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id)
    res.json({ success: true, data: user })
})

module.exports = { register, login, refresh, logout, getProfile }
