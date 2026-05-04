import './Button.css'

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    type = 'button',
    onClick,
    className = '',
    ...rest
}) => {
    return (
        <button
            type={type}
            className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            aria-busy={loading}
            {...rest}
        >
            {loading && <span className="btn-spinner" aria-hidden="true" />}
            {children}
        </button>
    )
}

export default Button
