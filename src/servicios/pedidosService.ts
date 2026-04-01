import http from '@/plugins/axios'

export const pedidosService = {
  async crearPedido(pedido: any) {
    const res = await http.post('/pedidos', pedido)
    return res.data
  },

  async agregarProductos(idPedido: number, productos: any[]) {
    for (const producto of productos) {
      await http.post('/detalle-pedidos', {
        idPedido,
        idProducto: producto.id_producto,
        cantidad: producto.cantidad,
        precioUnitario: producto.precio_unitario,
      })
    }
  },

  async registrarPago(idPedido: number, metodo: string, monto: number) {
    const res = await http.post('/pagos', {
      idPedido,
      metodo,
      monto,
      estado: 'pendiente',
    })
    return res.data
  },
}
