import http from '@/plugins/axios'
import type { Producto } from '@/models/producto'

export const productoService = {
  async obtenerProductos(idCategoria?: number): Promise<Producto[]> {
    // Axios maneja los 'params' automáticamente como un objeto
    // No hace falta construir la string manualmente
    const res = await http.get('/productos', {
      params: idCategoria ? { idCategoria } : {},
    })
    return res.data
  },

  async obtenerProductoPorId(id: number): Promise<Producto> {
    // Usamos rutas relativas (empezando con /)
    const res = await http.get(`/productos/${id}`)
    return res.data
  },
}
