import http from '@/plugins/axios'
import type { Favorito } from '@/models/favorito'

const ENDPOINT = 'favoritos'

export const favoritosService = {
  async listarMios(): Promise<Favorito[]> {
    const { data } = await http.get<Favorito[]>(`${ENDPOINT}/mios`)
    return data
  },

  async agregar(idProducto: number): Promise<Favorito> {
    const { data } = await http.post<Favorito>(ENDPOINT, { idProducto })
    return data
  },

  async eliminar(idProducto: number): Promise<{ message: string }> {
    const { data } = await http.delete(`${ENDPOINT}/${idProducto}`)
    return data
  },
}
