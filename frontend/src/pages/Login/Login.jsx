import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Wallet, Eye, EyeOff } from 'lucide-react'
import { register, login } from '../../services/auth.service'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/UI/Button'
import './Login.css'

const Login = () => {
    const [isLogin, setIsLogin]   = useState(true)
    const [showPwd, setShowPwd]   = useState(false)
    const [loading, setLoading]   = useState(false)
    const [form, setForm]         = useState({ name: '', email: '', password: '', agree: false })
    const { login: authLogin }    = useAuth()
    const navigate                = useNavigate()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.email || !form.password) return toast.error('Please fill in all fields')
        if (!isLogin && !form.name.trim()) return toast.error('Name is required')
        if (!isLogin && !form.agree) return toast.error('Please accept the terms')

        setLoading(true)
        try {
            const { data } = isLogin
                ? await login({ email: form.email, password: form.password })
                : await register({ name: form.name, email: form.email, password: form.password })

            authLogin(data.data.accessToken, data.data.refreshToken, data.data.user)
            toast.success(isLogin ? 'Welcome back!' : 'Account created!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-left" aria-hidden="true">
                <div className="login-brand">
                    <Wallet size={32} />
                    <span>Expensify</span>
                </div>
                <div className="login-hero">
                    <h2>Take control of your finances</h2>
                    <p>Track income, manage expenses, and get AI-powered insights to reach your financial goals.</p>
                </div>
                <div className="login-features">
                    {['Smart expense categorization', 'Real-time spending insights', 'Budget tracking & alerts', 'Monthly reports & CSV export'].map((f) => (
                        <div key={f} className="feature-item">
                            <span className="feature-dot" />
                            {f}
                        </div>
                    ))}
                </div>
            </div>

            <div className="login-right">
                <div className="login-card">
                    <div className="login-card-header">
                        <h1>{isLogin ? 'Sign in' : 'Create account'}</h1>
                        <p>{isLogin ? 'Welcome back! Enter your details.' : 'Start managing your finances today.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form" noValidate>
                        {!isLogin && (
                            <div className="form-group">
                                <label htmlFor="name">Full name</label>
                                <input
                                    id="name" type="text" name="name"
                                    value={form.name} onChange={handleChange}
                                    placeholder="Your full name"
                                    autoComplete="name"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email address</label>
                            <input
                                id="email" type="email" name="email"
                                value={form.email} onChange={handleChange}
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{isLogin ? 'Password' : 'Create password'}</label>
                            <div className="pwd-wrap">
                                <input
                                    id="password"
                                    type={showPwd ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    className="pwd-toggle"
                                    onClick={() => setShowPwd((p) => !p)}
                                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <label className="agree-label">
                                <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
                                <span>I agree to the <span className="link-text">terms of service</span> and <span className="link-text">privacy policy</span></span>
                            </label>
                        )}

                        <Button type="submit" variant="primary" fullWidth loading={loading}>
                            {isLogin ? 'Sign in' : 'Create account'}
                        </Button>
                    </form>

                    <p className="switch-text">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button className="switch-btn" onClick={() => setIsLogin((p) => !p)}>
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
