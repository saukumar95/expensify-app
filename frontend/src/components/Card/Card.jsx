import './Card.css'
const Card = ({ title, subtitle, children, footer }) => {
    return (
        <div className="card">
            <div>
                <div className="title">{title}</div>
                {subtitle && <span className="subtitle">{subtitle}</span>}
            </div>
            <form className="body">{children}</form>
            <div className="footer">{footer}</div>
        </div>
    )
}

export default Card
