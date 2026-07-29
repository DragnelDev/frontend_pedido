export interface Direccion {
  id: number
  idCliente: number
  etiqueta: string
  direccion: string
  referencia?: string | null
  latitud?: number | null
  longitud?: number | null
  principal: boolean
  fechaCreacion: string
}

export interface CrearDireccionPayload {
  etiqueta: string
  direccion: string
  referencia?: string
  latitud?: number
  longitud?: number
  principal?: boolean
}
