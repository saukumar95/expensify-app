const Joi = require('joi')

const createTransactionSchema = Joi.object({
    type:        Joi.string().valid('income', 'expense').required(),
    amount:      Joi.number().positive().precision(2).required(),
    category_id: Joi.string().required(),
    description: Joi.string().trim().min(1).max(255).required(),
    date:        Joi.string().isoDate().required(),
    tags:        Joi.array().items(Joi.string().max(50)).max(10).default([]),
    notes:       Joi.string().max(1000).allow('', null).default(null),
})

const updateTransactionSchema = Joi.object({
    type:        Joi.string().valid('income', 'expense'),
    amount:      Joi.number().positive().precision(2),
    category_id: Joi.string(),
    description: Joi.string().trim().min(1).max(255),
    date:        Joi.string().isoDate(),
    tags:        Joi.array().items(Joi.string().max(50)).max(10),
    notes:       Joi.string().max(1000).allow('', null),
}).min(1)

const filterSchema = Joi.object({
    type:        Joi.string().valid('income', 'expense'),
    category_id: Joi.string(),
    start_date:  Joi.string().isoDate(),
    end_date:    Joi.string().isoDate(),
    search:      Joi.string().max(100),
    page:        Joi.number().integer().min(1).default(1),
    limit:       Joi.number().integer().min(1).max(100).default(20),
    sort:        Joi.string().valid('date', 'amount', 'created_at').default('date'),
    order:       Joi.string().valid('asc', 'desc').default('desc'),
})

module.exports = { createTransactionSchema, updateTransactionSchema, filterSchema }
