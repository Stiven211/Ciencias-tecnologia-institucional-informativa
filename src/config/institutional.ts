const DEFAULT_MAX_INSTITUTIONAL_USERS = 7

const parseLimit = (raw: string | undefined): number => {
  if (raw === undefined || raw.trim() === '') return DEFAULT_MAX_INSTITUTIONAL_USERS
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_MAX_INSTITUTIONAL_USERS
  return parsed
}

const parseBool = (raw: string | undefined, fallback: boolean): boolean => {
  if (raw === undefined || raw.trim() === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase())
}

export const MAX_INSTITUTIONAL_USERS = parseLimit(
  import.meta.env.VITE_MAX_INSTITUTIONAL_USERS
)

export const IS_REGISTRATION_LIMITED = MAX_INSTITUTIONAL_USERS > 0

/**
 * Public self-registration is closed by default. Teachers are created by an
 * admin (see Roadmap F1). The project's Supabase auth config also has
 * `disable_signup = true`, so this flag only controls whether we show the
 * form at all -- it is not a security boundary on its own.
 */
export const PUBLIC_REGISTRATION_ENABLED = parseBool(
  import.meta.env.VITE_PUBLIC_REGISTRATION,
  false
)
