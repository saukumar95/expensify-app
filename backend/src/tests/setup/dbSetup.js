const mongoose = require('mongoose')
const path = require('path')
const fs   = require('fs')
const Category = require('../../models/Category')

const getTestUri = () => {
    const tmpFile = path.join(__dirname, '.mongo-uri.tmp')
    if (fs.existsSync(tmpFile)) return fs.readFileSync(tmpFile, 'utf8').trim()
    return process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/expensify_test'
}

const connectTestDb = async () => {
    const uri = getTestUri()
    process.env.MONGO_URI_TEST = uri
    process.env.NODE_ENV = 'test'

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri)
    }
    await Category.seedDefaults()
}

// Only drop collections, not the whole DB — safe for shared connection
const cleanupTestDb = async () => {
    const collections = mongoose.connection.collections
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({})
    }
}

const disconnectTestDb = async () => {
    await cleanupTestDb()
    // Only disconnect if this is the last test suite
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
    }
}

module.exports = { connectTestDb, disconnectTestDb, cleanupTestDb }
