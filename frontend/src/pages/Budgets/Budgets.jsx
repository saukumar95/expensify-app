import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import Button from '../../components/UI/Button'
import Modal from '../../components/UI/Modal'
import EmptyState from '../../components/UI/EmptyState'
import { getBudgets, upsertBudget, deleteBudget } from '../../services/budget.service'
import { getCategories } from '../../services/category.service'
import './Budgets.css'

const now = new Date()

const Budgets = () => {
    const [budgets, setBudgets]       = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading]       = useState(true)
    const [modalOpen, setModalOpen]   = useState(false)
    const [year, setYear]             = useState(now.getFullYear())
    const [month, setMonth]           = useState(now.getMonth() + 1)
    const [form, setForm]             = useState({ category_id: '', amount: '' })
    const [saving, setSaving]         = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [bRes, cRes] = await Promise.all([getBudgets({ year, month }), getCategories()])
            setBudgets(bRes.data.data)
            setCategories(cRes.data.data.filter((c) => c.type === 'expense'))
        } catch {
            toast.error('Failed to load budgets')
        } finally {
            setLoading(false)
        }
    }, [year, month])

    useEffect(() => { load() }, [load])

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.category_id || !form.amount) return toast.error('Fill in all fields')
        setSaving(true)
        try {
            await upsertBudget({ category_id: parseInt(form.category_id), amount: parseFloat(form.amount), year, month })
            toast.success('Budget saved')
            setModalOpen(false)
            setForm({ category_id: '', amount: '' })
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save budget')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this budget?')) return
        try {
            await deleteBudget(id)
            toast.success('Budget deleted')
            load()
        } catch {
            toast.error('Failed to delete')
        }
    }

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    return (
        <Layout>
            <div className="budgets-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Budgets</h1>
                        <p className="page-subtitle">Set monthly spending limits by category</p>
                    </div>
                    <Button variant="primary" onClick={() => setModalOpen(true)}>
                        <Plus size={16} /> Set Budget
                    </Button>
                </div>

                {/* Period selector */}
                <div className="period-bar">
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Select month">
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Select year">
                        {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="loading-grid">
                        {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}
                    </div>
                ) : budgets.length === 0 ? (
                    <EmptyState
                        icon={<Target size={40} />}
                        title="No budgets set"
                        description="Set spending limits to track your budget goals"
                        action={<Button variant="primary" size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> Set Budget</Button>}
                    />
                ) : (
                    <div className="budgets-grid">
                        {budgets.map((b) => {
                            const pct = Math.min((b.spent / b.amount) * 100, 100)
                            const isOver = b.spent > b.amount
                            const isWarn = pct >= 80 && !isOver
                            return (
                                <div key={b.id} className="budget-card">
                                    <div className="budget-header">
                                        <div className="budget-cat">
                                            <div className="cat-dot" style={{ background: b.category_color }} />
                                            <span>{b.category_name}</span>
                                        </div>
                                        <button
                                            className="icon-btn icon-btn--danger"
                                            onClick={() => handleDelete(b.id)}
                                            aria-label={`Delete ${b.category_name} budget`}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                    <div className="budget-amounts">
                                        <span className={`spent ${isOver ? 'over' : ''}`}>${b.spent.toFixed(2)}</span>
                                        <span className="limit">/ ${b.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                                        <div
                                            className={`progress-fill ${isOver ? 'fill--over' : isWarn ? 'fill--warn' : 'fill--ok'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className={`budget-status ${isOver ? 'status--over' : isWarn ? 'status--warn' : 'status--ok'}`}>
                                        {isOver
                                            ? `Over by $${(b.spent - b.amount).toFixed(2)}`
                                            : `$${b.remaining.toFixed(2)} remaining (${pct.toFixed(0)}% used)`}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Set Budget" size="sm">
                <form onSubmit={handleSave} className="budget-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="b-cat">Category</label>
                        <select id="b-cat" value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} required>
                            <option value="">Select category</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="b-amount">Monthly Limit ($)</label>
                        <input id="b-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" required />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" loading={saving}>Save Budget</Button>
                    </div>
                </form>
            </Modal>
        </Layout>
    )
}

export default Budgets
