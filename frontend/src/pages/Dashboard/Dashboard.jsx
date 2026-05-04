import { useEffect, useState, useCallback } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'
import Layout from '../../components/Layout/Layout'
import StatCard from '../../components/UI/StatCard'
import Button from '../../components/UI/Button'
import Badge from '../../components/UI/Badge'
import EmptyState from '../../components/UI/EmptyState'
import TransactionForm from '../../components/TransactionForm/TransactionForm'
import { getSummary, getMonthlyTrend, getCategoryBreakdown, getTransactions } from '../../services/transaction.service'
import { getCategories } from '../../services/category.service'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11}>{`${(percent * 100).toFixed(0)}%`}</text>
}

const Dashboard = () => {
    const { user } = useAuth()
    const now = new Date()
    const year  = now.getFullYear()
    const month = now.getMonth() + 1

    const [summary, setSummary]     = useState(null)
    const [trend, setTrend]         = useState([])
    const [breakdown, setBreakdown] = useState([])
    const [recent, setRecent]       = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading]     = useState(true)
    const [modalOpen, setModalOpen] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [s, t, b, r, cats] = await Promise.all([
                getSummary({ year, month }),
                getMonthlyTrend({ months: 6 }),
                getCategoryBreakdown({ year, month, type: 'expense' }),
                getTransactions({ limit: 8, sort: 'date', order: 'desc' }),
                getCategories(),
            ])
            setSummary(s.data.data)
            setTrend(t.data.data)
            setBreakdown(b.data.data)
            setRecent(r.data.data)
            setCategories(cats.data.data)
        } catch {
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [year, month])

    useEffect(() => { load() }, [load])

    const handleSaved = () => { setModalOpen(false); load() }

    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

    return (
        <Layout>
            <div className="dash-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
                        <p className="page-subtitle">{format(now, 'MMMM yyyy')} overview</p>
                    </div>
                    <Button variant="primary" onClick={() => setModalOpen(true)}>
                        <Plus size={16} /> Add Transaction
                    </Button>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <StatCard
                        label="Balance"
                        value={`$${(summary?.balance ?? 0).toFixed(2)}`}
                        icon={<Wallet size={20} />}
                        color="#6366f1"
                    />
                    <StatCard
                        label="Income"
                        value={`$${(summary?.income ?? 0).toFixed(2)}`}
                        icon={<TrendingUp size={20} />}
                        color="#22c55e"
                    />
                    <StatCard
                        label="Expenses"
                        value={`$${(summary?.expense ?? 0).toFixed(2)}`}
                        icon={<TrendingDown size={20} />}
                        color="#ef4444"
                    />
                    <StatCard
                        label="Savings Rate"
                        value={summary?.income > 0
                            ? `${(((summary.income - summary.expense) / summary.income) * 100).toFixed(0)}%`
                            : '—'}
                        icon={<DollarSign size={20} />}
                        color="#f59e0b"
                    />
                </div>

                {/* Charts */}
                <div className="charts-grid">
                    <div className="chart-card">
                        <h3 className="chart-title">Monthly Trend</h3>
                        {trend.length === 0 ? (
                            <EmptyState title="No data yet" />
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={trend} barGap={4}>
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => format(parseISO(`${v}-01`), 'MMM')} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                                    <Legend />
                                    <Bar dataKey="income"  name="Income"  fill="#22c55e" radius={[3,3,0,0]} />
                                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3,3,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title">Expenses by Category</h3>
                        {breakdown.length === 0 ? (
                            <EmptyState title="No expenses this month" />
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={breakdown}
                                        dataKey="total"
                                        nameKey="name"
                                        cx="50%" cy="50%"
                                        outerRadius={80}
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {breakdown.map((entry) => (
                                            <Cell key={entry.id} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                                    <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Recent transactions */}
                <div className="recent-card">
                    <div className="recent-header">
                        <h3 className="chart-title">Recent Transactions</h3>
                    </div>
                    {loading ? (
                        <div className="loading-rows">
                            {[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" />)}
                        </div>
                    ) : recent.length === 0 ? (
                        <EmptyState
                            title="No transactions yet"
                            description="Add your first transaction to get started"
                            action={<Button variant="primary" size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> Add Transaction</Button>}
                        />
                    ) : (
                        <div className="tx-list">
                            {recent.map((tx) => {
                                const cat = catMap[tx.category_id] || {}
                                return (
                                    <div key={tx.id} className="tx-row">
                                        <div className="tx-icon" style={{ background: (cat.color || '#6b7280') + '22', color: cat.color || '#6b7280' }}>
                                            {tx.description[0].toUpperCase()}
                                        </div>
                                        <div className="tx-info">
                                            <p className="tx-desc">{tx.description}</p>
                                            <p className="tx-meta">
                                                <Badge color={cat.color}>{tx.category_name}</Badge>
                                                <span>{format(parseISO(tx.date), 'MMM d')}</span>
                                            </p>
                                        </div>
                                        <p className={`tx-amount ${tx.type === 'income' ? 'amount--income' : 'amount--expense'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <TransactionForm
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
                categories={categories}
            />
        </Layout>
    )
}

export default Dashboard
