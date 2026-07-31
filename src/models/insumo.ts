export type UnidadMedida = 'kg' | 'g' | 'l' | 'ml' | 'uds'

export interface Insumo {
  id: number
  nombre: string
  categoria: string
  unidadMedida: UnidadMedida
  stock: number
  stockMinimo: number
  costoUnitario: number | null
  activo: boolean
  fechaCreacion: string
}

export interface CrearInsumoPayload {
  nombre: string
  categoria: string
  unidadMedida: UnidadMedida
  stock: number
  stockMinimo: number
  costoUnitario?: number
}

export type ActualizarInsumoPayload = Partial<CrearInsumoPayload>

export type TipoAjusteStock = 'entrada' | 'salida'

export interface AjustarStockPayload {
  tipo: TipoAjusteStock
  cantidad: number
  motivo?: string
}

export interface ItemReceta {
  id: number
  idProducto: number
  idInsumo: number
  cantidadPorUnidad: number
  insumo: Insumo
}

export interface ReemplazarRecetaPayload {
  items: { idInsumo: number; cantidadPorUnidad: number }[]
}
