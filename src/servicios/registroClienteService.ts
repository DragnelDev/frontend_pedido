import http from '@/plugins/axios'

export interface ClienteRegistrable {
  id?: number
  cedulaIdentidad: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  celular: string
  email: string
  direccion: string
}

export interface UsuarioRegistrable {
  email: string
  rol: string
  idCliente: number
}

export async function buscarClienteRegistrado(cedula: string, email: string) {
  const valor = cedula.trim() || email.trim()

  if (!valor) {
    return null
  }

  const { data } = await http.get(`/clientes/buscar?q=${encodeURIComponent(valor)}`)
  return data as ClienteRegistrable
}

export async function crearCliente(cliente: ClienteRegistrable) {
  const { data } = await http.post('/clientes', cliente)
  return data as ClienteRegistrable
}

export async function crearUsuario(usuario: UsuarioRegistrable) {
  const { data } = await http.post('/usuarios', usuario)
  return data
}
