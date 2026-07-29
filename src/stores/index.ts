import { defineStore } from 'pinia'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers' // 👈 ¡Importamos tu parseJwt!
import http from '@/plugins/axios'
import router from '@/router'

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

        this.token = response.data.access_token
        localStorage.setItem('token', this.token || '')

        // 👈 Usamos la respuesta del backend que ya tiene el usuario completo
        const usuarioDelBackend = response.data.user
        const decoded = parseJwt(this.token || '')

        this.usuario = {
          id: usuarioDelBackend?.id || decoded?.id || null,
          email: usuarioDelBackend?.email || decoded?.email || '',
          rol: usuarioDelBackend?.rol || decoded?.rol || 'CLIENTE',
        }

        localStorage.setItem('usuario', JSON.stringify(this.usuario))

        // Si el backend avisa que requiere cambio, detenemos el flujo aquí y avisamos a LoginView
        if (response.data.debeCambiarClave) {
          return { debeCambiarClave: true }
        }

        // Flujo normal de redirección si ya cambió su clave en el pasado
        const userRole = this.usuario?.rol
        if (userRole === 'EMPLEADO') {
          router.push(this.returnUrl || '/admin')
        } else {
          router.push(this.returnUrl || '/')
        }

        return { debeCambiarClave: false }
      } catch (error) {
        this.logoutSilencioso()
        throw error
      }
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
