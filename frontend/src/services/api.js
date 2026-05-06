import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
})

//  Request interceptor — attach access token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

//  Response interceptor — refresh token on 401 
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)))
    failedQueue = []
}

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config

        if (err.response?.status === 401 && !original._retry) {
            const code = err.response?.data?.code
            if (code === 'TOKEN_EXPIRED') {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    }).then((token) => {
                        original.headers.Authorization = `Bearer ${token}`
                        return api(original)
                    })
                }

                original._retry = true
                isRefreshing = true

                try {
                    const refreshToken = localStorage.getItem('refreshToken')
                    if (!refreshToken) throw new Error('No refresh token')

                    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
                    const { accessToken, refreshToken: newRefresh } = data.data

                    localStorage.setItem('accessToken', accessToken)
                    localStorage.setItem('refreshToken', newRefresh)

                    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
                    processQueue(null, accessToken)

                    original.headers.Authorization = `Bearer ${accessToken}`
                    return api(original)
                } catch (refreshErr) {
                    processQueue(refreshErr, null)
                    localStorage.clear()
                    window.location.href = '/'
                    return Promise.reject(refreshErr)
                } finally {
                    isRefreshing = false
                }
            }

            // Other 401 (invalid token, no token)
            localStorage.clear()
            window.location.href = '/'
        }

        return Promise.reject(err)
    }
)

export default api
