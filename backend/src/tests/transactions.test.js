const request = require('supertest')
const app = require('../app')
const { connectTestDb, disconnectTestDb } = require('./setup/dbSetup')

beforeAll(async () => { await connectTestDb() })
afterAll(async () => {
    // Clean up this suite's data
    const mongoose = require('mongoose')
    const collections = mongoose.connection.collections
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({})
    }
})

describe('Transactions API', () => {
    let accessToken
    let categoryId
    let txId

    beforeAll(async () => {
        const email = `tx_${Date.now()}@example.com`
        const reg = await request(app).post('/api/auth/register').send({
            name: 'TX Test User', email, password: 'pass123456',
        })
        expect(reg.status).toBe(201)
        accessToken = reg.body.data.accessToken

        const cats = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${accessToken}`)
        expect(cats.status).toBe(200)
        categoryId = cats.body.data.find((c) => c.type === 'expense')?._id
        expect(categoryId).toBeDefined()
    })

    it('POST /api/transactions — creates a transaction', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                type:        'expense',
                amount:      25.50,
                category_id: categoryId,
                description: 'Lunch at restaurant',
                date:        '2025-01-15',
            })
        expect(res.status).toBe(201)
        expect(res.body.data.description).toBe('Lunch at restaurant')
        expect(res.body.data.amount).toBe(25.50)
        txId = res.body.data._id
    })

    it('GET /api/transactions — lists with pagination meta', async () => {
        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.meta.total).toBeGreaterThanOrEqual(1)
    })

    it('GET /api/transactions — filters by type', async () => {
        const res = await request(app)
            .get('/api/transactions?type=expense')
            .set('Authorization', `Bearer ${accessToken}`)
        expect(res.status).toBe(200)
        res.body.data.forEach((tx) => expect(tx.type).toBe('expense'))
    })

    it('GET /api/transactions/summary — returns income/expense totals', async () => {
        const res = await request(app)
            .get('/api/transactions/summary?year=2025&month=1')
            .set('Authorization', `Bearer ${accessToken}`)
        expect(res.status).toBe(200)
        expect(res.body.data.expense).toBe(25.50)
    })

    it('PUT /api/transactions/:id — updates amount', async () => {
        const res = await request(app)
            .put(`/api/transactions/${txId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ amount: 30.00 })
        expect(res.status).toBe(200)
        expect(res.body.data.amount).toBe(30)
    })

    it('DELETE /api/transactions/:id — deletes the transaction', async () => {
        const res = await request(app)
            .delete(`/api/transactions/${txId}`)
            .set('Authorization', `Bearer ${accessToken}`)
        expect(res.status).toBe(200)
    })

    it('GET /api/transactions/:id — 404 after delete', async () => {
        const res = await request(app)
            .get(`/api/transactions/${txId}`)
            .set('Authorization', `Bearer ${accessToken}`)
        expect(res.status).toBe(404)
    })
})
