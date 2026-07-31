export type EstadoCocina = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado'

export interface DetallePedidoCocina {
  id: number
  idProducto: number
  cantidad: number
  dedicatoria: string | null
  producto: {
    id: number
    nombre: string
  }
}

export interface PedidoCocina {
  id: number
  fechaPedido: string
  fechaEntrega: string
  estado: EstadoCocina
  direccionEnvio: string
  detallePedido: DetallePedidoCocina[]
  usuario: {
    cliente?: {
      nombre: string
      apellidoPaterno: string
    } | null
  } | null
}
