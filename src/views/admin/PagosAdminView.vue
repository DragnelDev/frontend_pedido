<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

type Pago = {
  id: number
  metodo: 'efectivo' | 'transferencia' | 'qr' | 'tarjeta'
  monto: number
  estado: string
  comprobante?: string
  maskedCard?: string
  fechaPago?: string
  pedido?: {
    id: number
    total: number
    estado: string
    usuario?: { nombre: string; email: string }
  }
}

const router = useRouter()
const cargando = ref(true)
const pagos = ref<Pago[]>([])
const filtroEstado = ref<'todos' | 'pendiente' | 'aprobado' | 'rechazado' | 'en_revision'>('todos')
const filtroMetodo = ref<'todos' | 'efectivo' | 'transferencia' | 'qr' | 'tarjeta'>('todos')
const q = ref('')
const paginaActual = ref(1)
const itemsPorPagina = ref(10)

const mostrarModal = ref(false)
const imagenModal = ref('')

onMounted(async () => {
  const token = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null
  if (!token || payload?.rol !== 'EMPLEADO') {
    alert('Solo administradores.')
    router.replace('/')
    return
  }
  await cargarPagos()
})

async function cargarPagos() {
  cargando.value = true
  try {
    const { data } = await http.get<Pago[]>('/pagos')
    pagos.value = data
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al cargar pagos')
  } finally {
    cargando.value = false
  }
}

function verComprobante(url: string) {
  imagenModal.value = url
  mostrarModal.value = true
}
function cerrarModal() {
  mostrarModal.value = false
  imagenModal.value = ''
}

const filtrados = computed(() => {
  let arr = [...pagos.value]
  if (filtroEstado.value !== 'todos') arr = arr.filter((p) => p.estado === filtroEstado.value)
  if (filtroMetodo.value !== 'todos') arr = arr.filter((p) => p.metodo === filtroMetodo.value)
  if (q.value.trim()) {
    const s = q.value.trim().toLowerCase()
    arr = arr.filter(
      (p) =>
        String(p.id).includes(s) ||
        String(p.pedido?.id || '').includes(s) ||
        (p.pedido?.usuario?.nombre || '').toLowerCase().includes(s) ||
        (p.pedido?.usuario?.email || '').toLowerCase().includes(s),
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
  if (p >= 1 && p <= totalPaginas.value) paginaActual.value = p
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
        <div class="page-icon"><i class="pi pi-credit-card"></i></div>
        <div>
          <h2 class="page-titulo">Pagos</h2>
          <p class="page-sub">Revisa y gestiona todos los pagos registrados</p>
        </div>
      </div>
      <div class="filters">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input v-model="q" type="search" placeholder="Buscar..." />
        </div>
        <select v-model="filtroMetodo">
          <option value="todos">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="qr">QR</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
        <select v-model="filtroEstado">
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En Revisión</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>
    </div>

    <!-- Card con tabla -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#Pago</th>
              <th>#Pedido</th>
              <th>Cliente</th>
              <th>Método</th>
              <th>Monto (Bs.)</th>
              <th>Estado</th>
              <th>Comprobante</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paginados" :key="p.id">
              <td>
                <span class="id-badge">#{{ p.id }}</span>
              </td>
              <td>
                <span class="id-badge secondary">#{{ p.pedido?.id ?? '—' }}</span>
              </td>
              <td>
                <strong>
                  {{ p.pedido?.usuario?.nombre || p.pedido?.usuario?.email || '—' }}
                </strong>
                <small v-if="p.pedido?.usuario?.nombre && p.pedido?.usuario?.email">
                  {{ p.pedido.usuario.email }}
                </small>
              </td>
              <td>
                <span class="metodo-badge">{{ p.metodo }}</span>
              </td>
              <td>
                <span class="monto">Bs. {{ fmtBs(p.monto) }}</span>
              </td>
              <td>
                <span class="badge" :class="p.estado">{{ p.estado.replace('_', ' ') }}</span>
              </td>
              <td>
                <button
                  v-if="p.comprobante"
                  class="btn-comprobante"
                  @click="verComprobante(p.comprobante!)"
                >
                  <i class="pi pi-image"></i> Ver
                </button>
                <span v-else class="sin-dato">—</span>
              </td>
              <td class="fecha-cell">{{ fmtFecha(p.fechaPago) }}</td>
            </tr>

            <tr v-if="!cargando && !paginados.length">
              <td colspan="8" class="empty-state">
                <div class="empty-icon">💳</div>
                <p>No hay pagos</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cargando -->
      <div v-if="cargando" class="loading-row">
        <i class="pi pi-spin pi-spinner"></i> Cargando pagos...
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
  width: 220px;
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
  min-width: 720px;
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
  font-size: 0.78rem;
  padding: 0.2rem 0.55rem;
  border-radius: 50px;
}

.id-badge.secondary {
  background: #e8eaf6;
  color: #3949ab;
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

.badge {
  padding: 0.3rem 0.75rem;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-block;
  text-transform: capitalize;
}

.badge.pendiente {
  background: #fff3e0;
  color: #e65100;
}
.badge.en_revision {
  background: #e3f2fd;
  color: #1565c0;
}
.badge.aprobado,
.badge.confirmado {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge.rechazado,
.badge.cancelado {
  background: #fce4ec;
  color: #c62828;
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

.sin-dato {
  color: #ccc;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 2.5rem;
}

.empty-state .empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.empty-state p {
  color: #ccc;
  font-style: italic;
  font-size: 0.9rem;
  margin: 0;
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

/* Modal */
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

.modal-content {
  position: relative;
  max-width: 700px;
  max-height: 85vh;
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
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
}
</style>
