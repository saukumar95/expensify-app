import './Badge.css'

const Badge = ({ children, color = '#6b7280', size = 'sm' }) => (
    <span
        className={`badge badge--${size}`}
        style={{ background: color + '22', color }}
    >
        {children}
    </span>
)

export default Badge
