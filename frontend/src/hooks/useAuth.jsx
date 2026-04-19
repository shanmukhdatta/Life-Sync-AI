import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('lifesync_token'))
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async (tokenToVerify) => {
    if (!tokenToVerify) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      // Force token in headers since it might be new and interceptor might read old value
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      })
      setUser(res.data)
      setToken(tokenToVerify)
      localStorage.setItem('lifesync_token', tokenToVerify)
    } catch (err) {
      console.error("Auth check failed:", err)
      setUser(null)
      setToken(null)
      localStorage.removeItem('lifesync_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check if token in URL (OAuth redirect)
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      // Clean URL without refreshing page
      window.history.replaceState({}, document.title, window.location.pathname)
      checkAuth(urlToken)
    } else {
      checkAuth(token)
    }
  }, [checkAuth, token])

  const login = async () => {
    try {
      const res = await api.get('/api/auth/login')
      if (res.data.auth_url) {
        window.location.href = res.data.auth_url
      }
    } catch (err) {
      console.error("Login redirect failed:", err)
    }
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (err) {
      // ignore
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('lifesync_token')
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
