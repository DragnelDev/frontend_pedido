import http from '@/plugins/axios'
import type { EstadoCocina, PedidoCocina } from '@/models/cocina'

export const cocinaService = {
  async tablero(): Promise<PedidoCocina[]> {
    const { data } = await http.get<PedidoCocina[]>('cocina/pedidos')
    return data
  },

  async cambiarEstado(idPedido: number, estado: EstadoCocina): Promise<PedidoCocina> {
    const { data } = await http.patch<PedidoCocina>(`cocina/pedidos/${idPedido}/estado`, { estado })
    return data
  },
}
