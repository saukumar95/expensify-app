import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Transactions from './pages/Transactions/Transactions'
import Budgets from './pages/Budgets/Budgets'
import Reports from './pages/Reports/Reports'
import AIInsights from './pages/AIInsights/AIInsights'
import './index.css'

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                fontSize: '14px',
                            },
                        }}
                    />
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                        <Route path="/budgets"      element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
                        <Route path="/reports"      element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                        <Route path="/ai-insights"  element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
