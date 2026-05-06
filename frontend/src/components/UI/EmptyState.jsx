import './EmptyState.css'

const EmptyState = ({ icon, title, description, action }) => (
    <div className="empty-state">
        {icon && <div className="empty-icon" aria-hidden="true">{icon}</div>}
        <p className="empty-title">{title}</p>
        {description && <p className="empty-desc">{description}</p>}
        {action && <div className="empty-action">{action}</div>}
    </div>
)

export default EmptyState
