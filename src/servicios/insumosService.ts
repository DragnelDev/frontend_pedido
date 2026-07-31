import http from '@/plugins/axios'
import type {
  AjustarStockPayload,
  ActualizarInsumoPayload,
  CrearInsumoPayload,
  Insumo,
} from '@/models/insumo'

const ENDPOINT = 'insumos'

export const insumosService = {
  async listar(soloBajoStock = false): Promise<Insumo[]> {
    const { data } = await http.get<Insumo[]>(ENDPOINT, {
      params: soloBajoStock ? { bajoStock: 'true' } : {},
    })
    return data
  },

  async crear(payload: CrearInsumoPayload): Promise<Insumo> {
    const { data } = await http.post<Insumo>(ENDPOINT, payload)
    return data
  },

  async actualizar(id: number, payload: ActualizarInsumoPayload): Promise<Insumo> {
    const { data } = await http.patch<Insumo>(`${ENDPOINT}/${id}`, payload)
    return data
  },

  async ajustarStock(id: number, payload: AjustarStockPayload): Promise<Insumo> {
    const { data } = await http.patch<Insumo>(`${ENDPOINT}/${id}/ajustar-stock`, payload)
    return data
  },

  async eliminar(id: number): Promise<{ message: string }> {
    const { data } = await http.delete(`${ENDPOINT}/${id}`)
    return data
  },
}
