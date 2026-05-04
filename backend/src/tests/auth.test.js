const request = require('supertest')
const app = require('../app')
const { connectTestDb, disconnectTestDb } = require('./setup/dbSetup')

beforeAll(async () => {
    await connectTestDb()
    // Clean slate for this suite
    const mongoose = require('mongoose')
    const collections = mongoose.connection.collections
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({})
    }
    const Category = require('../models/Category')
    await Category.seedDefaults()
})
afterAll(async () => {
    const mongoose = require('mongoose')
    const collections = mongoose.connection.collections
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({})
    }
    const Category = require('../models/Category')
    await Category.seedDefaults()
})

describe('Auth API', () => {
    const testUser = {
        name:     'Test User',
        email:    `auth_${Date.now()}@example.com`,
        password: 'password123',
    }
    let accessToken
    let refreshToken

    it('POST /api/auth/register — creates a new user', async () => {
        const res = await request(app).post('/api/auth/register').send(testUser)
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.user.email).toBe(testUser.email)
        expect(res.body.data.accessToken).toBeDefined()
        expect(res.body.data.user.password).toBeUndefined()
    })

    it('POST /api/auth/register — rejects duplicate email', async () => {
        const res = await request(app).post('/api/auth/register').send(testUser)
        expect(res.status).toBe(409)
        expect(res.body.code).toBe('EMAIL_EXISTS')
    })

    it('POST /api/auth/login — returns tokens', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email:    testUser.email,
            password: testUser.password,
        })
        if (res.status !== 200) console.error('LOGIN FAILED:', JSON.stringify(res.body))
        expect(res.status).toBe(200)
        expect(res.body.data.accessToken).toBeDefined()
        expect(res.body.data.refreshToken).toBeDefined()
        accessToken  = res.body.data.accessToken
        refreshToken = res.body.data.refreshToken
    })

    it('POST /api/auth/login — rejects wrong password', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email:    testUser.email,
            password: 'wrongpassword',
        })
        expect(res.status).toBe(401)
        expect(res.body.code).toBe('INVALID_CREDENTIALS')
    })

    it('GET /api/auth/me — returns profile with valid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)
        expect(res.status).toBe(200)
        expect(res.body.data.email).toBe(testUser.email)
        expect(res.body.data.password).toBeUndefined()
    })

    it('GET /api/auth/me — rejects without token', async () => {
        const res = await request(app).get('/api/auth/me')
        expect(res.status).toBe(401)
    })

    it('POST /api/auth/refresh — rotates tokens', async () => {
        const loginRes = await request(app).post('/api/auth/login').send({
            email:    testUser.email,
            password: testUser.password,
        })
        const oldRefresh = loginRes.body.data.refreshToken

        // Small delay to ensure different iat in JWT
        await new Promise((r) => setTimeout(r, 1100))

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: oldRefresh })
        expect(res.status).toBe(200)
        expect(res.body.data.accessToken).toBeDefined()
        expect(res.body.data.refreshToken).toBeDefined()

        // Old token should now be revoked
        const revokedRes = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: oldRefresh })
        expect(revokedRes.status).toBe(401)
    })
})
