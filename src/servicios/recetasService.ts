import http from '@/plugins/axios'
import type { ItemReceta, ReemplazarRecetaPayload } from '@/models/insumo'

export const recetasService = {
  async obtener(idProducto: number): Promise<ItemReceta[]> {
    const { data } = await http.get<ItemReceta[]>(`productos/${idProducto}/receta`)
    return data
  },

  async reemplazar(idProducto: number, payload: ReemplazarRecetaPayload): Promise<ItemReceta[]> {
    const { data } = await http.put<ItemReceta[]>(`productos/${idProducto}/receta`, payload)
    return data
  },
}
