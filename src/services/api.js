import axios from 'axios'
import { decrypt } from '../utils/crypto'

const api = axios.create({
  baseURL: 'http://localhost:3333/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add an interceptor to include the token in every request if it exists
api.interceptors.request.use((config) => {
  try {
    const rawToken = localStorage.getItem('cco_token')
    const token = decrypt(rawToken)
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
