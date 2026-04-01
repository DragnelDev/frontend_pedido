<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

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
  comprobante?: string
  fechaPago?: string
}

type Pedido = {
  id: number
  total: number
  estado: 'pendiente' | 'entregado' | 'cancelado'
  metodoPago: string
  tipoEnvio: string
  direccion?: string
  referencia?: string
  departamento?: string
  pais?: string
  usuario?: { cliente: { nombre: string }; email?: string }
  fechaCreacion?: string
  detallePedido?: PedidoProducto[]
  pedidosProductos?: PedidoProducto[]
  pagos?: Pago[]
}

const router = useRouter()
const cargando = ref(true)
const pedidos = ref<Pedido[]>([])
const filtroEstado = ref<'todos' | 'pendiente' | 'entregado' | 'cancelado'>('todos')
const q = ref('')
const abierto = ref<number | null>(null)
const paginaActual = ref(1)
const itemsPorPagina = ref(10)

const mostrarModal = ref(false)
const imagenModal = ref('')
const mostrarModalConfirm = ref(false)
const mensajeConfirm = ref('')
const accionConfirm = ref<(() => Promise<void>) | null>(null)

onMounted(async () => {
  const token = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null
  if (!token || payload?.rol !== 'EMPLEADO') {
    alert('Solo administradores.')
    router.replace('/')
    return
  }
  await cargarPedidos()
})

async function cargarPedidos() {
  cargando.value = true
  try {
    const { data } = await http.get<Pedido[]>('/pedidos')
    for (const pedido of data) {
      try {
        const { data: detalle } = await http.get(`/pedidos/${pedido.id}`)
        Object.assign(pedido, detalle)

        // backend retorna detallePedido; convertir a pedidosProductos para compatibilidad de template
        const detalleProductos = (detalle.detallePedido || []).map((d: any) => ({
          id: d.id,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          producto: d.producto,
        }))

        pedido.detallePedido = detalleProductos
        pedido.pedidosProductos = detalleProductos
        pedido.pagos = detalle.pagos || []
      } catch {
        pedido.pagos = []
        pedido.pedidosProductos = []
        pedido.detallePedido = []
      }
    }
    pedidos.value = data
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al cargar pedidos')
  } finally {
    cargando.value = false
  }
}

function handleCambioEstadoPedido(pedido: Pedido, nuevoEstado: string) {
  abrirModalConfirm(`¿Desea cambiar el estado del pedido a "${nuevoEstado}"?`, async () => {
    try {
      await http.patch(`/pedidos/${pedido.id}/estado`, { estado: nuevoEstado })
      pedido.estado = nuevoEstado as any
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error al actualizar')
    }
  })
}

function handleCambioEstadoPago(pedido: Pedido, nuevoEstado: string) {
  if (!pedido.pagos?.[0]) {
    alert('Este pedido no tiene registro de pago')
    return
  }
  abrirModalConfirm(
    `¿Desea cambiar el estado del pago a "${nuevoEstado.replace('_', ' ')}"?`,
    async () => {
      try {
        const pago = pedido.pagos?.[0]
        if (!pago) return
        await http.patch(`/pagos/${pago.id}`, { estado: nuevoEstado })
        pago.estado = nuevoEstado
        if (nuevoEstado === 'rechazado') {
          await http.patch(`/pedidos/${pedido.id}/estado`, { estado: 'cancelado' })
          pedido.estado = 'cancelado'
        }
      } catch (e: any) {
        alert(e?.response?.data?.message || 'Error al actualizar')
      }
    },
  )
}

function toggleDetalle(id: number) {
  abierto.value = abierto.value === id ? null : id
}
function verComprobante(url: string) {
  imagenModal.value = url
  mostrarModal.value = true
}
function cerrarModal() {
  mostrarModal.value = false
  imagenModal.value = ''
}

function abrirModalConfirm(mensaje: string, accion: () => Promise<void>) {
  mensajeConfirm.value = mensaje
  accionConfirm.value = accion
  mostrarModalConfirm.value = true
}

function cancelarConfirm() {
  mostrarModalConfirm.value = false
  accionConfirm.value = null
}

async function ejecutarConfirm() {
  mostrarModalConfirm.value = false
  if (accionConfirm.value) {
    await accionConfirm.value()
    accionConfirm.value = null
  }
}

function obtenerEstadoPago(p: Pedido) {
  return p.pagos?.[0]?.estado || 'sin_pago'
}

const filtrados = computed(() => {
  let arr = [...pedidos.value]
  if (filtroEstado.value !== 'todos') arr = arr.filter((p) => p.estado === filtroEstado.value)
  if (q.value.trim()) {
    const s = q.value.trim().toLowerCase()
    arr = arr.filter(
      (p) =>
        String(p.id).includes(s) ||
        (p.usuario?.cliente?.nombre || '').toLowerCase().includes(s) ||
        (p.usuario?.email || '').toLowerCase().includes(s),
    )
  }
  return arr.sort((a, b) => b.id - a.id)
})

const totalPaginas = computed(() => Math.ceil(filtrados.value.length / itemsPorPagina.value))
const paginados = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina.value
  return filtrados.value.slice(inicio, inicio + itemsPorPagina.value)
})

function cambiarPagina(p: number) {
  if (p >= 1 && p <= totalPaginas.value) {
    paginaActual.value = p
    abierto.value = null
  }
}

function fmtFecha(iso?: string) {
  return iso ? new Date(iso).toLocaleString() : '—'
}
function fmtBs(n?: number) {
  return n == null ? '0.00' : Number(n).toFixed(2)
}
</script>

<template>
  <section class="admin-wrap">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon"><i class="pi pi-shopping-cart"></i></div>
        <div>
          <h2 class="page-titulo">Pedidos</h2>
          <p class="page-sub">Administra y actualiza el estado de los pedidos</p>
        </div>
      </div>
      <div class="filters">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input v-model="q" type="search" placeholder="Buscar cliente, ID..." />
        </div>
        <select v-model="filtroEstado">
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nro</th>
              <th>Cliente</th>
              <th>Total (Bs.)</th>
              <th>Método</th>
              <th>Estado Pago</th>
              <th>Estado Pedido</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="p in paginados" :key="p.id">
              <tr :class="{ 'row-abierta': abierto === p.id }">
                <td>
                  <span class="id-badge">#{{ p.id }}</span>
                </td>
                <td>
                  <strong>{{ p.usuario?.cliente?.nombre || '—' }}</strong>
                  <small v-if="p.usuario?.email">{{ p.usuario.email }}</small>
                </td>
                <td>
                  <span class="monto">Bs. {{ fmtBs(p.total) }}</span>
                </td>
                <td>
                  <span class="metodo-badge">{{ p.metodoPago }}</span>
                </td>
                <td>
                  <select
                    v-if="p.pagos?.[0]"
                    class="badge-select"
                    :class="obtenerEstadoPago(p)"
                    :value="obtenerEstadoPago(p)"
                    @change="handleCambioEstadoPago(p, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                  <span v-else class="badge sin">Sin pago</span>
                </td>
                <td>
                  <select
                    class="badge-select"
                    :class="p.estado"
                    :value="p.estado"
                    @change="
                      handleCambioEstadoPedido(p, ($event.target as HTMLSelectElement).value)
                    "
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td class="fecha-cell">{{ fmtFecha(p.fechaCreacion) }}</td>
                <td>
                  <button class="btn-action" @click="toggleDetalle(p.id)">
                    <i :class="abierto === p.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                    {{ abierto === p.id ? 'Ocultar' : 'Ver' }}
                  </button>
                </td>
              </tr>

              <!-- Detalle expandible -->
              <tr v-if="abierto === p.id" class="fila-detalle">
                <td colspan="8">
                  <div class="detalle-content">
                    <!-- Productos -->
                    <div class="detalle-box">
                      <h4><i class="pi pi-box"></i> Productos</h4>
                      <div v-if="!p.pedidosProductos?.length" class="empty">Sin productos</div>
                      <div v-for="d in p.pedidosProductos" :key="d.id" class="producto-row">
                        <img v-if="d.producto?.imagenUrl" :src="d.producto.imagenUrl" />
                        <div class="producto-info">
                          <strong>{{ d.producto?.nombre }}</strong>
                          <span>×{{ d.cantidad }} — Bs. {{ fmtBs(d.precioUnitario) }}</span>
                        </div>
                        <span class="subtotal">Bs. {{ fmtBs(d.cantidad * d.precioUnitario) }}</span>
                      </div>
                    </div>

                    <!-- Pago -->
                    <div class="detalle-box">
                      <h4><i class="pi pi-credit-card"></i> Pago</h4>
                      <div v-if="!p.pagos?.length" class="empty">Sin registro</div>
                      <div v-for="pg in p.pagos" :key="pg.id" class="info-grid">
                        <div class="info-row">
                          <span>Método</span><strong>{{ pg.metodo }}</strong>
                        </div>
                        <div class="info-row">
                          <span>Estado</span>
                          <span class="badge" :class="pg.estado">{{
                            pg.estado.replace('_', ' ')
                          }}</span>
                        </div>
                        <div class="info-row" v-if="pg.comprobante">
                          <span>Comprobante</span>
                          <button class="btn-comprobante" @click="verComprobante(pg.comprobante!)">
                            <i class="pi pi-image"></i> Ver
                          </button>
                        </div>
                        <div class="info-row">
                          <span>Fecha</span><small>{{ fmtFecha(pg.fechaPago) }}</small>
                        </div>
                      </div>
                    </div>

                    <!-- Envío -->
                    <div class="detalle-box">
                      <h4><i class="pi pi-truck"></i> Envío</h4>
                      <div class="info-grid">
                        <div class="info-row">
                          <span>Tipo</span><strong>{{ p.tipoEnvio || '—' }}</strong>
                        </div>
                        <div class="info-row" v-if="p.direccion">
                          <span>Dirección</span><span>{{ p.direccion }}</span>
                        </div>
                        <div class="info-row" v-if="p.referencia">
                          <span>Referencia</span><span>{{ p.referencia }}</span>
                        </div>
                        <div class="info-row" v-if="p.departamento || p.pais">
                          <span>Ubicación</span>
                          <span>{{ [p.departamento, p.pais].filter(Boolean).join(', ') }}</span>
                        </div>
                        <div class="empty" v-if="!p.tipoEnvio && !p.direccion">
                          Sin datos de envío
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="!cargando && !paginados.length">
              <td colspan="8" class="empty-state">
                <div class="empty-icon">🛒</div>
                <p>No hay pedidos</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cargando -->
      <div v-if="cargando" class="loading-row">
        <i class="pi pi-spin pi-spinner"></i> Cargando pedidos...
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
        <div class="paginas">
          <button
            v-for="p in totalPaginas"
            :key="p"
            class="btn-num"
            :class="{ activo: p === paginaActual }"
            @click="cambiarPagina(p)"
          >
            {{ p }}
          </button>
        </div>
        <button
          class="btn-pag"
          :disabled="paginaActual === totalPaginas"
          @click="cambiarPagina(paginaActual + 1)"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal Confirmación -->
    <div v-if="mostrarModalConfirm" class="modal-overlay" @click="cancelarConfirm">
      <div class="modal-confirm" @click.stop>
        <div class="modal-confirm-icon">⚠️</div>
        <h3>Confirmar acción</h3>
        <p>{{ mensajeConfirm }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelarConfirm">Cancelar</button>
          <button class="btn-confirm" @click="ejecutarConfirm">Confirmar</button>
        </div>
      </div>
    </div>

    <!-- Modal Comprobante -->
    <div v-if="mostrarModal" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <button class="btn-close" @click="cerrarModal"><i class="pi pi-times"></i></button>
        <img :src="imagenModal" alt="Comprobante" class="modal-img" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-wrap {
  padding: 1.75rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
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
  margin: 0 0 0.2rem;
}

.page-sub {
  font-size: 0.85rem;
  color: #f48fb1;
  margin: 0;
}

/* Filters */
.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  color: #f48fb1;
  font-size: 0.85rem;
  pointer-events: none;
}

.filters input {
  padding: 0.6rem 1rem 0.6rem 2.25rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  width: 240px;
  outline: none;
  background: white;
  transition: border-color 0.2s;
}

.filters input:focus {
  border-color: #e91e8c;
}

.filters select {
  padding: 0.6rem 1rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  outline: none;
  background: white;
  color: #880e4f;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filters select:focus {
  border-color: #e91e8c;
}

/* Card / Tabla */
.card {
  background: white;
  border-radius: 16px;
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
  min-width: 780px;
}

th {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.85rem 1rem;
  text-align: left;
  white-space: nowrap;
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

tr:hover td {
  background: #fff9fb;
}

.row-abierta td {
  background: #fff0f5;
}

td strong {
  display: block;
  color: #880e4f;
  font-weight: 700;
}

td small {
  display: block;
  color: #aaa;
  font-size: 0.78rem;
}

.id-badge {
  background: #fce4ec;
  color: #c2185b;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 50px;
}

.monto {
  font-weight: 800;
  color: #e91e8c;
}

.metodo-badge {
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
  text-transform: capitalize;
}

.fecha-cell {
  font-size: 0.8rem;
  color: #999;
  white-space: nowrap;
}

/* Badges de estado */
.badge,
.badge-select {
  padding: 0.3rem 0.75rem;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  text-transform: capitalize;
  display: inline-block;
}

.badge.pendiente,
.badge-select.pendiente {
  background: #fff3e0;
  color: #e65100;
}
.badge.en_revision,
.badge-select.en_revision {
  background: #e3f2fd;
  color: #1565c0;
}
.badge.aprobado,
.badge-select.aprobado {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge.entregado,
.badge-select.entregado {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge.rechazado,
.badge-select.rechazado,
.badge.cancelado,
.badge-select.cancelado {
  background: #fce4ec;
  color: #c62828;
}
.badge.sin {
  background: #f5f5f5;
  color: #9e9e9e;
}

/* Acciones */
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-action:hover {
  background: #f8bbd0;
}

/* Detalle expandible */
.fila-detalle td {
  padding: 0;
  background: #fff9fb;
  border-bottom: 2px solid #fce4ec;
}

.detalle-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.detalle-box {
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid #fce4ec;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.06);
}

.detalle-box h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: #c2185b;
  font-weight: 700;
  padding-bottom: 0.6rem;
  border-bottom: 2px solid #fce4ec;
}

.producto-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  background: #fff9fb;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.producto-row img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #fce4ec;
  flex-shrink: 0;
}

.producto-info {
  flex: 1;
}

.producto-info strong {
  font-size: 0.875rem;
  display: block;
  color: #880e4f;
  margin-bottom: 0.1rem;
}

.producto-info span {
  font-size: 0.78rem;
  color: #aaa;
}

.subtotal {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.875rem;
  white-space: nowrap;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.info-row span:first-child {
  color: #aaa;
  font-weight: 500;
}

.btn-comprobante {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.85rem;
  background: #e3f2fd;
  color: #1565c0;
  border: none;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-comprobante:hover {
  background: #bbdefb;
}

.empty,
.empty-state {
  text-align: center;
  color: #ccc;
  font-style: italic;
  padding: 1.25rem;
  font-size: 0.875rem;
}

.empty-state .empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* Loading */
.loading-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #f48fb1;
  font-size: 0.9rem;
}

/* Paginación */
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #fce4ec;
}

.paginas {
  display: flex;
  gap: 0.3rem;
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

/* Modales */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(3px);
}

.modal-confirm {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(233, 30, 140, 0.25);
  text-align: center;
}

.modal-confirm-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.modal-confirm h3 {
  margin: 0 0 0.75rem;
  font-size: 1.2rem;
  color: #880e4f;
  font-weight: 800;
}

.modal-confirm p {
  margin: 0 0 1.5rem;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn-cancel {
  padding: 0.65rem 1.5rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-confirm {
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s;
}

.btn-confirm:hover {
  opacity: 0.9;
}

.modal-content {
  position: relative;
  max-width: 700px;
  max-height: 85vh;
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
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

.modal-img {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  .filters {
    flex-direction: column;
  }
  .filters input {
    width: 100%;
  }
  .detalle-content {
    grid-template-columns: 1fr;
  }
}
</style>
