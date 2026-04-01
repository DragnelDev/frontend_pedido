import type { Categoria } from './categoria'

export interface Producto {
  id: number
  idCategoria: number
  nombre: string
  descripcion: string
  precio: number
  stock: number
  porciones: number
  tiempoPreparacion: number
  imagenUrl: string
  categoria: Categoria
}
