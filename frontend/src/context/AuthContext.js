import { createContext, useContext, useState, useCallback } from 'react'
import * as authService from '../services/auth.service'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
    })

    const login = useCallback((accessToken, refreshToken, userData) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
    }, [])

    const logout = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) await authService.logout(refreshToken)
        } catch { /* ignore */ }
        localStorage.clear()
        setUser(null)
    }, [])

    const updateUser = useCallback((updates) => {
        setUser((prev) => {
            const updated = { ...prev, ...updates }
            localStorage.setItem('user', JSON.stringify(updated))
            return updated
        })
    }, [])

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
