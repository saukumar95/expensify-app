import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, ArrowLeftRight, PieChart, Target,
    BarChart3, Brain, LogOut, Menu, X, Sun, Moon, Wallet
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import './Layout.css'

const NAV_ITEMS = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
    { to: '/budgets',      icon: Target,          label: 'Budgets'      },
    { to: '/reports',      icon: BarChart3,        label: 'Reports'      },
    { to: '/ai-insights',  icon: Brain,           label: 'AI Insights'  },
]

const Layout = ({ children }) => {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    return (
        <div className="layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <Wallet size={22} className="brand-icon" />
                        <span>Expensify</span>
                    </div>
                    <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav" aria-label="Main navigation">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Icon size={18} aria-hidden="true" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar" aria-hidden="true">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                            <p className="user-name">{user?.name}</p>
                            <p className="user-email">{user?.email}</p>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} aria-label="Log out">
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="main-wrapper">
                <header className="topbar">
                    <button
                        className="menu-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={sidebarOpen}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="topbar-right">
                        <button
                            className="theme-btn"
                            onClick={toggleTheme}
                            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    </div>
                </header>

                <main className="page-content" id="main-content">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default Layout
