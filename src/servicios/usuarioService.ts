import http from '@/plugins/axios'

const ENDPOINT = 'usuarios'

export const usuariosService = {
  async listar() {
    const { data } = await http.get(ENDPOINT)
    return data
  },

  async obtenerPorEmail(email: string) {
    const { data } = await http.get(`${ENDPOINT}/buscar/${email}`)
    return data
  },

  async crear(usuario: any) {
    const { data } = await http.post(ENDPOINT, usuario)
    return data
  },

  async actualizar(id: number, usuario: any) {
    const { data } = await http.patch(`${ENDPOINT}/${id}`, usuario)
    return data
  },

  async eliminar(id: number) {
    const { data } = await http.delete(`${ENDPOINT}/${id}`)
    return data
  },

  // Perfil del usuario autenticado (basado en el token JWT, no en un id
  // manual). Usar estos métodos en vez de obtener/actualizar por :id
  // cuando se trata del propio usuario logueado.
  async miPerfil() {
    const { data } = await http.get(`${ENDPOINT}/perfil`)
    return data
  },

  async actualizarMiPerfil(cambios: any) {
    const { data } = await http.patch(`${ENDPOINT}/perfil`, cambios)
    return data
  },
}
