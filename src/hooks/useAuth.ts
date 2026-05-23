import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { login, register, logout, initialize } = useAuthStore(state => state)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    setError(null)
    try {
      await register(email, password, fullName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    initialize
  }
}