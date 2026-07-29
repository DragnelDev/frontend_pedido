import http from '@/plugins/axios'
import type {
  CierreCaja,
  CrearCierreCajaPayload,
  CrearGastoPayload,
  Gasto,
  LibroVentas,
  ResumenDiaCaja,
  ResumenGastosMes,
} from '@/models/contabilidad'

export const gastosService = {
  async listar(mes?: string): Promise<Gasto[]> {
    const { data } = await http.get<Gasto[]>('gastos', { params: mes ? { mes } : {} })
    return data
  },

  async resumenMes(mes?: string): Promise<ResumenGastosMes> {
    const { data } = await http.get<ResumenGastosMes>('gastos/resumen', {
      params: mes ? { mes } : {},
    })
    return data
  },

  async registrar(payload: CrearGastoPayload): Promise<Gasto> {
    const { data } = await http.post<Gasto>('gastos', payload)
    return data
  },

  async eliminar(id: number): Promise<{ message: string }> {
    const { data } = await http.delete(`gastos/${id}`)
    return data
  },
}

export const cierreCajaService = {
  async listar(): Promise<CierreCaja[]> {
    const { data } = await http.get<CierreCaja[]>('cierres-caja')
    return data
  },

  async resumenDia(fecha?: string): Promise<ResumenDiaCaja> {
    const { data } = await http.get<ResumenDiaCaja>('cierres-caja/resumen-dia', {
      params: fecha ? { fecha } : {},
    })
    return data
  },

  async registrar(payload: CrearCierreCajaPayload): Promise<CierreCaja> {
    const { data } = await http.post<CierreCaja>('cierres-caja', payload)
    return data
  },
}

export const libroVentasService = {
  async listar(mes?: string): Promise<LibroVentas> {
    const { data } = await http.get<LibroVentas>('libro-ventas', {
      params: mes ? { mes } : {},
    })
    return data
  },
}
