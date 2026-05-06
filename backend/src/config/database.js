const mongoose = require('mongoose')
const { mongoUri, nodeEnv } = require('./env')
const logger = require('../utils/logger')

const connect = async () => {
    const uri = nodeEnv === 'test'
        ? (process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/expensify_test')
        : mongoUri

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
    })

    logger.info(`MongoDB connected: ${mongoose.connection.host}`)
}

const disconnect = async () => {
    await mongoose.disconnect()
    logger.info('MongoDB disconnected')
}

module.exports = { connect, disconnect }
