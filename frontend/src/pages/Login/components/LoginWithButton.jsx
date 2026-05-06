import { Icon } from '../../../components'
import { ICONS } from '../../../components/Icon/constants'
import './LoginWithButton.css'

const LoginWithButton = ({ label = 'Log in with Google Account' }) => {
    return (
        <div className="button-container">
            <button type="button" className="btn-login-with">
                <span className="btn-icon">
                    <Icon type={ICONS.google} />
                </span>
                <span style={{ fontSize: '14px' }}>{label}</span>
            </button>
        </div>
    )
}

export default LoginWithButton
