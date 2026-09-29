// Tipado mínimo de la API de Google Identity Services (GIS) que usamos.
// La librería se carga dinámicamente desde el CDN de Google, por eso
// se declara 'google' como global en vez de instalar un paquete npm.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: (
            notification?: (notification: {
              isNotDisplayed: () => boolean
              isSkippedMoment: () => boolean
            }) => void,
          ) => void
        }
      }
    }
  }
}

let scriptCargado = false
let scriptPromise: Promise<void> | null = null

function cargarScriptGoogle(): Promise<void> {
  if (scriptCargado) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      scriptCargado = true
      resolve()
    }
    script.onerror = () => reject(new Error('No se pudo cargar el script de Google'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Solicita al usuario iniciar sesión con Google y devuelve el ID token
 * (credential) que el backend verificará en POST /auth/google.
 *
 * Usa el flujo "One Tap / Sign In With Google" de Google Identity Services.
 */
export async function solicitarCredentialGoogle(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID no está configurado en el frontend')
  }

  await cargarScriptGoogle()

  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services no está disponible'))
      return
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      callback: (response) => {
        if (response?.credential) {
          resolve(response.credential)
        } else {
          reject(new Error('No se recibió el credential de Google'))
        }
      },
    })

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(
          new Error(
            'El diálogo de Google no se pudo mostrar. Verifica que los pop-ups estén permitidos.',
          ),
        )
      }
    })
  })
}

export {}
