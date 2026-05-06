const AppError = require('../utils/AppError')

// Returns an Express middleware that validates req.body against a Joi schema.

const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true })
    if (error) {
        const details = error.details.map((d) => d.message).join('; ')
        return next(new AppError(details, 422, 'VALIDATION_ERROR'))
    }
    req[source] = value
    next()
}

module.exports = validate
