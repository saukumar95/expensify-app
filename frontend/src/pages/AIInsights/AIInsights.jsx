import { useEffect, useState } from 'react'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Info, XCircle, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import EmptyState from '../../components/UI/EmptyState'
import { getInsights, getBudgetSuggestions } from '../../services/ai.service'
import './AIInsights.css'

const TYPE_CONFIG = {
    positive: { icon: CheckCircle, color: '#22c55e', bg: 'var(--success-light)' },
    warning:  { icon: AlertTriangle, color: '#f59e0b', bg: 'var(--warning-light)' },
    danger:   { icon: XCircle, color: '#ef4444', bg: 'var(--danger-light)' },
    info:     { icon: Info, color: '#3b82f6', bg: 'var(--info-light)' },
}

const AIInsights = () => {
    const [insights, setInsights]         = useState([])
    const [suggestions, setSuggestions]   = useState([])
    const [loading, setLoading]           = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const [iRes, sRes] = await Promise.all([getInsights(), getBudgetSuggestions()])
                setInsights(iRes.data.data)
                setSuggestions(sRes.data.data)
            } catch {
                toast.error('Failed to load AI insights')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <Layout>
            <div className="ai-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">AI Insights</h1>
                        <p className="page-subtitle">Smart analysis of your spending patterns</p>
                    </div>
                    <div className="ai-badge">
                        <Brain size={16} />
                        <span>Powered by AI</span>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-grid">
                        {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}
                    </div>
                ) : (
                    <>
                        <section aria-labelledby="insights-heading">
                            <h2 id="insights-heading" className="section-title">
                                <TrendingUp size={18} /> Spending Insights
                            </h2>
                            {insights.length === 0 ? (
                                <EmptyState
                                    icon={<Brain size={40} />}
                                    title="Not enough data yet"
                                    description="Add more transactions to get personalized insights"
                                />
                            ) : (
                                <div className="insights-list">
                                    {insights.map((insight, i) => {
                                        const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.info
                                        const Icon = cfg.icon
                                        return (
                                            <div key={i} className="insight-card" style={{ background: cfg.bg, borderColor: cfg.color + '44' }}>
                                                <div className="insight-icon" style={{ color: cfg.color }}>
                                                    <Icon size={20} aria-hidden="true" />
                                                </div>
                                                <div className="insight-content">
                                                    <p className="insight-title" style={{ color: cfg.color }}>{insight.title}</p>
                                                    <p className="insight-message">{insight.message}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>

                        {suggestions.length > 0 && (
                            <section aria-labelledby="suggestions-heading">
                                <h2 id="suggestions-heading" className="section-title">
                                    <Lightbulb size={18} /> Budget Suggestions (50/30/20 Rule)
                                </h2>
                                <div className="suggestions-grid">
                                    {suggestions.map((s, i) => (
                                        <div key={i} className="suggestion-card">
                                            <p className="suggestion-category">{s.category}</p>
                                            <p className="suggestion-amount">${s.suggested.toFixed(2)}<span>/mo</span></p>
                                            <p className="suggestion-desc">{s.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="rule-note">Based on your average monthly income over the last 3 months.</p>
                            </section>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}

export default AIInsights
