export type CategoriaGasto = 'insumos' | 'servicios' | 'empaques' | 'mantenimiento' | 'otros'

export interface Gasto {
  id: number
  idEmpleado: number
  fecha: string
  concepto: string
  categoria: CategoriaGasto
  monto: number
  comprobante: string | null
  fechaCreacion: string
}

export interface CrearGastoPayload {
  fecha?: string
  concepto: string
  categoria: CategoriaGasto
  comprobante?: string
  monto: number
}

export interface ResumenGastosMes {
  mes: string
  total: number
  cantidad: number
}

export interface CierreCaja {
  id: number
  fecha: string
  idEmpleado: number
  montoInicial: number
  ventasEfectivoSistema: number
  ventasDigitalSistema: number
  efectivoContado: number
  diferencia: number
  observaciones: string | null
  fechaCreacion: string
}

export interface ResumenDiaCaja {
  fecha: string
  ventasEfectivoSistema: number
  ventasDigitalSistema: number
  totalVentasSistema: number
  yaCerrado: boolean
  cierre: CierreCaja | null
}

export interface CrearCierreCajaPayload {
  fecha: string
  montoInicial: number
  efectivoContado: number
  observaciones?: string
}

export interface FilaLibroVentas {
  id: number
  fecha: string
  nroFactura: number
  cliente: string
  ciNit: string
  monto: number
  metodo: string
}

export interface LibroVentas {
  mes: string
  total: number
  filas: FilaLibroVentas[]
}
