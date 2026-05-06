const mongoose = require('mongoose')

const DEFAULT_CATEGORIES = [
    { name: 'Salary',        type: 'income',  color: '#22c55e', icon: 'briefcase'   },
    { name: 'Freelance',     type: 'income',  color: '#10b981', icon: 'laptop'      },
    { name: 'Investment',    type: 'income',  color: '#06b6d4', icon: 'trending-up' },
    { name: 'Other Income',  type: 'income',  color: '#84cc16', icon: 'plus-circle' },
    { name: 'Food',          type: 'expense', color: '#f97316', icon: 'utensils'    },
    { name: 'Transport',     type: 'expense', color: '#3b82f6', icon: 'car'         },
    { name: 'Shopping',      type: 'expense', color: '#a855f7', icon: 'shopping-bag'},
    { name: 'Health',        type: 'expense', color: '#22c55e', icon: 'heart'       },
    { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: 'film'        },
    { name: 'Bills',         type: 'expense', color: '#ef4444', icon: 'file-text'   },
    { name: 'Education',     type: 'expense', color: '#f59e0b', icon: 'book'        },
    { name: 'Travel',        type: 'expense', color: '#0ea5e9', icon: 'plane'       },
    { name: 'Other',         type: 'expense', color: '#6b7280', icon: 'tag'         },
]

const categorySchema = new mongoose.Schema(
    {
        name:      { type: String, required: true, trim: true },
        type:      { type: String, required: true, enum: ['income', 'expense'] },
        color:     { type: String, default: '#6b7280' },
        icon:      { type: String, default: 'tag' },
        userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
)

categorySchema.index({ userId: 1 })
categorySchema.index({ isDefault: 1 })

categorySchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
    },
})

// Seed default categories once on first use
categorySchema.statics.seedDefaults = async function () {
    const count = await this.countDocuments({ isDefault: true })
    if (count > 0) return
    await this.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true })))
}

module.exports = mongoose.model('Category', categorySchema)
