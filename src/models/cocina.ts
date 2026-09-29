export type EstadoCocina = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado'

export interface DetallePedidoCocina {
  id: number
  idProducto: number
  cantidad: number
  dedicatoria: string | null
  producto: {
    id: number
    nombre: string
    imagenUrl?: string | null
  }
}

export interface PagoCocina {
  estado: string
}

export interface PedidoCocina {
  id: number
  fechaPedido: string
  fechaEntrega: string
  estado: EstadoCocina
  direccionEnvio?: string | null
  tipoEnvio?: string | null
  detallePedido: DetallePedidoCocina[]
  pagos?: PagoCocina[]
  usuario: {
    cliente?: {
      nombre: string
      apellidoPaterno: string
    } | null
  } | null
}
