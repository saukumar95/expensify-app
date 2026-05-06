import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import { createTransaction, updateTransaction } from '../../services/transaction.service'
import { categorize } from '../../services/ai.service'
import './TransactionForm.css'

const today = () => new Date().toISOString().slice(0, 10)

const TransactionForm = ({ isOpen, onClose, onSaved, transaction, categories }) => {
    const isEdit = Boolean(transaction)

    const [form, setForm] = useState({
        type: 'expense',
        amount: '',
        category_id: '',
        description: '',
        date: today(),
        notes: '',
        tags: '',
    })
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)

    useEffect(() => {
        if (transaction) {
            setForm({
                type:        transaction.type,
                amount:      transaction.amount,
                category_id: transaction.category_id,
                description: transaction.description,
                date:        transaction.date,
                notes:       transaction.notes || '',
                tags:        (transaction.tags || []).join(', '),
            })
        } else {
            setForm({ type: 'expense', amount: '', category_id: '', description: '', date: today(), notes: '', tags: '' })
        }
    }, [transaction, isOpen])

    const filteredCategories = categories.filter((c) => c.type === form.type)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => {
            const next = { ...prev, [name]: value }
            // Reset category when type changes
            if (name === 'type') next.category_id = ''
            return next
        })
    }

    const handleAiCategorize = async () => {
        if (!form.description.trim()) return toast.error('Enter a description first')
        setAiLoading(true)
        try {
            const { data } = await categorize(form.description)
            const { category, type } = data.data
            const match = categories.find((c) => c.name === category && c.type === type)
            if (match) {
                setForm((prev) => ({ ...prev, type, category_id: match.id }))
                toast.success(`AI suggested: ${category}`)
            } else {
                toast('No matching category found', { icon: '🤖' })
            }
        } catch {
            toast.error('AI categorization failed')
        } finally {
            setAiLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.amount || !form.category_id || !form.description || !form.date) {
            return toast.error('Please fill in all required fields')
        }

        setLoading(true)
        try {
            const payload = {
                type:        form.type,
                amount:      parseFloat(form.amount),
                category_id: form.category_id,          // ObjectId string — don't parseInt
                description: form.description.trim(),
                date:        form.date,
                notes:       form.notes.trim() || null,
                tags:        form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
            }

            const { data } = isEdit
                ? await updateTransaction(transaction.id, payload)
                : await createTransaction(payload)

            toast.success(isEdit ? 'Transaction updated' : 'Transaction added')
            onSaved(data.data, isEdit)
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save transaction')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Transaction' : 'Add Transaction'}>
            <form onSubmit={handleSubmit} className="tx-form" noValidate>
                {/* Type toggle */}
                <div className="type-toggle" role="group" aria-label="Transaction type">
                    {['expense', 'income'].map((t) => (
                        <button
                            key={t}
                            type="button"
                            className={`type-btn type-btn--${t} ${form.type === t ? 'type-btn--active' : ''}`}
                            onClick={() => setForm((p) => ({ ...p, type: t, category_id: '' }))}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="tx-amount">Amount *</label>
                        <input
                            id="tx-amount"
                            type="number"
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="tx-date">Date *</label>
                        <input
                            id="tx-date"
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="tx-desc">Description *</label>
                    <div className="desc-row">
                        <input
                            id="tx-desc"
                            type="text"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="e.g. Lunch at restaurant"
                            required
                        />
                        <button
                            type="button"
                            className="ai-btn"
                            onClick={handleAiCategorize}
                            disabled={aiLoading}
                            title="AI auto-categorize"
                            aria-label="Auto-categorize with AI"
                        >
                            <Sparkles size={15} />
                            {aiLoading ? '...' : 'AI'}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="tx-cat">Category *</label>
                    <select
                        id="tx-cat"
                        name="category_id"
                        value={form.category_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select category</option>
                        {filteredCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="tx-tags">Tags <span className="optional">(comma separated)</span></label>
                    <input
                        id="tx-tags"
                        type="text"
                        name="tags"
                        value={form.tags}
                        onChange={handleChange}
                        placeholder="e.g. work, personal"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tx-notes">Notes</label>
                    <textarea
                        id="tx-notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Optional notes..."
                        rows={2}
                    />
                </div>

                <div className="form-actions">
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button variant="primary" type="submit" loading={loading}>
                        {isEdit ? 'Update' : 'Add Transaction'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default TransactionForm
