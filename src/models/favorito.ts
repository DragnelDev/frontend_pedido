import type { Producto } from './producto'

export interface Favorito {
  id: number
  idCliente: number
  idProducto: number
  fechaCreacion: string
  producto: Producto
}
