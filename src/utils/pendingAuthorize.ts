/**
 * PayBito sign-in always returns to www.bitocircle.com, so an app authorization started while signed out would be
 * lost. The authorize page saves itself here before sending the user to sign in, and the sign-in handler sends the
 * user back. Only BitoCircle's own /authorize pages can be saved, and only for 15 minutes.
 */
const KEY = 'bc_pending_authorize'
const MAX_AGE_MS = 15 * 60 * 1000
const ALLOWED = /^\/(sandbox\/)?authorize\?/

export const savePendingAuthorize = (): void => {
  try {
    const path = window.location.pathname + window.location.search
    if (ALLOWED.test(path)) {
      localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }))
    }
  } catch {
    // storage unavailable: the user can start again from the app
  }
}

/** The saved authorize path (removed once read), or null. */
export const takePendingAuthorize = (): string | null => {
  try {
    const raw = localStorage.getItem(KEY)
    localStorage.removeItem(KEY)
    if (!raw) return null
    const { path, at } = JSON.parse(raw) as { path: string; at: number }
    return typeof path === 'string' && ALLOWED.test(path) && Date.now() - at < MAX_AGE_MS ? path : null
  } catch {
    return null
  }
}
