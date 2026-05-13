import { reactive } from 'vue'
import api from '../services/api'
import { encrypt, decrypt } from '../utils/crypto'

const SESSION_KEY = 'cco_auth'
const TOKEN_KEY = 'cco_token'

export function useAuth() {
  const state = reactive({
    isAuthenticated: (function() {
      try {
        const raw = localStorage.getItem(TOKEN_KEY)
        return !!decrypt(raw)
      } catch (e) {
        return false
      }
    })(),
    loginUser: '',
    loginPass: '',
    loginError: false,
  })

  function login() {
    const payload = {
      email: state.loginUser.trim(),
      password: state.loginPass
    }

    return api.post('/auth/login', payload)
      .then(response => {
        const token = response.data?.token || response.data?.data?.token
        if (token) {
          localStorage.setItem(TOKEN_KEY, encrypt(token))
          sessionStorage.setItem(SESSION_KEY, '1')
          state.isAuthenticated = true
          state.loginError = false
          return true
        }
        state.loginError = true
        return false
      })
      .catch(error => {
        console.error('Login error:', error)
        state.loginError = true
        return false
      })
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    state.isAuthenticated = false
    state.loginUser = ''
    state.loginPass = ''
  }

  function checkLogin() {
    return state.isAuthenticated
  }

  return {
    state,
    login,
    logout,
    checkLogin
  }
}
