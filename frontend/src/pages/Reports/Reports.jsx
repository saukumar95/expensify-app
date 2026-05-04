import { useEffect, useState, useCallback } from 'react'
import { Download, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import Layout from '../../components/Layout/Layout'
import Button from '../../components/UI/Button'
import EmptyState from '../../components/UI/EmptyState'
import { getMonthlySummary } from '../../services/report.service'
import { exportCsv } from '../../services/report.service'
import './Reports.css'

const Reports = () => {
    const [data, setData]     = useState([])
    const [loading, setLoading] = useState(true)
    const [year, setYear]     = useState(new Date().getFullYear())

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getMonthlySummary({ year })
            setData(res.data.data)
        } catch {
            toast.error('Failed to load report')
        } finally {
            setLoading(false)
        }
    }, [year])

    useEffect(() => { load() }, [load])

    const handleExport = async () => {
        try {
            const res = await exportCsv({ start_date: `${year}-01-01`, end_date: `${year}-12-31` })
            const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
            const a = document.createElement('a')
            a.href = url; a.download = `report-${year}.csv`; a.click()
            URL.revokeObjectURL(url)
        } catch {
            toast.error('Export failed')
        }
    }

    const chartData = data.map((d) => ({
        ...d,
        name: format(parseISO(`${d.month}-01`), 'MMM'),
    }))

    const totals = data.reduce((acc, d) => ({
        income:  acc.income  + d.income,
        expense: acc.expense + d.expense,
        balance: acc.balance + d.balance,
    }), { income: 0, expense: 0, balance: 0 })

    return (
        <Layout>
            <div className="reports-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Reports</h1>
                        <p className="page-subtitle">Annual financial summary</p>
                    </div>
                    <div className="header-actions">
                        <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Select year">
                            {[new Date().getFullYear() - 1, new Date().getFullYear()].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <Button variant="secondary" onClick={handleExport}>
                            <Download size={14} /> Export CSV
                        </Button>
                    </div>
                </div>

                {/* Annual totals */}
                {!loading && data.length > 0 && (
                    <div className="totals-grid">
                        <div className="total-card total-card--income">
                            <p className="total-label">Total Income</p>
                            <p className="total-value">${totals.income.toFixed(2)}</p>
                        </div>
                        <div className="total-card total-card--expense">
                            <p className="total-label">Total Expenses</p>
                            <p className="total-value">${totals.expense.toFixed(2)}</p>
                        </div>
                        <div className={`total-card ${totals.balance >= 0 ? 'total-card--positive' : 'total-card--negative'}`}>
                            <p className="total-label">Net Balance</p>
                            <p className="total-value">${totals.balance.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="skeleton-chart" />
                ) : data.length === 0 ? (
                    <EmptyState icon={<BarChart3 size={40} />} title="No data for this year" />
                ) : (
                    <>
                        <div className="chart-card">
                            <h3 className="chart-title">Monthly Income vs Expenses</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                                    <Legend />
                                    <Bar dataKey="income"  name="Income"  fill="#22c55e" radius={[3,3,0,0]} />
                                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3,3,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card">
                            <h3 className="chart-title">Net Balance Trend</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                                    <Line type="monotone" dataKey="balance" name="Balance" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Monthly table */}
                        <div className="table-card">
                            <h3 className="chart-title">Monthly Breakdown</h3>
                            <div className="table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Income</th>
                                            <th>Expenses</th>
                                            <th>Balance</th>
                                            <th>Savings Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((d) => (
                                            <tr key={d.month}>
                                                <td>{format(parseISO(`${d.month}-01`), 'MMMM yyyy')}</td>
                                                <td className="amount--income">${d.income.toFixed(2)}</td>
                                                <td className="amount--expense">${d.expense.toFixed(2)}</td>
                                                <td className={d.balance >= 0 ? 'amount--income' : 'amount--expense'}>${d.balance.toFixed(2)}</td>
                                                <td>{d.savingsRate.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}

export default Reports
