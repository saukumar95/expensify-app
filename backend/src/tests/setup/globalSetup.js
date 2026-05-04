const { MongoMemoryServer } = require('mongodb-memory-server')
const path = require('path')
const fs   = require('fs')

module.exports = async () => {
    const mongod = await MongoMemoryServer.create()
    const uri    = mongod.getUri()

    // Write URI to a temp file so test workers can read it
    const tmpFile = path.join(__dirname, '.mongo-uri.tmp')
    fs.writeFileSync(tmpFile, uri)

    global.__MONGOD__ = mongod
    process.env.MONGO_URI_TEST = uri
}
