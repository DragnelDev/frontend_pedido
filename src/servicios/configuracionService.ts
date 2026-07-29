import http from '@/plugins/axios'
import type { ActualizarConfiguracionPayload, Configuracion } from '@/models/configuracion'

const ENDPOINT = 'configuracion'

export const configuracionService = {
  async obtener(): Promise<Configuracion> {
    const { data } = await http.get<Configuracion>(ENDPOINT)
    return data
  },

  async actualizar(payload: ActualizarConfiguracionPayload): Promise<Configuracion> {
    const { data } = await http.patch<Configuracion>(ENDPOINT, payload)
    return data
  },
}
