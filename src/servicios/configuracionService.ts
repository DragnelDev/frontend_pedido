import { ref } from 'vue'
import http from '@/plugins/axios'
import type { ActualizarConfiguracionPayload, Configuracion } from '@/models/configuracion'

const ENDPOINT = 'configuracion'

export const logoUrlConfiguracion = ref<string | null>(null)

export const configuracionService = {
  async subirImagen(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await http.post<{ url: string | null }>('uploads', formData)

    if (!data.url) {
      throw new Error('No se pudo subir la imagen')
    }

    return data.url
  },

  async obtener(): Promise<Configuracion> {
    const { data } = await http.get<Configuracion>(ENDPOINT)
    logoUrlConfiguracion.value = data.logoUrl || null
    return data
  },

  async actualizar(payload: ActualizarConfiguracionPayload): Promise<Configuracion> {
    const { data } = await http.patch<Configuracion>(ENDPOINT, payload)
    logoUrlConfiguracion.value = data.logoUrl || null
    return data
  },
}
