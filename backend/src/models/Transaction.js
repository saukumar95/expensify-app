const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
    {
        userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
        type:        { type: String, required: true, enum: ['income', 'expense'] },
        amount:      { type: Number, required: true, min: 0.01 },
        categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        description: { type: String, required: true, trim: true, maxlength: 255 },
        date:        { type: Date,   required: true },
        tags:        { type: [String], default: [] },
        notes:       { type: String, default: null, maxlength: 1000 },
    },
    { timestamps: true }
)

// Compound indexes for common query patterns
transactionSchema.index({ userId: 1, date: -1 })
transactionSchema.index({ userId: 1, type: 1 })
transactionSchema.index({ userId: 1, categoryId: 1 })
transactionSchema.index({ userId: 1, date: -1, type: 1 })

transactionSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
    },
})

module.exports = mongoose.model('Transaction', transactionSchema)
