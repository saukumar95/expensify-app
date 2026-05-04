const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        name:     { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    },
    { timestamps: true }
)

// Index already created by unique:true on email — no need for explicit index call

userSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        delete ret.password
        return ret
    },
})

module.exports = mongoose.model('User', userSchema)
