import api from './api'

export const getMonthlySummary = (params) => api.get('/reports/monthly', { params })
export const exportCsv = (params) => api.get('/reports/export', {
    params,
    responseType: 'blob',
})
