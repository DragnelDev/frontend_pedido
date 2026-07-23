<script setup lang="ts">
/**
 * PersonasView.vue
 * Vista reutilizable para Clientes, Empleados y Usuarios.
 * Backend: NestJS — todas las keys en camelCase.
 * Prop `tipo`: 'clientes' | 'empleados' | 'usuarios'
 */
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import http from '@/plugins/axios'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
const props = defineProps<{ tipo: 'clientes' | 'empleados' | 'usuarios' }>()

// ─────────────────────────────────────────────────────────────────────────────
// Tipos por entidad — alineados al DER (camelCase NestJS)
// ─────────────────────────────────────────────────────────────────────────────
type Cliente = {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  cedulaIdentidad: string
  celular: string
  email: string
  direccion: string
  fechaCreacion?: string
}

type Empleado = {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  cedulaIdentidad: string
  celular: string
  email: string
  direccion: string
  cargo: string
  salario: number
  fechaNacimiento?: string
  fechaIngreso?: string
  activo: boolean
}

type Usuario = {
  id: number
  imagenUrl: string
  clave: string
  rol: 'EMPLEADO' | 'CLIENTE'
  activo: boolean
  email: string
  idEmpleado?: number
  idCliente?: number
  empleado?: { nombre: string }
  cliente?: { nombre: string }
  fechaCambioClave?: string
  fechaCreacion?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuración por tipo
// ─────────────────────────────────────────────────────────────────────────────
type ColDef = { label: string; campo: string; tipo?: 'avatar' | 'badge' | 'bool' | 'fecha' | 'mono' }

type TipoConfig = {
  titulo: string
  singular: string
  sub: string
  icon: string
  emoji: string
  endpoint: string
  columnas: ColDef[]
}

const CONFIG: Record<string, TipoConfig> = {
  clientes: {
    titulo:   'Clientes',
    singular: 'Cliente',
    sub:      'Gestiona los clientes registrados',
    icon:     'pi pi-users',
    emoji:    '👥',
    endpoint: '/clientes',
    columnas: [
      { label: 'Nombre',    campo: 'nombre',           tipo: 'avatar' },
      { label: 'Ap. Paterno',campo: 'apellidoPaterno'                 },
      { label: 'CI',        campo: 'cedulaIdentidad',  tipo: 'mono'   },
      { label: 'Email',     campo: 'email'                             },
      { label: 'Celular',   campo: 'celular',          tipo: 'mono'   },
      { label: 'Dirección', campo: 'direccion'                         },
    ],
  },
  empleados: {
    titulo:   'Empleados',
    singular: 'Empleado',
    sub:      'Gestiona el personal de Berry Sweet',
    icon:     'pi pi-id-card',
    emoji:    '👔',
    endpoint: '/empleados',
    columnas: [
      { label: 'Nombre',     campo: 'nombre',           tipo: 'avatar' },
      { label: 'Ap. Paterno',campo: 'apellidoPaterno'                  },
      { label: 'CI',         campo: 'cedulaIdentidad',  tipo: 'mono'   },
      { label: 'Cargo',      campo: 'cargo',            tipo: 'badge'  },
      { label: 'Email',      campo: 'email'                             },
      { label: 'Celular',    campo: 'celular',          tipo: 'mono'   },
      { label: 'Activo',     campo: 'activo',           tipo: 'bool'   },
    ],
  },
  usuarios: {
    titulo:   'Usuarios',
    singular: 'Usuario',
    sub:      'Gestiona los accesos al sistema',
    icon:     'pi pi-user',
    emoji:    '🔐',
    endpoint: '/usuarios',
    columnas: [
      { label: 'Foto',      campo: 'imagenUrl',     tipo: 'avatar' },
      { label: 'Email',     campo: 'email'                           },
      { label: 'Rol',       campo: 'rol',           tipo: 'badge'  },
      { label: 'Vinculado', campo: '_vinculado'                    },
      { label: 'Activo',    campo: 'activo',        tipo: 'bool'   },
      { label: 'Cambio clave', campo: 'fechaCambioClave', tipo: 'fecha'  },
      { label: 'Creado',    campo: 'fechaCreacion', tipo: 'fecha'  },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Campos de formulario por tipo (camelCase, alineados al DER)
// ─────────────────────────────────────────────────────────────────────────────
type CampoForm = {
  key: string; label: string
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'password' | 'tel' | 'search'
  required?: boolean
  opciones?: string[]
  placeholder?: string
  soloCrear?: boolean   // solo aparece al crear, no al editar
  visibleSi?: (rol: string) => boolean  // mostrar campo según rol seleccionado
}

const CAMPOS_FORM: Record<string, CampoForm[]> = {
  clientes: [
    { key: 'nombre',           label: 'Nombre',           type: 'text',  required: true,  placeholder: 'Nombre del cliente' },
    { key: 'apellidoPaterno',  label: 'Apellido paterno', type: 'text',  required: true,  placeholder: 'Apellido paterno' },
    { key: 'apellidoMaterno',  label: 'Apellido materno', type: 'text',                   placeholder: 'Apellido materno' },
    { key: 'cedulaIdentidad',  label: 'Cédula de identidad', type: 'text', required: true, placeholder: 'Número de CI' },
    { key: 'celular',          label: 'Celular',          type: 'tel',                    placeholder: '75000000' },
    { key: 'email',            label: 'Correo electrónico', type: 'email',                placeholder: 'correo@ejemplo.com' },
    { key: 'direccion',        label: 'Dirección',        type: 'text',                   placeholder: 'Calle y número' },
  ],
  empleados: [
    { key: 'nombre',           label: 'Nombre',           type: 'text',  required: true,  placeholder: 'Nombre' },
    { key: 'apellidoPaterno',  label: 'Apellido paterno', type: 'text',  required: true,  placeholder: 'Apellido paterno' },
    { key: 'apellidoMaterno',  label: 'Apellido materno', type: 'text',                   placeholder: 'Apellido materno' },
    { key: 'cedulaIdentidad',  label: 'Cédula de identidad', type: 'text', required: true, placeholder: 'Número de CI' },
    { key: 'cargo',            label: 'Cargo',            type: 'text',                   placeholder: 'Ej: Cajero, Repartidor...' },
    { key: 'salario',          label: 'Salario (Bs.)',    type: 'number',                 placeholder: '0.00' },
    { key: 'celular',          label: 'Celular',          type: 'tel',                    placeholder: '75000000' },
    { key: 'email',            label: 'Correo electrónico', type: 'email',                placeholder: 'correo@ejemplo.com' },
    { key: 'direccion',        label: 'Dirección',        type: 'text',                   placeholder: 'Dirección del empleado' },
    { key: 'fechaNacimiento',  label: 'Fecha de nacimiento', type: 'date' },
    { key: 'fechaIngreso',     label: 'Fecha de ingreso',    type: 'date' },
  ],
  usuarios: [
    { key: 'rol',         label: 'Rol del sistema',    type: 'select',   required: true, opciones: ['CLIENTE', 'EMPLEADO'] },
    { key: 'idCliente',   label: 'Seleccionar Cliente',  type: 'search', required: false, placeholder: 'Buscar cliente...', visibleSi: (rol) => rol === 'CLIENTE' },
    { key: 'idEmpleado',  label: 'Seleccionar Empleado', type: 'search', required: false, placeholder: 'Buscar empleado...', visibleSi: (rol) => rol === 'EMPLEADO' },
    { key: 'imagenUrl',   label: 'Foto de perfil',     type: 'text',    required: false, placeholder: 'https://...' },
    { key: 'email',       label: 'Correo electrónico', type: 'email',    required: false, placeholder: 'correo@berrysw.com' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado reactivo
// ─────────────────────────────────────────────────────────────────────────────
const config   = computed(() => CONFIG[props.tipo])
const camposForm = computed(() => CAMPOS_FORM[props.tipo])

const registros   = ref<any[]>([])
const cargando    = ref(true)
const busqueda    = ref('')
const paginaActual = ref(1)
const POR_PAGINA   = 10

// Modal form
const showForm      = ref(false)
const modoEdicion   = ref(false)
const registroEdit  = ref<any>(null)
const guardando     = ref(false)
const form          = ref<Record<string, any>>({})
const formErrors    = ref<Record<string, string>>({})

// Modal confirmar eliminar
const showConfirm   = ref(false)
const registroDel   = ref<any>(null)
const eliminando    = ref(false)

// Búsqueda dinámica para usuarios (clientes/empleados)
const busquedaActiva    = ref<Record<string, string>>({})  // por campo
const listaResultados   = ref<Record<string, any[]>>({})   // por campo
const cargandoLista     = ref<Record<string, boolean>>({}) // por campo
const seleccionados     = ref<Record<string, any>>({})     // {idCliente: {...}, idEmpleado: {...}}

// Upload de imagen para usuarios
const subiendoImagen    = ref(false)
const dragOver          = ref(false)
const inputFileRef      = ref<HTMLInputElement | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Carga de datos
// ─────────────────────────────────────────────────────────────────────────────
async function cargar() {
  cargando.value = true
  busqueda.value = ''
  paginaActual.value = 1
  try {
    const { data } = await http.get(config.value.endpoint)
    registros.value = data
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al cargar datos')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
watch(() => props.tipo, cargar)

// ─────────────────────────────────────────────────────────────────────────────
// Filtrado y paginación
// ─────────────────────────────────────────────────────────────────────────────
const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return registros.value
  return registros.value.filter(r =>
    Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
  )
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / POR_PAGINA)))

const paginados = computed(() => {
  const i = (paginaActual.value - 1) * POR_PAGINA
  return filtrados.value.slice(i, i + POR_PAGINA)
})

function cambiarPagina(p: number) {
  if (p >= 1 && p <= totalPaginas.value) paginaActual.value = p
}

const pageButtons = computed(() => {
  const total = totalPaginas.value
  const cur   = paginaActual.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────
function abrirCrear() {
  form.value      = {}
  formErrors.value = {}
  seleccionados.value = {}
  busquedaActiva.value = {}
  listaResultados.value = {}
  modoEdicion.value  = false
  registroEdit.value = null
  showForm.value  = true
}

function abrirEditar(r: any) {
  // Copia sin campos readonly ni relaciones anidadas
  const copia: Record<string, any> = {}
  for (const c of camposForm.value) {
    if (c.soloCrear) continue
    copia[c.key] = r[c.key] ?? ''
  }
  form.value       = copia
  formErrors.value = {}

  // Para usuarios, cargar el empleado/cliente seleccionado
  if (props.tipo === 'usuarios') {
    form.value['rol'] = r.rol || ''
    
    if (r.rol === 'CLIENTE' && r.cliente) {
      seleccionados.value['idCliente'] = r.cliente
      form.value['idCliente'] = r.idCliente
      form.value['email'] = r.email
    } else if (r.rol === 'EMPLEADO' && r.empleado) {
      seleccionados.value['idEmpleado'] = r.empleado
      form.value['idEmpleado'] = r.idEmpleado
      form.value['email'] = r.email
    }
  }

  modoEdicion.value  = true
  registroEdit.value = r
  showForm.value  = true
}

function validarForm(): boolean {
  formErrors.value = {}
  
  // Validar rol seleccionado
  const rolSeleccionado = form.value['rol']
  if (!rolSeleccionado) {
    formErrors.value['rol'] = 'El rol es obligatorio'
  }
  
  // Validar que se seleccione el cliente o empleado según el rol
  if (rolSeleccionado === 'CLIENTE' && !form.value['idCliente']) {
    formErrors.value['idCliente'] = 'Debes seleccionar un cliente'
  }
  if (rolSeleccionado === 'EMPLEADO' && !form.value['idEmpleado']) {
    formErrors.value['idEmpleado'] = 'Debes seleccionar un empleado'
  }
  
  // Validar que el email esté presente (se hereda del cliente/empleado)
  if (!form.value['email']) {
    formErrors.value['email'] = 'El correo debe estar disponible (selecciona cliente/empleado)'
  }
  
  // Validar campos requeridos
  for (const c of camposForm.value) {
    if (c.soloCrear && modoEdicion.value) continue
    
    // Verificar visibilidad dinámica
    if (c.visibleSi && !c.visibleSi(form.value['rol'] || '')) continue
    
    // Skip email, rol, idCliente, idEmpleado, imagenUrl (ya validados o especiales)
    if (['email', 'rol', 'idCliente', 'idEmpleado', 'imagenUrl'].includes(c.key)) continue
    
    if (c.required && !form.value[c.key]) {
      formErrors.value[c.key] = `${c.label} es obligatorio`
    }
  }
  
  return Object.keys(formErrors.value).length === 0
}

async function guardar() {
  if (!validarForm()) return
  guardando.value = true

  // Construye payload limpio
  const payload: Record<string, any> = {}
  for (const c of camposForm.value) {
    if (c.soloCrear && modoEdicion.value) continue
    
    // En edición, omitir email y rol (son readonly)
    if (modoEdicion.value && ['email', 'rol'].includes(c.key)) continue
    
    // En creación, omitir rol (ya viene con el payload)
    if (!modoEdicion.value && c.key === 'rol') continue
    
    // Omitir imagenUrl si está vacía
    if (c.key === 'imagenUrl' && !form.value[c.key]) continue
    
    const val = form.value[c.key]
    if (val !== '' && val !== null && val !== undefined) {
      payload[c.key] = c.type === 'number' ? Number(val) : val
    }
  }

  try {
    if (modoEdicion.value) {
      await http.patch(`${config.value.endpoint}/${registroEdit.value.id}`, payload)
    } else {
      await http.post(config.value.endpoint, payload)
    }
    showForm.value = false
    await cargar()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    if (Array.isArray(msg)) alert(msg.join('\n'))
    else alert(msg || 'Error al guardar')
  } finally {
    guardando.value = false
  }
}

function confirmarEliminar(r: any) {
  registroDel.value = r
  showConfirm.value  = true
}

async function eliminar() {
  eliminando.value = true
  try {
    await http.delete(`${config.value.endpoint}/${registroDel.value.id}`)
    showConfirm.value = false
    await cargar()
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al eliminar')
  } finally {
    eliminando.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de renderizado
// ─────────────────────────────────────────────────────────────────────────────
function getCellValue(r: any, campo: string): string {
  if (campo === '_vinculado') {
    // Para usuarios, mostrar nombre según rol
    if (r.rol === 'CLIENTE' && r.cliente) {
      return r.cliente.nombre || '—'
    } else if (r.rol === 'EMPLEADO' && r.empleado) {
      return r.empleado.nombre || '—'
    }
    return '—'
  }
  const val = r[campo]
  if (val === null || val === undefined || val === '') return '—'
  return String(val)
}

function getInitial(r: any): string {
  const s = r.nombre || r.email || '?'
  return s.charAt(0).toUpperCase()
}

function getAvatarLabel(r: any, campo: string): string {
  // Para imagenUrl (Foto), no mostrar nada
  if (campo === 'imagenUrl') {
    return ''
  }
  // Para email, mostrar el email
  if (campo === 'email') {
    return r.email || '—'
  }
  // Para otros campos tipo avatar
  return r[campo] || '—'
}

function fmtFecha(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ROL_CFG: Record<string, { bg: string; color: string }> = {
  EMPLEADO: { bg: '#e3f2fd', color: '#1565c0' },
  CLIENTE:  { bg: '#fce4ec', color: '#c2185b' },
}

function getRolStyle(rol: string) {
  return ROL_CFG[rol] ?? { bg: '#f5f5f5', color: '#666' }
}

// Colores de avatar por inicial
const AVATAR_COLORS = [
  ['#fce4ec','#e91e8c'], ['#e8eaf6','#3949ab'], ['#e8f5e9','#2e7d32'],
  ['#fff3e0','#e65100'], ['#f3e5f5','#7b1fa2'], ['#e3f2fd','#1565c0'],
]

function avatarColor(r: any): { bg: string; color: string } {
  const code = (r.nombre || r.email || 'A').charCodeAt(0) % AVATAR_COLORS.length
  const [bg, color] = AVATAR_COLORS[code]
  return { bg, color }
}

// Nombre completo para mostrar en el confirm
function nombreRegistro(r: any): string {
  if (!r) return ''
  return r.nombre
    ? `${r.nombre}${r.apellidoPaterno ? ' ' + r.apellidoPaterno : ''}`
    : r.email || `#${r.id}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Búsqueda dinámica para usuarios (empleados/clientes)
// ─────────────────────────────────────────────────────────────────────────────
async function buscarEntidad(campo: string, termino: string) {
  if (!termino.trim() && termino !== '') return

  const endpoint = campo === 'idCliente' ? '/clientes' : '/empleados'

  if (!termino.trim()) {
    listaResultados.value[campo] = []
    return
  }

  cargandoLista.value[campo] = true
  try {
    const { data } = await http.get(endpoint)
    const terminoLower = termino.toLowerCase()
    
    // Obtener usuarios existentes para validar
    let usuariosExistentes: any[] = []
    try {
      const { data: usersData } = await http.get('/usuarios')
      usuariosExistentes = usersData || []
    } catch (e) {
      console.error('Error obteniendo usuarios:', e)
    }
    
    listaResultados.value[campo] = (data || []).filter((e: any) => {
      const cumpleTermino = e.nombre?.toLowerCase().includes(terminoLower) ||
        e.apellidoPaterno?.toLowerCase().includes(terminoLower) ||
        e.email?.toLowerCase().includes(terminoLower) ||
        e.cedulaIdentidad?.includes(termino)
      
      if (!cumpleTermino) return false
      
      // Si ya hay una selección, no mostrar esa misma entidad
      if (e.id === form.value[campo]) return false
      
      // Validar que no exista un usuario para este cliente/empleado
      const yaExiste = usuariosExistentes.some((u: any) => {
        if (campo === 'idCliente') {
          return u.idCliente === e.id && u.rol === 'CLIENTE'
        } else {
          return u.idEmpleado === e.id && u.rol === 'EMPLEADO'
        }
      })
      
      return !yaExiste
    }).slice(0, 10)
  } catch (e: any) {
    console.error('Error buscando entidad:', e)
    listaResultados.value[campo] = []
  } finally {
    cargandoLista.value[campo] = false
  }
}

function seleccionarEntidad(campo: string, entidad: any) {
  form.value[campo] = entidad.id
  seleccionados.value[campo] = entidad
  // Heredar email del cliente/empleado seleccionado
  form.value['email'] = entidad.email || ''
  listaResultados.value[campo] = []
  busquedaActiva.value[campo] = ''
}

function limpiarSeleccion(campo: string) {
  form.value[campo] = null
  seleccionados.value[campo] = null
  form.value['email'] = ''  // Limpiar email heredado
  busquedaActiva.value[campo] = ''
  listaResultados.value[campo] = []
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload de imagen para usuarios
// ─────────────────────────────────────────────────────────────────────────────
async function subirArchivo(file: File) {
  if (!file.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen no debe superar 5MB')
    return
  }
  subiendoImagen.value = true
  const fd = new FormData()
  fd.append('file', file)
  try {
    const { data } = await http.post('uploads', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url = data?.url || data?.imagenUrl || data?.fileUrl || data?.path
    if (url) {
      form.value['imagenUrl'] = url
    } else {
      alert('El backend no devolvió una URL de imagen.')
    }
  } catch (err: any) {
    alert(err?.response?.data?.message || 'No se pudo subir la imagen')
  } finally {
    subiendoImagen.value = false
    if (inputFileRef.value) inputFileRef.value.value = ''
  }
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) subirArchivo(file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) subirArchivo(file)
}

function quitarImagen() {
  form.value['imagenUrl'] = ''
  if (inputFileRef.value) inputFileRef.value.value = ''
}
</script>

<template>
  <div class="admin-wrap">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon"><i :class="config.icon"></i></div>
        <div>
          <h2 class="page-titulo">{{ config.titulo }}</h2>
          <p class="page-sub">{{ config.sub }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-recargar" @click="cargar" :disabled="cargando" title="Recargar">
          <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
        <button class="btn-crear" @click="abrirCrear">
          <i class="pi pi-plus"></i>
          Nuevo {{ config.singular }}
        </button>
      </div>
    </div>

    <!-- ── Barra de herramientas ───────────────────────────────────────────── -->
    <div class="toolbar">
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="busqueda"
          type="search"
          class="search-input"
          :placeholder="`Buscar ${config.titulo.toLowerCase()}...`"
          @input="paginaActual = 1"
        />
      </div>
      <div class="toolbar-right">
        <span class="total-badge">
          <i class="pi pi-database"></i>
          {{ filtrados.length }} {{ filtrados.length === 1 ? 'registro' : 'registros' }}
        </span>
      </div>
    </div>

    <!-- ── Tabla ───────────────────────────────────────────────────────────── -->
    <div class="tabla-card">

      <!-- Skeleton loading -->
      <template v-if="cargando">
        <div class="skeleton-rows">
          <div v-for="n in 6" :key="n" class="skeleton-row">
            <div class="sk-avatar"></div>
            <div class="sk-lines">
              <div class="sk-line sk-line-lg"></div>
              <div class="sk-line sk-line-sm"></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:52px">#</th>
                <th v-for="col in config.columnas" :key="col.campo">{{ col.label }}</th>
                <th style="width:100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in paginados" :key="r.id">

                <!-- Número de fila -->
                <td>
                  <span class="nro-badge">{{ (paginaActual - 1) * POR_PAGINA + idx + 1 }}</span>
                </td>

                <!-- Columnas dinámicas -->
                <td v-for="col in config.columnas" :key="col.campo">

                  <!-- Avatar + texto -->
                  <div v-if="col.tipo === 'avatar'" class="avatar-cell">
                    <!-- Si es imagenUrl y tiene URL, mostrar imagen -->
                    <div
                      v-if="col.campo === 'imagenUrl' && r[col.campo]"
                      class="avatar avatar-img"
                    >
                      <img :src="r[col.campo]" :alt="getAvatarLabel(r, col.campo)" />
                    </div>
                    <!-- Si no, mostrar avatar con inicial -->
                    <div
                      v-else
                      class="avatar"
                      :style="`background:${avatarColor(r).bg}; color:${avatarColor(r).color}`"
                    >{{ getInitial(r) }}</div>
                    <span class="avatar-label">{{ getAvatarLabel(r, col.campo) }}</span>
                  </div>

                  <!-- Badge de rol / cargo -->
                  <template v-else-if="col.tipo === 'badge'">
                    <span
                      v-if="col.campo === 'rol'"
                      class="rol-badge"
                      :style="`background:${getRolStyle(r.rol).bg}; color:${getRolStyle(r.rol).color}`"
                    >{{ r.rol }}</span>
                    <span v-else class="cargo-badge">{{ r[col.campo] || '—' }}</span>
                  </template>

                  <!-- Booleano activo -->
                  <span
                    v-else-if="col.tipo === 'bool'"
                    class="bool-badge"
                    :class="r[col.campo] ? 'activo' : 'inactivo'"
                  >
                    <i :class="r[col.campo] ? 'pi pi-check' : 'pi pi-times'"></i>
                    {{ r[col.campo] ? 'Activo' : 'Inactivo' }}
                  </span>

                  <!-- Fecha legible -->
                  <span v-else-if="col.tipo === 'fecha'" class="td-fecha">
                    {{ fmtFecha(r[col.campo]) }}
                  </span>

                  <!-- Monoespaciado (CI, celular) -->
                  <span v-else-if="col.tipo === 'mono'" class="td-mono">
                    {{ getCellValue(r, col.campo) }}
                  </span>

                  <!-- Texto normal -->
                  <span v-else class="td-text">{{ getCellValue(r, col.campo) }}</span>

                </td>

                <!-- Acciones -->
                <td>
                  <div class="acciones">
                    <button class="btn-accion editar" @click="abrirEditar(r)" title="Editar">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn-accion eliminar" @click="confirmarEliminar(r)" title="Eliminar">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Sin resultados -->
              <tr v-if="paginados.length === 0">
                <td :colspan="config.columnas.length + 2" class="td-vacio">
                  <div class="vacio-wrap">
                    <span class="vacio-emoji">{{ config.emoji }}</span>
                    <p>No se encontraron {{ config.titulo.toLowerCase() }}</p>
                    <button v-if="busqueda" class="btn-limpiar-busqueda" @click="busqueda = ''">
                      Limpiar búsqueda
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="totalPaginas > 1" class="paginacion">
          <button class="btn-pag" :disabled="paginaActual === 1" @click="cambiarPagina(paginaActual - 1)">
            <i class="pi pi-chevron-left"></i>
          </button>
          <template v-for="btn in pageButtons" :key="String(btn)">
            <span v-if="btn === '...'" class="pag-dots">…</span>
            <button
              v-else
              class="btn-num"
              :class="{ activo: btn === paginaActual }"
              @click="cambiarPagina(btn as number)"
            >{{ btn }}</button>
          </template>
          <button class="btn-pag" :disabled="paginaActual === totalPaginas" @click="cambiarPagina(paginaActual + 1)">
            <i class="pi pi-chevron-right"></i>
          </button>
          <span class="pag-info">{{ filtrados.length }} total</span>
        </div>
      </template>

    </div>

    <!-- ── Modal Crear / Editar ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
          <div class="modal-panel">

            <div class="modal-header">
              <div class="modal-header-info">
                <div class="modal-header-icon">
                  <i :class="modoEdicion ? 'pi pi-pencil' : 'pi pi-plus'"></i>
                </div>
                <div>
                  <h3 class="modal-titulo">
                    {{ modoEdicion ? `Editar ${config.singular}` : `Nuevo ${config.singular}` }}
                  </h3>
                  <p class="modal-subtitulo">
                    {{ modoEdicion ? `Actualizando #${registroEdit?.id}` : 'Completa los datos del formulario' }}
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="showForm = false">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <div class="modal-body">
              <div class="form-grid">
                <div
                  v-for="c in camposForm"
                  :key="c.key"
                  class="field"
                  :class="{
                    'field-hidden': c.soloCrear && modoEdicion,
                    'field-full':   c.type === 'text' && c.key === 'direccion',
                  }"
                  v-show="!c.visibleSi || c.visibleSi(form['rol'] || '')"
                >
                  <label class="field-label">
                    {{ c.label }}
                    <span v-if="c.required && !(c.soloCrear && modoEdicion) && c.key !== 'email'" class="req">*</span>
                  </label>

                  <!-- Select (rol, etc) -->
                  <select v-if="c.type === 'select'" v-model="form[c.key]" class="field-input" :disabled="modoEdicion">
                    <option value="" disabled>Selecciona...</option>
                    <option v-for="op in c.opciones" :key="op" :value="op">{{ op }}</option>
                  </select>

                  <!-- Search (buscar cliente/empleado) -->
                  <div v-else-if="c.type === 'search'" class="search-field">
                    <div class="search-input-wrap">
                      <input
                        v-model="busquedaActiva[c.key]"
                        type="text"
                        :placeholder="c.placeholder"
                        class="field-input"
                        :disabled="modoEdicion"
                        @input="(e) => buscarEntidad(c.key, (e.target as HTMLInputElement).value)"
                      />
                      <button
                        v-if="seleccionados[c.key]"
                        type="button"
                        class="btn-limpiar-seleccion"
                        :disabled="modoEdicion"
                        @click="limpiarSeleccion(c.key)"
                        title="Limpiar selección"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </div>

                    <!-- Seleccionado -->
                    <div v-if="seleccionados[c.key]" class="selected-item">
                      <span class="selected-label">
                        {{ seleccionados[c.key].nombre }}
                        <span v-if="seleccionados[c.key].apellidoPaterno" class="text-muted">
                          {{ seleccionados[c.key].apellidoPaterno }}
                        </span>
                      </span>
                      <span v-if="seleccionados[c.key].email" class="selected-email">
                        {{ seleccionados[c.key].email }}
                      </span>
                    </div>

                    <!-- Resultados de búsqueda -->
                    <div v-if="listaResultados[c.key]?.length && busquedaActiva[c.key]" class="search-results">
                      <div
                        v-for="item in listaResultados[c.key]"
                        :key="item.id"
                        class="result-item"
                        @click="seleccionarEntidad(c.key, item)"
                      >
                        <div class="result-main">
                          {{ item.nombre }}
                          <span v-if="item.apellidoPaterno" class="text-muted">{{ item.apellidoPaterno }}</span>
                        </div>
                        <div class="result-sub">
                          {{ item.email || item.cedulaIdentidad || `#${item.id}` }}
                        </div>
                      </div>
                    </div>

                    <!-- Cargando -->
                    <div v-if="cargandoLista[c.key]" class="search-loading">
                      <i class="pi pi-spin pi-spinner"></i> Buscando...
                    </div>

                    <!-- Sin resultados -->
                    <div v-if="busquedaActiva[c.key] && !cargandoLista[c.key] && !listaResultados[c.key]?.length" class="search-empty">
                      No se encontraron resultados
                    </div>
                  </div>

                  <!-- Email readonly (se hereda del cliente/empleado) -->
                  <input
                    v-if="c.key === 'email'"
                    v-model="form[c.key]"
                    type="email"
                    class="field-input"
                    :class="{ 'field-readonly': modoEdicion || (seleccionados['idCliente'] || seleccionados['idEmpleado']) }"
                    :readonly="modoEdicion || !!(seleccionados['idCliente'] || seleccionados['idEmpleado'])"
                    :placeholder="c.placeholder"
                  />

                  <!-- Upload imagen (solo para usuarios/imagenUrl y cuando hay relación seleccionada) -->
                  <div
                    v-else-if="c.key === 'imagenUrl' && props.tipo === 'usuarios' && (seleccionados['idCliente'] || seleccionados['idEmpleado'])"
                    class="image-upload-field"
                  >
                    <div
                      class="upload-zone"
                      :class="{ 'drag-over': dragOver, 'tiene-imagen': form[c.key] }"
                      @dragover.prevent="dragOver = true"
                      @dragleave.prevent="dragOver = false"
                      @drop.prevent="onDrop"
                    >
                      <!-- Preview con imagen cargada -->
                      <template v-if="form[c.key]">
                        <div class="img-preview">
                          <img :src="form[c.key]" :alt="'Preview usuario'" />
                          <div class="img-overlay-actions">
                            <label for="file-input-usuario-img" class="btn-cambiar-img">
                              <i :class="subiendoImagen ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i> 
                              {{ subiendoImagen ? 'Subiendo...' : 'Cambiar' }}
                            </label>
                            <button type="button" class="btn-quitar-img" @click="quitarImagen" :disabled="subiendoImagen">
                              <i class="pi pi-trash"></i> Quitar
                            </button>
                          </div>
                        </div>
                      </template>

                      <!-- Estado vacío -->
                      <template v-else>
                        <div class="upload-placeholder">
                          <div class="upload-icon-wrap">
                            <i v-if="!subiendoImagen" class="pi pi-image"></i>
                            <i v-else class="pi pi-spin pi-spinner"></i>
                          </div>
                          <p class="upload-titulo">
                            {{ subiendoImagen ? 'Subiendo imagen...' : 'Arrastra una imagen aquí' }}
                          </p>
                          <p class="upload-sub">o</p>
                          <label for="file-input-usuario-img" class="btn-upload" :class="{ disabled: subiendoImagen }">
                            <i class="pi pi-folder-open"></i>
                            Seleccionar archivo
                          </label>
                          <p class="upload-hint">JPG, PNG, WEBP · Máx. 5MB</p>
                        </div>
                      </template>

                      <input
                        id="file-input-usuario-img"
                        ref="inputFileRef"
                        type="file"
                        accept="image/*"
                        class="file-input-hidden"
                        :disabled="subiendoImagen"
                        @change="onFileChange"
                      />
                    </div>
                  </div>

                  <!-- Input normal (text, email, number, date, password, tel) -->
                  <input
                    v-else-if="!['idCliente', 'idEmpleado'].includes(c.key)"
                    v-model="form[c.key]"
                    :type="c.type"
                    :placeholder="c.placeholder"
                    class="field-input"
                    :class="{ 'field-error': formErrors[c.key] }"
                  />

                  <span v-if="formErrors[c.key]" class="error-msg">
                    <i class="pi pi-exclamation-circle"></i> {{ formErrors[c.key] }}
                  </span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancelar" @click="showForm = false" :disabled="guardando">
                Cancelar
              </button>
              <button class="btn-guardar" @click="guardar" :disabled="guardando">
                <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
                {{ guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear') }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal Confirmar eliminar ──────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm = false">
          <div class="modal-confirm">
            <div class="confirm-icono">🗑️</div>
            <h3>Eliminar {{ config.singular }}</h3>
            <p>
              ¿Confirmas eliminar a
              <strong>{{ nombreRegistro(registroDel) }}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div class="confirm-actions">
              <button class="btn-cancelar" @click="showConfirm = false" :disabled="eliminando">
                Cancelar
              </button>
              <button class="btn-eliminar" @click="eliminar" :disabled="eliminando">
                <i :class="eliminando ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></i>
                {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Base ───────────────────────────────────────────────────────────────────── */
.admin-wrap {
  padding: 1.75rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left { display: flex; align-items: center; gap: 1rem; }

.page-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.2rem; flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(233,30,140,0.3);
}

.page-titulo { font-size: 1.5rem; font-weight: 800; color: #880e4f; margin: 0 0 0.15rem; }
.page-sub    { font-size: 0.82rem; color: #f48fb1; margin: 0; }

.header-actions { display: flex; align-items: center; gap: 0.75rem; }

.btn-recargar {
  width: 38px; height: 38px;
  border-radius: 50%;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #c2185b;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}

.btn-recargar:hover:not(:disabled) { background: #fce4ec; border-color: #e91e8c; }
.btn-recargar:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-crear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.65rem 1.4rem;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233,30,140,0.3);
  transition: opacity 0.2s, transform 0.2s;
  white-space: nowrap;
}

.btn-crear:hover { opacity: 0.9; transform: translateY(-2px); }

/* ── Toolbar ────────────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-wrap { position: relative; flex: 1; max-width: 420px; }

.search-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.875rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.4rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  outline: none;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233,30,140,0.07);
}

.toolbar-right { display: flex; align-items: center; gap: 0.75rem; }

.total-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #f48fb1;
  font-weight: 600;
  white-space: nowrap;
}

/* ── Tabla card ─────────────────────────────────────────────────────────────── */
.tabla-card {
  background: white;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(233,30,140,0.08);
  overflow: hidden;
  border: 1px solid #fce4ec;
}

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
.skeleton-rows { display: flex; flex-direction: column; gap: 0; }

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fce4ec;
}

.sk-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  flex-shrink: 0;
}

.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }

.sk-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.sk-line-lg { width: 55%; }
.sk-line-sm { width: 35%; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Tabla ──────────────────────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; min-width: 580px; }

thead {
  background: linear-gradient(135deg, #e91e8c, #f06292);
}

th {
  padding: 0.9rem 1rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.875rem;
  vertical-align: middle;
}

tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #fff9fb; }

/* ── Celdas ─────────────────────────────────────────────────────────────────── */
.nro-badge {
  display: inline-block;
  min-width: 26px;
  text-align: center;
  font-weight: 700;
  color: #f48fb1;
  font-size: 0.78rem;
}

.avatar-cell { display: flex; align-items: center; gap: 0.65rem; }

.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800;
  font-size: 0.82rem;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #f8bbd0;
}

.avatar-img { padding: 0; background: #f5f5f5; }
.avatar-img img { width: 100%; height: 100%; object-fit: cover; }

.avatar-label { font-weight: 600; color: #333; font-size: 0.875rem; }

.rol-badge, .cargo-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.22rem 0.7rem;
  border-radius: 50px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.cargo-badge { background: #fce4ec; color: #c2185b; }

.bool-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.22rem 0.7rem;
  border-radius: 50px;
}

.bool-badge.activo   { background: #e8f5e9; color: #2e7d32; }
.bool-badge.inactivo { background: #fce4ec; color: #c62828; }

.td-fecha { font-size: 0.78rem; color: #aaa; white-space: nowrap; }
.td-mono  { font-family: monospace; font-size: 0.82rem; color: #555; letter-spacing: 0.3px; }
.td-text  { color: #555; }

/* ── Acciones ───────────────────────────────────────────────────────────────── */
.acciones { display: flex; gap: 0.4rem; }

.btn-accion {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.82rem;
  transition: background 0.2s, transform 0.15s;
}

.btn-accion:hover { transform: scale(1.1); }
.btn-accion.editar  { background: #e3f2fd; color: #1565c0; }
.btn-accion.editar:hover  { background: #bbdefb; }
.btn-accion.eliminar { background: #fce4ec; color: #c62828; }
.btn-accion.eliminar:hover { background: #f8bbd0; }

/* ── Vacío ──────────────────────────────────────────────────────────────────── */
.td-vacio { padding: 3rem 1rem !important; }
.vacio-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.vacio-emoji { font-size: 2.5rem; opacity: 0.3; }
.vacio-wrap p { color: #ccc; font-style: italic; font-size: 0.875rem; margin: 0; }

.btn-limpiar-busqueda {
  padding: 0.35rem 0.9rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.25rem;
}

.btn-limpiar-busqueda:hover { background: #f8bbd0; }

/* ── Paginación ─────────────────────────────────────────────────────────────── */
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  padding: 1rem;
  border-top: 1px solid #fce4ec;
  flex-wrap: wrap;
}

.pag-dots { color: #ccc; font-weight: 600; }

.btn-pag, .btn-num {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid #f8bbd0;
  background: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  color: #c2185b;
  transition: all 0.2s;
}

.btn-pag:hover:not(:disabled), .btn-num:hover { background: #fce4ec; border-color: #f48fb1; }
.btn-pag:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-num.activo { background: linear-gradient(135deg,#e91e8c,#f06292); color: white; border-color: #e91e8c; }
.pag-info { font-size: 0.75rem; color: #bbb; margin-left: 0.25rem; }

/* ── Modal overlay ──────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136,14,79,0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ── Panel form ─────────────────────────────────────────────────────────────── */
.modal-panel {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(136,14,79,0.22);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #fce4ec;
  background: linear-gradient(135deg, #fff0f7, #fff9fb);
}

.modal-header-info { display: flex; align-items: center; gap: 0.85rem; }

.modal-header-icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(233,30,140,0.25);
}

.modal-titulo    { font-size: 1rem; font-weight: 800; color: #880e4f; margin: 0 0 0.1rem; }
.modal-subtitulo { font-size: 0.75rem; color: #bbb; margin: 0; }

.modal-close {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: #fce4ec;
  color: #c2185b;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.modal-close:hover { background: #f8bbd0; }

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: #f48fb1 transparent;
}

/* Grid del formulario: 2 columnas por defecto */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field-hidden { display: none; }
.field-full   { grid-column: 1 / -1; }

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #880e4f;
  letter-spacing: 0.2px;
}

.req { color: #e91e8c; }

.field-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233,30,140,0.08);
  background: white;
}

.field-input.field-error { border-color: #ef5350; }

.field-input.field-readonly {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: #e0e0e0;
}

.field-input.field-readonly:focus {
  border-color: #e0e0e0;
  box-shadow: none;
  background: #f5f5f5;
}

.field-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: #e0e0e0;
}

.field-input:disabled:focus {
  border-color: #e0e0e0;
  box-shadow: none;
  background: #f5f5f5;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #ef5350;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #fce4ec;
  background: #fff9fb;
}

/* ── Modal confirm ──────────────────────────────────────────────────────────── */
.modal-confirm {
  background: white;
  border-radius: 22px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(136,14,79,0.22);
}

.confirm-icono { font-size: 2.5rem; margin-bottom: 0.75rem; }

.modal-confirm h3 { font-size: 1.1rem; font-weight: 800; color: #880e4f; margin: 0 0 0.65rem; }
.modal-confirm p  { color: #666; font-size: 0.875rem; line-height: 1.5; margin: 0 0 1.5rem; }

.confirm-actions { display: flex; justify-content: center; gap: 0.75rem; }

/* ── Botones comunes ────────────────────────────────────────────────────────── */
.btn-cancelar {
  padding: 0.6rem 1.4rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancelar:hover:not(:disabled) { background: #f5f5f5; }
.btn-cancelar:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-guardar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233,30,140,0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-guardar:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-guardar:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-eliminar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #ef5350, #e53935);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(229,57,53,0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-eliminar:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-eliminar:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Campos de búsqueda dinámica ───────────────────────────────────────────── */
.search-field { position: relative; }

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.btn-limpiar-seleccion {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #f48fb1;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem;
  transition: color 0.2s;
  z-index: 10;
}

.btn-limpiar-seleccion:hover { color: #e91e8c; }
.btn-limpiar-seleccion:disabled { color: #ddd; cursor: not-allowed; }

.selected-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.9rem;
  background: #f0f7ff;
  border: 1.5px solid #bbdefb;
  border-radius: 10px;
  margin-top: 0.4rem;
}

.selected-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1565c0;
}

.selected-email {
  font-size: 0.7rem;
  color: #90caf9;
}

.text-muted {
  color: #999;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1.5px solid #f8bbd0;
  border-top: none;
  border-radius: 0 0 10px 10px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(233,30,140,0.1);
}

.result-item {
  padding: 0.65rem 0.9rem;
  cursor: pointer;
  border-bottom: 1px solid #fce4ec;
  transition: background 0.15s;
}

.result-item:last-child { border-bottom: none; }

.result-item:hover {
  background: #fff9fb;
  padding-left: 1.1rem;
}

.result-main {
  font-size: 0.82rem;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.result-sub {
  font-size: 0.7rem;
  color: #aaa;
  margin-top: 0.15rem;
}

.search-loading {
  padding: 0.8rem 0.9rem;
  text-align: center;
  font-size: 0.75rem;
  color: #f48fb1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.search-empty {
  padding: 0.8rem 0.9rem;
  text-align: center;
  font-size: 0.75rem;
  color: #ccc;
  font-style: italic;
}

/* ── Upload de imagen ──────────────────────────────────────────────────────────── */
.image-upload-field { grid-column: 1 / -1; }

.file-input-hidden { display: none; }

.upload-zone {
  border: 2px dashed #f8bbd0;
  border-radius: 16px;
  background: #fff9fb;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.upload-zone.drag-over {
  border-color: #e91e8c;
  background: #fff0f7;
  box-shadow: 0 0 0 4px rgba(233, 30, 140, 0.08);
}

.upload-zone.tiene-imagen {
  border-style: solid;
  border-color: #f48fb1;
  background: white;
}

/* Placeholder vacío */
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 2.25rem 1.5rem;
  text-align: center;
}

.upload-icon-wrap {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: #fce4ec;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  color: #e91e8c;
  margin-bottom: 0.35rem;
}

.upload-titulo { font-weight: 700; color: #880e4f; font-size: 0.9rem; margin: 0; }
.upload-sub    { font-size: 0.75rem; color: #ccc; margin: 0; }
.upload-hint   { font-size: 0.7rem; color: #ccc; margin-top: 0.15rem; }

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  margin: 0.25rem 0;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.25);
  transition: opacity 0.2s;
  border: none;
}

.btn-upload:hover:not(.disabled) { opacity: 0.9; }
.btn-upload.disabled { opacity: 0.5; cursor: not-allowed; }

/* Preview */
.img-preview { position: relative; display: block; }

.img-preview img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.img-overlay-actions {
  position: absolute;
  inset: 0;
  background: rgba(136, 14, 79, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.img-preview:hover .img-overlay-actions { opacity: 1; }

.btn-cambiar-img,
.btn-quitar-img {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cambiar-img {
  background: white;
  color: #e91e8c;
}

.btn-quitar-img {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
}

.btn-cambiar-img:hover { background: #fce4ec; }
.btn-quitar-img:hover { background: rgba(255, 255, 255, 0.3); }
.btn-quitar-img:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Transición modal ───────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.22s ease; }
.modal-fade-enter-from,  .modal-fade-leave-to      { opacity: 0; }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .admin-wrap    { padding: 1rem; }
  .page-header   { flex-direction: column; align-items: flex-start; }
  .toolbar       { flex-direction: column; }
  .search-wrap   { max-width: 100%; }
  .form-grid     { grid-template-columns: 1fr; }
}
</style>
