import { defineStore } from 'pinia'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers' // 👈 ¡Importamos tu parseJwt!
import http from '@/plugins/axios'
import router from '@/router'
import { solicitarCredentialGoogle } from '@/funciones/googleAuth'

interface UsuarioSesion {
  id: number | null
  email: string
  rol: string
}

const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: JSON.parse(localStorage.getItem('usuario') || 'null') as UsuarioSesion | null,
    token: getTokenFromLocalStorage(),
    returnUrl: '',
  }),
  getters: {
    estaAutenticado: (state) => !!state.token,
    obtenerRol: (state) => state.usuario?.rol || '',
  },
  actions: {
    async login(email: string, clave: string) {
      try {
        const response = await http.post('/auth/login', { email, clave })
        return this.aplicarRespuestaLogin(response.data)
      } catch (error) {
        this.logoutSilencioso()
        throw error
      }
    },

    async loginWithGoogle() {
      try {
        const idToken = await solicitarCredentialGoogle()
        const response = await http.post('/auth/google', { idToken })
        return this.aplicarRespuestaLogin(response.data)
      } catch (error) {
        this.logoutSilencioso()
        throw error
      }
    },

    // Lógica compartida entre login tradicional y login con Google: guarda
    // el token/usuario en el store + localStorage, y decide a dónde navegar.
    aplicarRespuestaLogin(data: any) {
      this.token = data.access_token
      localStorage.setItem('token', this.token || '')

      const usuarioDelBackend = data.user
      const decoded = parseJwt(this.token || '')

      this.usuario = {
        id: usuarioDelBackend?.id || decoded?.id || null,
        email: usuarioDelBackend?.email || decoded?.email || '',
        rol: usuarioDelBackend?.rol || decoded?.rol || 'CLIENTE',
      }

      localStorage.setItem('usuario', JSON.stringify(this.usuario))

      // Si el backend avisa que requiere cambio, detenemos el flujo aquí y avisamos a LoginView
      if (data.debeCambiarClave) {
        return { debeCambiarClave: true, esNuevo: Boolean(data.esNuevo) }
      }

      // Flujo normal de redirección
      const userRole = this.usuario?.rol
      if (userRole === 'EMPLEADO') {
        router.push(this.returnUrl || '/admin')
      } else {
        // Si la cuenta se acaba de auto-crear con Google, la mandamos a
        // completar su perfil (CI, celular, dirección reales)
        router.push(data.esNuevo ? '/perfil/editar' : this.returnUrl || '/')
      }

      return { debeCambiarClave: false, esNuevo: Boolean(data.esNuevo) }
    },

    logout() {
      localStorage.removeItem('carrito')
      localStorage.clear()
      this.$reset()
      router.push('/login')
    },

    logoutSilencioso() {
      localStorage.clear()
      this.$reset()
    },
  },
})

export { useAuthStore }
