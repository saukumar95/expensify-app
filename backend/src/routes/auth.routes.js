const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')
const validate = require('../middlewares/validate')
const { authenticate } = require('../middlewares/auth.middleware')
const { authLimiter } = require('../middlewares/rateLimiter')
const { registerSchema, loginSchema, refreshSchema } = require('../validations/auth.validation')

router.post('/register', authLimiter, validate(registerSchema), ctrl.register)
router.post('/login',    authLimiter, validate(loginSchema),    ctrl.login)
router.post('/refresh',  validate(refreshSchema), ctrl.refresh)
router.post('/logout',   ctrl.logout)
router.get('/me',        authenticate, ctrl.getProfile)

module.exports = router
