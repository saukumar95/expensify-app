const Joi = require('joi')

const upsertBudgetSchema = Joi.object({
    category_id: Joi.string().required(),
    amount:      Joi.number().positive().precision(2).required(),
    year:        Joi.number().integer().min(2000).max(2100).required(),
    month:       Joi.number().integer().min(1).max(12).required(),
})

module.exports = { upsertBudgetSchema }
