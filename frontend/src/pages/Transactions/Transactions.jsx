import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, Filter, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import Layout from '../../components/Layout/Layout'
import Button from '../../components/UI/Button'
import Badge from '../../components/UI/Badge'
import EmptyState from '../../components/UI/EmptyState'
import TransactionForm from '../../components/TransactionForm/TransactionForm'
import { getTransactions, deleteTransaction } from '../../services/transaction.service'
import { getCategories } from '../../services/category.service'
import { exportCsv } from '../../services/report.service'
import './Transactions.css'

const Transactions = () => {
    const [transactions, setTransactions] = useState([])
    const [categories, setCategories]     = useState([])
    const [meta, setMeta]                 = useState({})
    const [loading, setLoading]           = useState(true)
    const [modalOpen, setModalOpen]       = useState(false)
    const [editing, setEditing]           = useState(null)
    const [filters, setFilters]           = useState({ type: '', category_id: '', search: '', start_date: '', end_date: '' })
    const [page, setPage]                 = useState(1)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = { page, limit: 15, sort: 'date', order: 'desc', ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
            const [txRes, catRes] = await Promise.all([getTransactions(params), getCategories()])
            setTransactions(txRes.data.data)
            setMeta(txRes.data.meta)
            setCategories(catRes.data.data)
        } catch {
            toast.error('Failed to load transactions')
        } finally {
            setLoading(false)
        }
    }, [page, filters])

    useEffect(() => { load() }, [load])

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this transaction?')) return
        try {
            await deleteTransaction(id)
            toast.success('Deleted')
            load()
        } catch {
            toast.error('Failed to delete')
        }
    }

    const handleSaved = () => { setModalOpen(false); setEditing(null); load() }

    const handleExport = async () => {
        try {
            const res = await exportCsv({ start_date: filters.start_date, end_date: filters.end_date })
            const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
            const a = document.createElement('a')
            a.href = url; a.download = 'transactions.csv'; a.click()
            URL.revokeObjectURL(url)
        } catch {
            toast.error('Export failed')
        }
    }

    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

    return (
        <Layout>
            <div className="tx-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Transactions</h1>
                        <p className="page-subtitle">Manage your income and expenses</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="secondary" size="sm" onClick={handleExport}>
                            <Download size={14} /> Export CSV
                        </Button>
                        <Button variant="primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                            <Plus size={16} /> Add Transaction
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    <div className="search-wrap">
                        <Search size={15} className="search-icon" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={filters.search}
                            onChange={(e) => { setFilters((p) => ({ ...p, search: e.target.value })); setPage(1) }}
                            aria-label="Search transactions"
                        />
                    </div>
                    <select
                        value={filters.type}
                        onChange={(e) => { setFilters((p) => ({ ...p, type: e.target.value })); setPage(1) }}
                        aria-label="Filter by type"
                    >
                        <option value="">All types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                    <select
                        value={filters.category_id}
                        onChange={(e) => { setFilters((p) => ({ ...p, category_id: e.target.value })); setPage(1) }}
                        aria-label="Filter by category"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => { setFilters((p) => ({ ...p, start_date: e.target.value })); setPage(1) }}
                        aria-label="Start date"
                    />
                    <input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => { setFilters((p) => ({ ...p, end_date: e.target.value })); setPage(1) }}
                        aria-label="End date"
                    />
                    {Object.values(filters).some(Boolean) && (
                        <Button variant="ghost" size="sm" onClick={() => { setFilters({ type: '', category_id: '', search: '', start_date: '', end_date: '' }); setPage(1) }}>
                            Clear
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="table-card">
                    {loading ? (
                        <div className="loading-rows">
                            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-row" />)}
                        </div>
                    ) : transactions.length === 0 ? (
                        <EmptyState
                            title="No transactions found"
                            description="Try adjusting your filters or add a new transaction"
                            action={<Button variant="primary" size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> Add Transaction</Button>}
                        />
                    ) : (
                        <>
                            <div className="table-wrap" role="region" aria-label="Transactions table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Category</th>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => {
                                            const cat = catMap[tx.category_id] || {}
                                            return (
                                                <tr key={tx.id}>
                                                    <td>
                                                        <div className="td-desc">{tx.description}</div>
                                                        {tx.notes && <div className="td-note">{tx.notes}</div>}
                                                    </td>
                                                    <td><Badge color={cat.color}>{tx.category_name}</Badge></td>
                                                    <td className="td-date">{format(parseISO(tx.date), 'MMM d, yyyy')}</td>
                                                    <td>
                                                        <Badge color={tx.type === 'income' ? '#22c55e' : '#ef4444'}>
                                                            {tx.type}
                                                        </Badge>
                                                    </td>
                                                    <td className={`td-amount ${tx.type === 'income' ? 'amount--income' : 'amount--expense'}`}>
                                                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                                    </td>
                                                    <td className="td-actions">
                                                        <button
                                                            className="icon-btn"
                                                            onClick={() => { setEditing(tx); setModalOpen(true) }}
                                                            aria-label={`Edit ${tx.description}`}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            className="icon-btn icon-btn--danger"
                                                            onClick={() => handleDelete(tx.id)}
                                                            aria-label={`Delete ${tx.description}`}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {meta.totalPages > 1 && (
                                <div className="pagination" role="navigation" aria-label="Pagination">
                                    <Button variant="secondary" size="sm" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
                                        Previous
                                    </Button>
                                    <span className="page-info">Page {meta.page} of {meta.totalPages}</span>
                                    <Button variant="secondary" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <TransactionForm
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null) }}
                onSaved={handleSaved}
                transaction={editing}
                categories={categories}
            />
        </Layout>
    )
}

export default Transactions
