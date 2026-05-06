import { ReactComponent as GoogleIcon } from '../../assets/icons/googleIcon.svg'
import { ICONS } from './constants'
const Icon = ({ type }) => {
    switch (type) {
        case ICONS.google:
            return <GoogleIcon />
        default:
            console.error('Icon not available.')
    }
}
export default Icon
