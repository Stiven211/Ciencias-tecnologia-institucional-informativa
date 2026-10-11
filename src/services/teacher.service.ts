import { getAccessTokenFromStorage } from '../utils/supabaseRest'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-teacher`

export interface InviteTeacherInput {
  email: string
  password: string
  fullName: string
  role: 'teacher' | 'admin'
}

export interface InvitedTeacher {
  id: string
  email: string
  fullName: string
  role: 'teacher' | 'admin'
  delegated: boolean
}

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const message = (payload as { error?: unknown }).error
    if (typeof message === 'string' && message.trim() !== '') return message
  }
  return fallback
}

export const teacherService = {
  /**
   * Delega la creación de la cuenta a la Edge Function. Nunca se crea el
   * usuario desde el navegador: la secret key no puede salir del servidor.
   */
  async inviteTeacher(input: InviteTeacherInput): Promise<InvitedTeacher> {
    const token = getAccessTokenFromStorage()
    if (!token) {
      throw new Error('Sesión no disponible. Inicia sesión nuevamente.')
    }

    let response: Response
    try {
      response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          fullName: input.fullName,
          role: input.role,
        }),
      })
    } catch {
      throw new Error('No se pudo contactar el servidor. Revisa tu conexión.')
    }

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(
        extractErrorMessage(payload, 'No se pudo registrar al profesor.')
      )
    }

    return payload as InvitedTeacher
  },
}
