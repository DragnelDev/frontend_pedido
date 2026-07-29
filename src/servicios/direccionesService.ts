import http from '@/plugins/axios'
import type { CrearDireccionPayload, Direccion } from '@/models/direccion'

const ENDPOINT = 'direcciones'

export const direccionesService = {
  async listarMias(): Promise<Direccion[]> {
    const { data } = await http.get<Direccion[]>(`${ENDPOINT}/mias`)
    return data
  },

  async crear(payload: CrearDireccionPayload): Promise<Direccion> {
    const { data } = await http.post<Direccion>(ENDPOINT, payload)
    return data
  },

  async actualizar(id: number, payload: Partial<CrearDireccionPayload>): Promise<Direccion> {
    const { data } = await http.patch<Direccion>(`${ENDPOINT}/${id}`, payload)
    return data
  },

  async marcarPrincipal(id: number): Promise<Direccion> {
    const { data } = await http.patch<Direccion>(`${ENDPOINT}/${id}/principal`)
    return data
  },

  async eliminar(id: number): Promise<{ message: string }> {
    const { data } = await http.delete(`${ENDPOINT}/${id}`)
    return data
  },
}
