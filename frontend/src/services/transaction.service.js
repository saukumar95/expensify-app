import api from './api'

export const getTransactions    = (params) => api.get('/transactions', { params })
export const getTransaction     = (id) => api.get(`/transactions/${id}`)
export const createTransaction  = (data) => api.post('/transactions', data)
export const updateTransaction  = (id, data) => api.put(`/transactions/${id}`, data)
export const deleteTransaction  = (id) => api.delete(`/transactions/${id}`)
export const getSummary         = (params) => api.get('/transactions/summary', { params })
export const getMonthlyTrend    = (params) => api.get('/transactions/trend', { params })
export const getCategoryBreakdown = (params) => api.get('/transactions/breakdown', { params })
