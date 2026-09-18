import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const initialize = useAuthStore((state) => state.initialize)
  const initializedRef = useRef(false)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    initialize()
  }, [initialize])

  // FIX: Si user fue restaurado por persist pero initialized sigue false,
  // forzar initialized a true para que hooks no queden bloqueados
  useEffect(() => {
    if (user && !useAuthStore.getState().initialized) {
      useAuthStore.setState({ loading: false, initialized: true })
    }
  }, [user])

  return <>{children}</>
}