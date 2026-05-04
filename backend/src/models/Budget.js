const mongoose = require('mongoose')

const budgetSchema = new mongoose.Schema(
    {
        userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        amount:     { type: Number, required: true, min: 0.01 },
        year:       { type: Number, required: true },
        month:      { type: Number, required: true, min: 1, max: 12 },
    },
    { timestamps: true }
)

// One budget per user/category/month
budgetSchema.index({ userId: 1, categoryId: 1, year: 1, month: 1 }, { unique: true })

budgetSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
    },
})

module.exports = mongoose.model('Budget', budgetSchema)
