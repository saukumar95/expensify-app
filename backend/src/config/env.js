require('dotenv').config()

module.exports = {
    port:               process.env.PORT || 5000,
    mongoUri:           process.env.MONGO_URI || 'mongodb://localhost:27017/expensify',
    jwtSecret:          process.env.JWT_SECRET || 'expensify_secret_key',
    jwtRefreshSecret:   process.env.JWT_REFRESH_SECRET || 'expensify_refresh_secret',
    jwtExpiresIn:       process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    nodeEnv:            process.env.NODE_ENV || 'development',
    openaiApiKey:       process.env.OPENAI_API_KEY || '',
    rateLimitWindowMs:  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMax:       parseInt(process.env.RATE_LIMIT_MAX) || 100,
}
