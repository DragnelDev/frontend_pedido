<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type PedidoProducto = {
  id: number
  cantidad: number
  precioUnitario: number
  producto: { id: number; nombre: string; imagenUrl?: string; precio: number }
}

type Pago = {
  id: number
  metodo: string
  estado: string
  monto?: number
  comprobante?: string
  maskedCard?: string
  fechaPago?: string
}

type Pedido = {
  id: number
  total: number
  estado: 'pendiente' | 'entregado' | 'cancelado'
  metodoPago: string
  tipoEnvio: string
  direccionEnvio?: string
  referencia?: string
  latitud?: number | null
  longitud?: number | null
  fechaCreacion?: string
  fechaEntrega?: string
  usuario?: { id: number; email?: string; cliente?: { nombre: string } }
  detallePedido?: PedidoProducto[]
  pagos?: Pago[]
  _cargandoDetalle?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const router = useRouter()
const cargando = ref(true)
const pedidos = ref<Pedido[]>([])
const filtroEstado = ref<'todos' | 'pendiente' | 'entregado' | 'cancelado'>('todos')
const q = ref('')
const abierto = ref<number | null>(null)
const paginaActual = ref(1)
const POR_PAGINA = 10

// Modales
const modalImg = ref('')
const showModalImg = ref(false)
const modalMapaUrl = ref('')
const modalMapaLink = ref('')
const showModalMapa = ref(false)

type ConfirmPayload = {
  titulo: string
  mensaje: string
  tipo: 'advertencia' | 'peligro'
  accion: () => Promise<void>
}
const confirm = ref<ConfirmPayload | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Montaje y carga
// ─────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const token = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null
  if (!token || payload?.rol !== 'EMPLEADO') {
    alert('Acceso restringido.')
    router.replace('/')
    return
  }
  await cargarPedidos()
})

// Carga optimizada: primero la lista, luego detalle solo al expandir
async function cargarPedidos() {
  cargando.value = true
  try {
    const { data } = await http.get<Pedido[]>('/pedidos')
    pedidos.value = data.map((p) => ({ ...p, detallePedido: undefined, _cargandoDetalle: false }))
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al cargar pedidos')
  } finally {
    cargando.value = false
  }
}

// Carga lazy del detalle al expandir una fila
async function toggleDetalle(id: number) {
  if (abierto.value === id) {
    abierto.value = null
    return
  }

  const pedido = pedidos.value.find((p) => p.id === id)
  if (!pedido) {
    console.error('Pedido no encontrado:', id)
    return
  }

  abierto.value = id

  // Si ya tiene detalle cargado, no hace nada más
  if (Array.isArray(pedido.detallePedido) && pedido.detallePedido.length > 0) {
    console.log('Detalle ya cargado para pedido:', id)
    return
  }

  pedido._cargandoDetalle = true
  console.log('Cargando detalle para pedido:', id)
  try {
    const { data } = await http.get(`/pedidos/${id}`)
    console.log('Respuesta del servidor:', data)

    pedido.detallePedido = (data.detallePedido || data.pedidosProductos || []).map((d: any) => ({
      id: d.id,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      producto: d.producto,
    }))
    pedido.pagos = data.pagos || []
    pedido.direccionEnvio = data.direccionEnvio || data.direccion_envio || ''
    pedido.referencia = data.referencia || ''
    pedido.latitud = data.latitud ?? null
    pedido.longitud = data.longitud ?? null
    pedido.fechaEntrega = data.fechaEntrega || data.fecha_entrega || ''
    pedido.fechaCreacion = data.fechaCreacion || data.fecha_creacion || pedido.fechaCreacion || ''
    if (data.usuario) pedido.usuario = data.usuario

    console.log('Detalle cargado exitosamente para pedido:', id)
  } catch (error: any) {
    console.error('Error al cargar detalle del pedido:', error?.response?.data || error.message)
    alert(
      `Error: ${error?.response?.data?.message || error.message || 'No se pudo cargar el detalle'}`,
    )
    pedido.detallePedido = []
    pedido.pagos = []
    abierto.value = null
  } finally {
    pedido._cargandoDetalle = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Acciones de estado
// ─────────────────────────────────────────────────────────────────────────────
function pedirCambioEstadoPedido(pedido: Pedido, nuevoEstado: string) {
  const esRiesgoso = nuevoEstado === 'cancelado'
  confirm.value = {
    titulo: `Cambiar estado del pedido`,
    mensaje: `¿Confirmas cambiar el pedido #${String(pedido.id).padStart(5, '0')} a "${nuevoEstado}"?`,
    tipo: esRiesgoso ? 'peligro' : 'advertencia',
    accion: async () => {
      await http.patch(`/pedidos/${pedido.id}/estado`, { estado: nuevoEstado })
      pedido.estado = nuevoEstado as any
    },
  }
}

function pedirCambioEstadoPago(pedido: Pedido, nuevoEstado: string) {
  if (!pedido.pagos?.[0]) return alert('Este pedido no tiene registro de pago.')
  const pago = pedido.pagos[0]
  confirm.value = {
    titulo: `Cambiar estado del pago`,
    mensaje: `¿Confirmas cambiar el pago del pedido #${String(pedido.id).padStart(5, '0')} a "${nuevoEstado.replace('_', ' ')}"?`,
    tipo: nuevoEstado === 'rechazado' ? 'peligro' : 'advertencia',
    accion: async () => {
      await http.patch(`/pagos/${pago.id}`, { estado: nuevoEstado })
      pago.estado = nuevoEstado
      if (nuevoEstado === 'rechazado') {
        await http.patch(`/pedidos/${pedido.id}/estado`, { estado: 'cancelado' })
        pedido.estado = 'cancelado'
      }
    },
  }
}

async function ejecutarConfirm() {
  const payload = confirm.value
  confirm.value = null
  if (!payload) return
  try {
    await payload.accion()
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al actualizar')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const total = pedidos.value.length
  const pendientes = pedidos.value.filter((p) => p.estado === 'pendiente').length
  const entregados = pedidos.value.filter((p) => p.estado === 'entregado').length
  const cancelados = pedidos.value.filter((p) => p.estado === 'cancelado').length
  const ingresos = pedidos.value
    .filter((p) => p.estado === 'entregado')
    .reduce((s, p) => s + Number(p.total), 0)
  return { total, pendientes, entregados, cancelados, ingresos }
})

// ─────────────────────────────────────────────────────────────────────────────
// Filtrado y paginación
// ─────────────────────────────────────────────────────────────────────────────
const filtrados = computed(() => {
  let arr = [...pedidos.value]
  if (filtroEstado.value !== 'todos') arr = arr.filter((p) => p.estado === filtroEstado.value)
  const s = q.value.trim().toLowerCase()
  if (s)
    arr = arr.filter(
      (p) =>
        String(p.id).includes(s) ||
        (p.usuario?.cliente?.nombre || '').toLowerCase().includes(s) ||
        (p.usuario?.email || '').toLowerCase().includes(s),
    )
  return arr.sort((a, b) => b.id - a.id)
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / POR_PAGINA)))
const paginados = computed(() => {
  const i = (paginaActual.value - 1) * POR_PAGINA
  return filtrados.value.slice(i, i + POR_PAGINA)
})

function cambiarPagina(p: number) {
  if (p >= 1 && p <= totalPaginas.value) {
    paginaActual.value = p
    abierto.value = null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers visuales
// ─────────────────────────────────────────────────────────────────────────────
function estadoPago(p: Pedido) {
  return p.pagos?.[0]?.estado || 'sin_pago'
}

function fmtFecha(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtBs(n?: number) {
  return (Number(n) || 0).toFixed(2)
}

function fmtCoord(v?: number | null | string) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(5) : '—'
}

function mapaUrl(lat: number | string | undefined | null, lng: number | string | undefined | null) {
  const a = Number(lat)
  const b = Number(lng)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return '#'
  return `https://www.openstreetmap.org/?mlat=${a}&mlon=${b}#map=16/${a}/${b}`
}

function mapaEmbedUrl(
  lat: number | string | undefined | null,
  lng: number | string | undefined | null,
) {
  const a = Number(lat)
  const b = Number(lng)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return ''
  const delta = 0.01
  const left = b - delta
  const right = b + delta
  const top = a + delta
  const bottom = a - delta
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${a},${b}`
}

function mapaStaticUrl(
  lat: number | string | undefined | null,
  lng: number | string | undefined | null,
) {
  // Usa una imagen estática de OpenStreetMap via staticmap (gratuito)
  const a = Number(lat)
  const b = Number(lng)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return ''
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${a},${b}&zoom=15&size=420x200&markers=${a},${b},red`
}

const tipoEnvioLabel: Record<string, string> = {
  domicilio: '🚚 Domicilio',
  delivery: '🚚 Delivery',
  express: '⚡ Express',
  local: '🏪 Retiro local',
  retiro_tienda: '🏪 Retiro tienda',
}

const ESTADOS_PEDIDO = ['pendiente', 'entregado', 'cancelado']
const ESTADOS_PAGO = ['pendiente', 'en_revision', 'aprobado', 'rechazado']

// Páginas a mostrar en paginación
const pageButtons = computed(() => {
  const total = totalPaginas.value
  const cur = paginaActual.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})
</script>

<template>
  <section class="admin-wrap">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon"><i class="pi pi-shopping-bag"></i></div>
        <div>
          <h2 class="page-titulo">Pedidos</h2>
          <p class="page-sub">Gestiona y actualiza el estado de todos los pedidos</p>
        </div>
      </div>
      <button class="btn-recargar" @click="cargarPedidos" :disabled="cargando">
        <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        Actualizar
      </button>
    </div>

    <!-- ── KPIs ────────────────────────────────────────────────────────────── -->
    <div class="kpis-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #fce4ec; color: #e91e8c">
          <i class="pi pi-list"></i>
        </div>
        <div>
          <p class="kpi-valor">{{ kpis.total }}</p>
          <p class="kpi-label">Total pedidos</p>
        </div>
      </div>
      <div
        class="kpi-card kpi-clickable"
        @click="((filtroEstado = 'pendiente'), (paginaActual = 1))"
      >
        <div class="kpi-icon" style="background: #fff3e0; color: #e65100">
          <i class="pi pi-clock"></i>
        </div>
        <div>
          <p class="kpi-valor" style="color: #e65100">{{ kpis.pendientes }}</p>
          <p class="kpi-label">Pendientes</p>
        </div>
      </div>
      <div
        class="kpi-card kpi-clickable"
        @click="((filtroEstado = 'entregado'), (paginaActual = 1))"
      >
        <div class="kpi-icon" style="background: #e8f5e9; color: #2e7d32">
          <i class="pi pi-check-circle"></i>
        </div>
        <div>
          <p class="kpi-valor" style="color: #2e7d32">{{ kpis.entregados }}</p>
          <p class="kpi-label">Entregados</p>
        </div>
      </div>
      <div
        class="kpi-card kpi-clickable"
        @click="((filtroEstado = 'cancelado'), (paginaActual = 1))"
      >
        <div class="kpi-icon" style="background: #fce4ec; color: #c62828">
          <i class="pi pi-times-circle"></i>
        </div>
        <div>
          <p class="kpi-valor" style="color: #c62828">{{ kpis.cancelados }}</p>
          <p class="kpi-label">Cancelados</p>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #f3e5f5; color: #7b1fa2">
          <i class="pi pi-wallet"></i>
        </div>
        <div>
          <p class="kpi-valor" style="color: #7b1fa2">Bs. {{ fmtBs(kpis.ingresos) }}</p>
          <p class="kpi-label">Ingresos entregados</p>
        </div>
      </div>
    </div>

    <!-- ── Filtros ─────────────────────────────────────────────────────────── -->
    <div class="filtros-bar">
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="q"
          type="search"
          placeholder="Buscar por ID, cliente, email..."
          @input="paginaActual = 1"
        />
      </div>
      <div class="filtro-tabs">
        <button
          v-for="e in ['todos', 'pendiente', 'entregado', 'cancelado']"
          :key="e"
          class="tab-btn"
          :class="{ activo: filtroEstado === e }"
          @click="
            () => {
              filtroEstado = e as 'todos' | 'pendiente' | 'entregado' | 'cancelado'
              paginaActual = 1
            }
          "
        >
          {{ e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1) }}
          <span class="tab-count">
            {{ e === 'todos' ? pedidos.length : pedidos.filter((p) => p.estado === e).length }}
          </span>
        </button>
      </div>
    </div>

    <!-- ── Tabla ───────────────────────────────────────────────────────────── -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th>Cliente</th>
              <th style="width: 120px">Total</th>
              <th style="width: 110px">Método</th>
              <th style="width: 130px">Tipo envío</th>
              <th style="width: 155px">Estado pago</th>
              <th style="width: 155px">Estado pedido</th>
              <th style="width: 140px">Fecha</th>
              <th style="width: 90px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="cargando">
              <tr v-for="n in 5" :key="n" class="row-skeleton">
                <td colspan="9"><div class="skeleton-line"></div></td>
              </tr>
            </template>

            <template v-else>
              <template v-for="p in paginados" :key="p.id">
                <!-- Fila principal -->
                <tr :class="{ 'row-abierta': abierto === p.id }">
                  <td>
                    <span class="id-badge">#{{ String(p.id).padStart(5, '0') }}</span>
                  </td>
                  <td>
                    <p class="td-nombre">{{ p.usuario?.cliente?.nombre || 'Sin cliente' }}</p>
                    <small class="td-email">{{ p.usuario?.email || '—' }}</small>
                  </td>
                  <td>
                    <span class="monto">Bs. {{ fmtBs(p.total) }}</span>
                  </td>
                  <td>
                    <span class="metodo-badge">
                      {{
                        p.metodoPago === 'efectivo'
                          ? '💵'
                          : p.metodoPago === 'qr'
                            ? '📱'
                            : p.metodoPago === 'transferencia'
                              ? '🏦'
                              : '💳'
                      }}
                      {{ p.metodoPago }}
                    </span>
                  </td>
                  <td>
                    <span class="tipo-envio-badge">
                      {{ tipoEnvioLabel[p.tipoEnvio] || '📦 ' + (p.tipoEnvio || '—') }}
                    </span>
                  </td>
                  <td>
                    <select
                      v-if="p.pagos !== undefined"
                      class="estado-select"
                      :class="estadoPago(p)"
                      :value="estadoPago(p)"
                      @change="pedirCambioEstadoPago(p, ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="s in ESTADOS_PAGO" :key="s" :value="s">
                        {{ s.replace('_', ' ') }}
                      </option>
                    </select>
                    <span v-else class="estado-badge sin_pago">sin pago</span>
                  </td>
                  <td>
                    <select
                      class="estado-select"
                      :class="p.estado"
                      :value="p.estado"
                      @change="
                        pedirCambioEstadoPedido(p, ($event.target as HTMLSelectElement).value)
                      "
                    >
                      <option v-for="s in ESTADOS_PEDIDO" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </td>
                  <td class="td-fecha">{{ fmtFecha(p.fechaCreacion) }}</td>
                  <td>
                    <button class="btn-toggle" @click="toggleDetalle(p.id)">
                      <i :class="abierto === p.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                      {{ abierto === p.id ? 'Cerrar' : 'Ver' }}
                    </button>
                  </td>
                </tr>

                <!-- Fila de detalle expandible -->
                <tr v-if="abierto === p.id" class="fila-detalle">
                  <td colspan="9">
                    <!-- Cargando detalle -->
                    <div v-if="p._cargandoDetalle" class="detalle-cargando">
                      <i class="pi pi-spin pi-spinner"></i> Cargando detalle...
                    </div>

                    <div v-else class="detalle-content">
                      <!-- Productos -->
                      <div class="detalle-box">
                        <h4 class="box-titulo"><i class="pi pi-box"></i> Productos</h4>
                        <div v-if="!p.detallePedido?.length" class="empty-box">Sin productos</div>
                        <div v-for="d in p.detallePedido" :key="d.id" class="prod-row">
                          <div class="prod-img-wrap">
                            <img
                              v-if="d.producto?.imagenUrl"
                              :src="d.producto.imagenUrl"
                              :alt="d.producto?.nombre"
                            />
                            <div v-else class="prod-img-placeholder">
                              <i class="pi pi-image"></i>
                            </div>
                            <span class="prod-qty-badge">{{ d.cantidad }}</span>
                          </div>
                          <div class="prod-info">
                            <p class="prod-nombre">{{ d.producto?.nombre || '—' }}</p>
                            <p class="prod-precio-unit">Bs. {{ fmtBs(d.precioUnitario) }} c/u</p>
                          </div>
                          <span class="prod-subtotal"
                            >Bs. {{ fmtBs(d.cantidad * d.precioUnitario) }}</span
                          >
                        </div>
                        <!-- Mini total -->
                        <div class="prod-total-row">
                          <span>Total</span>
                          <strong class="monto">Bs. {{ fmtBs(p.total) }}</strong>
                        </div>
                      </div>

                      <!-- Pago -->
                      <div class="detalle-box">
                        <h4 class="box-titulo"><i class="pi pi-credit-card"></i> Pago</h4>
                        <div v-if="!p.pagos?.length" class="empty-box">Sin registro de pago</div>
                        <div v-for="pg in p.pagos" :key="pg.id" class="info-lista">
                          <div class="info-fila">
                            <span>Método</span>
                            <span class="metodo-badge small">{{ pg.metodo }}</span>
                          </div>
                          <div class="info-fila">
                            <span>Monto</span>
                            <strong class="monto">Bs. {{ fmtBs(pg.monto ?? p.total) }}</strong>
                          </div>
                          <div class="info-fila">
                            <span>Estado</span>
                            <span class="estado-badge" :class="pg.estado">{{
                              pg.estado.replace('_', ' ')
                            }}</span>
                          </div>
                          <div v-if="pg.maskedCard" class="info-fila">
                            <span>Tarjeta</span><span>{{ pg.maskedCard }}</span>
                          </div>
                          <div v-if="pg.fechaPago" class="info-fila">
                            <span>Fecha pago</span><small>{{ fmtFecha(pg.fechaPago) }}</small>
                          </div>
                          <div v-if="pg.comprobante" class="info-fila">
                            <span>Comprobante</span>
                            <button
                              class="btn-comprobante"
                              @click="((modalImg = pg.comprobante!), (showModalImg = true))"
                            >
                              <i class="pi pi-image"></i> Ver imagen
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Envío + Mapa -->
                      <div class="detalle-box">
                        <h4 class="box-titulo"><i class="pi pi-truck"></i> Entrega</h4>
                        <div class="info-lista">
                          <div class="info-fila">
                            <span>Tipo</span>
                            <span class="tipo-envio-badge small">
                              {{ tipoEnvioLabel[p.tipoEnvio] || p.tipoEnvio || '—' }}
                            </span>
                          </div>
                          <div v-if="p.fechaEntrega" class="info-fila">
                            <span>Fecha entrega</span>
                            <small>{{ fmtFecha(p.fechaEntrega) }}</small>
                          </div>
                          <div v-if="p.direccionEnvio" class="info-fila">
                            <span>Dirección</span>
                            <span class="dir-text">{{ p.direccionEnvio }}</span>
                          </div>
                          <div v-if="p.referencia" class="info-fila">
                            <span>Referencia</span>
                            <span>{{ p.referencia }}</span>
                          </div>
                          <div v-if="!p.tipoEnvio && !p.direccionEnvio" class="empty-box">
                            Sin datos de envío
                          </div>
                        </div>

                        <!-- Mapa estático si hay coordenadas -->
                        <div
                          v-if="p.latitud != null && p.longitud != null"
                          class="mapa-preview-wrap"
                        >
                          <div class="mapa-label">
                            <i class="pi pi-map-marker"></i> Ubicación del cliente
                          </div>
                          <div class="mapa-coords">
                            {{ fmtCoord(p.latitud) }}, {{ fmtCoord(p.longitud) }}
                          </div>
                          <button
                            v-if="mapaEmbedUrl(p.latitud, p.longitud)"
                            class="btn-ver-mapa"
                            @click="
                              () => {
                                modalMapaUrl = mapaEmbedUrl(p.latitud, p.longitud)
                                modalMapaLink = mapaUrl(p.latitud, p.longitud)
                                showModalMapa = true
                              }
                            "
                          >
                            <i class="pi pi-map"></i> Ver mapa
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Sin resultados -->
              <tr v-if="!paginados.length">
                <td colspan="9" class="td-vacio">
                  <div class="vacio-wrap">
                    <span class="vacio-icon">🛒</span>
                    <p>
                      No hay pedidos
                      {{ filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : '' }}
                    </p>
                    <button
                      v-if="filtroEstado !== 'todos'"
                      class="btn-reset-filtro"
                      @click="filtroEstado = 'todos'"
                    >
                      Ver todos los pedidos
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="paginacion">
        <button
          class="btn-pag"
          :disabled="paginaActual === 1"
          @click="cambiarPagina(paginaActual - 1)"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        <template v-for="btn in pageButtons" :key="String(btn)">
          <span v-if="btn === '...'" class="pag-dots">…</span>
          <button
            v-else
            class="btn-num"
            :class="{ activo: btn === paginaActual }"
            @click="cambiarPagina(btn as number)"
          >
            {{ btn }}
          </button>
        </template>
        <button
          class="btn-pag"
          :disabled="paginaActual === totalPaginas"
          @click="cambiarPagina(paginaActual + 1)"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
        <span class="pag-info">{{ filtrados.length }} pedidos</span>
      </div>
    </div>

    <!-- ── Modal de confirmación ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="confirm" class="modal-overlay" @click.self="confirm = null">
          <div class="modal-confirm">
            <div class="confirm-icon" :class="confirm.tipo">
              {{ confirm.tipo === 'peligro' ? '🚨' : '⚠️' }}
            </div>
            <h3>{{ confirm.titulo }}</h3>
            <p>{{ confirm.mensaje }}</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirm = null">Cancelar</button>
              <button class="btn-confirm" :class="confirm.tipo" @click="ejecutarConfirm">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal comprobante ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModalImg" class="modal-overlay" @click.self="showModalImg = false">
          <div class="modal-img-wrap">
            <button class="btn-close" @click="showModalImg = false">
              <i class="pi pi-times"></i>
            </button>
            <p class="modal-img-titulo">Comprobante de pago</p>
            <img :src="modalImg" alt="Comprobante" class="modal-img" />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal mapa ───────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModalMapa" class="modal-overlay" @click.self="showModalMapa = false">
          <div class="modal-img-wrap modal-mapa-wrap">
            <button class="btn-close" @click="showModalMapa = false">
              <i class="pi pi-times"></i>
            </button>
            <p class="modal-img-titulo">Ubicación en mapa</p>
            <iframe
              v-if="modalMapaUrl"
              :src="modalMapaUrl"
              class="modal-mapa-iframe"
              frameborder="0"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <div class="modal-mapa-actions">
              <a :href="modalMapaLink" target="_blank" class="btn-ver-mapa"
                >Abrir en OpenStreetMap</a
              >
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
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

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
}

.page-titulo {
  font-size: 1.5rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.15rem;
}
.page-sub {
  font-size: 0.82rem;
  color: #f48fb1;
  margin: 0;
}

.btn-recargar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  background: white;
  color: #c2185b;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-recargar:hover:not(:disabled) {
  background: #fce4ec;
  border-color: #e91e8c;
}
.btn-recargar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── KPIs ───────────────────────────────────────────────────────────────────── */
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: white;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  border: 1px solid #fce4ec;
  box-shadow: 0 2px 10px rgba(233, 30, 140, 0.06);
}

.kpi-card.kpi-clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.kpi-card.kpi-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.12);
  border-color: #f48fb1;
}

.kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.kpi-valor {
  font-size: 1.4rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.1rem;
}
.kpi-label {
  font-size: 0.72rem;
  color: #aaa;
  font-weight: 500;
  margin: 0;
}

/* ── Filtros ────────────────────────────────────────────────────────────────── */
.filtros-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.85rem;
  pointer-events: none;
}

.search-wrap input {
  padding: 0.6rem 1rem 0.6rem 2.25rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  width: 260px;
  outline: none;
  background: white;
  transition: border-color 0.2s;
}

.search-wrap input:focus {
  border-color: #e91e8c;
}

.filtro-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #aaa;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #f48fb1;
  color: #c2185b;
}
.tab-btn.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-color: #e91e8c;
}

.tab-count {
  background: rgba(255, 255, 255, 0.3);
  color: inherit;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 50px;
}

.tab-btn:not(.activo) .tab-count {
  background: #fce4ec;
  color: #e91e8c;
}

/* ── Card / Tabla ───────────────────────────────────────────────────────────── */
.card {
  background: white;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
  overflow: hidden;
  border: 1px solid #fce4ec;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

th {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 600;
  font-size: 0.78rem;
  padding: 0.9rem 1rem;
  text-align: left;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.875rem;
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}
tr:not(.fila-detalle):hover td {
  background: #fff9fb;
}
tr.row-abierta td {
  background: #fff0f5;
  border-bottom-color: transparent;
}

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
.row-skeleton td {
  padding: 0.65rem 1rem;
}
.skeleton-line {
  height: 20px;
  border-radius: 6px;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ── Badges y celdas ────────────────────────────────────────────────────────── */
.id-badge {
  background: #fce4ec;
  color: #c2185b;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
  white-space: nowrap;
}

.td-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.875rem;
  margin: 0 0 0.15rem;
}
.td-email {
  color: #bbb;
  font-size: 0.75rem;
}
.td-fecha {
  font-size: 0.75rem;
  color: #aaa;
  white-space: nowrap;
}

.monto {
  font-weight: 800;
  color: #e91e8c;
}

.metodo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
  text-transform: capitalize;
  white-space: nowrap;
}

.metodo-badge.small {
  font-size: 0.72rem;
}

.tipo-envio-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}

.tipo-envio-badge.small {
  font-size: 0.72rem;
}

/* ── Select de estado ───────────────────────────────────────────────────────── */
.estado-select {
  padding: 0.3rem 0.6rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1.5px solid transparent;
  cursor: pointer;
  text-transform: capitalize;
  outline: none;
  transition: all 0.2s;
  -webkit-appearance: none;
  appearance: none;
  padding-right: 1.5rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
}

.estado-select.pendiente,
.estado-badge.pendiente {
  background: #fff3e0;
  color: #e65100;
  border-color: #ffe0b2;
}
.estado-select.en_revision,
.estado-badge.en_revision {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #bbdefb;
}
.estado-select.aprobado,
.estado-badge.aprobado {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #c8e6c9;
}
.estado-select.entregado,
.estado-badge.entregado {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #c8e6c9;
}
.estado-select.rechazado,
.estado-badge.rechazado,
.estado-select.cancelado,
.estado-badge.cancelado {
  background: #fce4ec;
  color: #c62828;
  border-color: #f8bbd0;
}
.estado-badge.sin_pago {
  background: #f5f5f5;
  color: #9e9e9e;
}

.estado-badge {
  display: inline-block;
  padding: 0.28rem 0.65rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
}

/* ── Botón toggle ───────────────────────────────────────────────────────────── */
.btn-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.85rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-toggle:hover {
  background: #f8bbd0;
}

/* ── Detalle expandible ─────────────────────────────────────────────────────── */
.fila-detalle > td {
  padding: 0;
  background: #fff9fb;
  border-bottom: 2px solid #f8bbd0;
}

.detalle-cargando {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 2rem;
  color: #f48fb1;
  font-size: 0.875rem;
}

.detalle-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.detalle-box {
  background: white;
  padding: 1.25rem;
  border-radius: 14px;
  border: 1px solid #fce4ec;
  box-shadow: 0 2px 10px rgba(233, 30, 140, 0.05);
}

.box-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: #c2185b;
  font-weight: 700;
  padding-bottom: 0.65rem;
  border-bottom: 1.5px solid #fce4ec;
}

.empty-box {
  text-align: center;
  color: #ccc;
  font-style: italic;
  font-size: 0.8rem;
  padding: 1rem;
}

/* Productos en detalle */
.prod-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  background: #fff9fb;
  border-radius: 10px;
  margin-bottom: 0.5rem;
  border: 1px solid #fce4ec;
}

.prod-img-wrap {
  position: relative;
  flex-shrink: 0;
}

.prod-img-wrap img,
.prod-img-placeholder {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #fce4ec;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fce4ec;
  color: #f48fb1;
  font-size: 1rem;
}

.prod-qty-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid white;
}

.prod-info {
  flex: 1;
  min-width: 0;
}
.prod-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.82rem;
  margin: 0 0 0.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.prod-precio-unit {
  font-size: 0.7rem;
  color: #bbb;
  margin: 0;
}

.prod-subtotal {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.82rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.prod-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1.5px solid #fce4ec;
  padding-top: 0.65rem;
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: #aaa;
  font-weight: 600;
}

/* Info lista (pago / envío) */
.info-lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.info-fila {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #fce4ec;
}

.info-fila:last-child {
  border-bottom: none;
}
.info-fila > span:first-child {
  color: #bbb;
  font-weight: 500;
}

.dir-text {
  font-size: 0.8rem;
  color: #555;
  text-align: right;
  max-width: 200px;
}

.btn-comprobante {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  background: #e3f2fd;
  color: #1565c0;
  border: none;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-comprobante:hover {
  background: #bbdefb;
}

/* Mapa preview */
.mapa-preview-wrap {
  margin-top: 1rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #fce4ec;
  background: #f9f9f9;
  padding: 0.75rem;
}

.mapa-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #c2185b;
  margin-bottom: 0.35rem;
}

.mapa-coords {
  font-size: 0.72rem;
  color: #aaa;
  font-family: monospace;
  margin-bottom: 0.5rem;
}

.btn-ver-mapa {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1565c0;
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  background: #e3f2fd;
  border-radius: 50px;
  transition: background 0.2s;
}

.btn-ver-mapa:hover {
  background: #bbdefb;
}

/* ── Estado vacío ───────────────────────────────────────────────────────────── */
.td-vacio {
  padding: 3rem 1rem !important;
}

.vacio-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.vacio-icon {
  font-size: 2.5rem;
  opacity: 0.35;
}
.vacio-wrap p {
  color: #bbb;
  font-size: 0.875rem;
  margin: 0;
}

.btn-reset-filtro {
  padding: 0.45rem 1.1rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: background 0.2s;
}

.btn-reset-filtro:hover {
  background: #f8bbd0;
}

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

.pag-dots {
  color: #ccc;
  font-weight: 600;
  padding: 0 0.2rem;
}

.btn-pag,
.btn-num {
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

.btn-pag:hover:not(:disabled),
.btn-num:hover {
  background: #fce4ec;
  border-color: #f48fb1;
}
.btn-pag:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.btn-num.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-color: #e91e8c;
}

.pag-info {
  font-size: 0.75rem;
  color: #bbb;
  margin-left: 0.5rem;
}

/* ── Modales ────────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal-confirm {
  background: white;
  padding: 2rem;
  border-radius: 22px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(233, 30, 140, 0.25);
  text-align: center;
}

.confirm-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}
.modal-confirm h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.6rem;
}
.modal-confirm p {
  color: #666;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1.5rem;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn-cancel {
  padding: 0.65rem 1.4rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-confirm {
  padding: 0.65rem 1.4rem;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-confirm.advertencia {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
}

.btn-confirm.peligro {
  background: linear-gradient(135deg, #c62828, #e53935);
  color: white;
  box-shadow: 0 4px 14px rgba(198, 40, 40, 0.3);
}

.btn-confirm:hover {
  opacity: 0.88;
}

.modal-img-wrap {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  max-width: 680px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.btn-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 34px;
  height: 34px;
  border: none;
  background: #fce4ec;
  color: #c2185b;
  border-radius: 50%;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f8bbd0;
}

.modal-img-titulo {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.9rem;
  margin: 0 0 1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1.5px solid #fce4ec;
}

.modal-img {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  display: block;
}

.modal-mapa-wrap {
  max-width: 900px;
}

.modal-mapa-iframe {
  width: 100%;
  min-height: 70vh;
  border: 0;
  border-radius: 12px;
}

.modal-mapa-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

/* ── Transición modal ───────────────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .kpis-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-wrap {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .filtros-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-wrap input {
    width: 100%;
  }
  .kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .detalle-content {
    grid-template-columns: 1fr;
  }
}
</style>
