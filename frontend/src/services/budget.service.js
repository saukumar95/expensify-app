import api from './api'

export const getBudgets   = (params) => api.get('/budgets', { params })
export const upsertBudget = (data) => api.post('/budgets', data)
export const deleteBudget = (id) => api.delete(`/budgets/${id}`)
