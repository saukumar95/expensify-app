const app = require('./app')
const { port } = require('./config/env')
const { connect } = require('./config/database')
const Category = require('./models/Category')
const logger = require('./utils/logger')

const start = async () => {
    await connect()

    // Seed default categories once
    await Category.seedDefaults()

    const server = app.listen(port, () => {
        logger.info(`Server running on http://localhost:${port}`)
    })

    // Graceful shutdown
    const shutdown = (signal) => {
        logger.info(`${signal} received — shutting down`)
        server.close(async () => {
            const { disconnect } = require('./config/database')
            await disconnect()
            process.exit(0)
        })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))
}

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) })
    process.exit(1)
})

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { message: err.message })
    process.exit(1)
})

start().catch((err) => {
    logger.error('Failed to start server', { message: err.message })
    process.exit(1)
})
