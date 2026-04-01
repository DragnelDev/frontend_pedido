// src/helpers/index.ts
export function getTokenFromLocalStorage(): string | null {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    const payload = parseJwt(token)
    // Si no se pudo parsear o no hay exp, trata el token como inválido
    if (!payload || typeof payload.exp !== 'number') return null

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) return null

    // Aceptamos varios nombres de rol para compatibilidad con distintas APIs
    const userRole = payload?.rol || payload?.role || payload?.tipo
    if (!userRole) {
      // Puede ser un token válido sin campo de rol (p.ej. cliente regular).
      return token
    }

    return token
  } catch {
    return null
  }
}

export function parseJwt(token?: string): any | null {
  try {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64 = parts[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? ''
    const jsonPayload = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}
