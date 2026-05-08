import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3333/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add an interceptor to include the token in every request if it exists
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('cco_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    console.error('API Interceptor: localStorage error', e)
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api
