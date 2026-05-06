import api from './api'

export const categorize          = (description) => api.post('/ai/categorize', { description })
export const getInsights         = () => api.get('/ai/insights')
export const getBudgetSuggestions = () => api.get('/ai/budget-suggestions')
