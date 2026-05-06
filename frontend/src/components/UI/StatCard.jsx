import './StatCard.css'

const StatCard = ({ label, value, icon, color = '#6366f1', trend, trendLabel }) => {
    const isPositive = trend > 0
    const isNegative = trend < 0

    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: color + '18', color }}>
                {icon}
            </div>
            <div className="stat-content">
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
                {trend !== undefined && (
                    <p className={`stat-trend ${isPositive ? 'trend--up' : isNegative ? 'trend--down' : ''}`}>
                        {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
                        {trendLabel && <span className="trend-label"> {trendLabel}</span>}
                    </p>
                )}
            </div>
        </div>
    )
}

export default StatCard
