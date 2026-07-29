export interface MetodoQr {
  activo: boolean
  banco: string
  titular: string
  imagenQrUrl: string
}

export interface MetodoTransferencia {
  activo: boolean
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  titular: string
  ciNit: string
}

export interface MetodoEfectivo {
  activo: boolean
  descripcion: string
}

export interface MetodosPago {
  qr: MetodoQr
  transferencia: MetodoTransferencia
  efectivo: MetodoEfectivo
}

export interface Configuracion {
  id: number
  nombre: string
  nit: string | null
  direccion: string | null
  telefonoWhatsapp: string | null
  emailContacto: string | null
  logoUrl: string | null
  metodosPago: MetodosPago
  fechaModificacion: string
}

export type ActualizarConfiguracionPayload = Partial<
  Omit<Configuracion, 'id' | 'fechaModificacion'>
>
