<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos (alineados al DER: pagos → pedidos → usuarios → clientes)
// ─────────────────────────────────────────────────────────────────────────────
type Pago = {
  id: number
  metodo: 'efectivo' | 'transferencia' | 'qr' | 'tarjeta'
  monto: number
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado'
  comprobante?: string
  maskedCard?: string
  fechaPago?: string
  pedido?: {
    id: number
    total: number
    estado: string
    tipoEnvio?: string
    usuario?: {
      email?: string
      cliente?: { nombre: string; apellidoPaterno?: string }
    }
  }
}

type FiltroEstado = 'todos' | 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado'
type FiltroMetodo = 'todos' | 'efectivo' | 'transferencia' | 'qr' | 'tarjeta'

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const router = useRouter()
const cargando = ref(true)
const pagos = ref<Pago[]>([])
const filtroEstado = ref<FiltroEstado>('todos')
const filtroMetodo = ref<FiltroMetodo>('todos')
const q = ref('')
const paginaActual = ref(1)
const POR_PAGINA = 10

// Modal comprobante
const modalImg = ref('')
const showModalImg = ref(false)
const modalPagoInfo = ref<{ id: number; pedidoId?: number; monto: number; metodo: string } | null>(
  null,
)

// ─────────────────────────────────────────────────────────────────────────────
// Montaje
// ─────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const token = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null
  if (!token || payload?.rol !== 'EMPLEADO') {
    alert('Acceso restringido.')
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

// ─────────────────────────────────────────────────────────────────────────────
// KPIs financieros
// ─────────────────────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const total = pagos.value.length
  const aprobados = pagos.value.filter((p) => p.estado === 'aprobado')
  const pendientes = pagos.value.filter((p) => p.estado === 'pendiente').length
  const revision = pagos.value.filter((p) => p.estado === 'en_revision').length
  const rechazados = pagos.value.filter((p) => p.estado === 'rechazado').length

  const recaudado = aprobados.reduce((s, p) => s + Number(p.monto), 0)

  // Recaudado por método (solo aprobados)
  const porMetodo: Record<string, number> = {}
  for (const p of aprobados) {
    porMetodo[p.metodo] = (porMetodo[p.metodo] || 0) + Number(p.monto)
  }

  return { total, pendientes, revision, rechazados, recaudado, porMetodo }
})

// ─────────────────────────────────────────────────────────────────────────────
// Filtrado y paginación
// ─────────────────────────────────────────────────────────────────────────────
const filtrados = computed(() => {
  let arr = [...pagos.value]
  if (filtroEstado.value !== 'todos') arr = arr.filter((p) => p.estado === filtroEstado.value)
  if (filtroMetodo.value !== 'todos') arr = arr.filter((p) => p.metodo === filtroMetodo.value)
  const s = q.value.trim().toLowerCase()
  if (s)
    arr = arr.filter(
      (p) =>
        String(p.id).includes(s) ||
        String(p.pedido?.id || '').includes(s) ||
        (p.pedido?.usuario?.cliente?.nombre || '').toLowerCase().includes(s) ||
        (p.pedido?.usuario?.email || '').toLowerCase().includes(s),
    )
  return arr.sort((a, b) => b.id - a.id)
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
  const cur = paginaActual.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────
function verComprobante(pago: Pago) {
  if (!pago.comprobante) return
  modalImg.value = pago.comprobante
  modalPagoInfo.value = {
    id: pago.id,
    pedidoId: pago.pedido?.id,
    monto: pago.monto,
    metodo: pago.metodo,
  }
  showModalImg.value = true
}

function cerrarModal() {
  showModalImg.value = false
  setTimeout(() => {
    modalImg.value = ''
    modalPagoInfo.value = null
  }, 300)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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

function nombreCliente(p: Pago) {
  return p.pedido?.usuario?.cliente?.nombre || p.pedido?.usuario?.email || '—'
}

function emailCliente(p: Pago) {
  const nombre = p.pedido?.usuario?.cliente?.nombre
  const email = p.pedido?.usuario?.email
  return nombre && email ? email : null
}

const METODO_CFG: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  efectivo: { icon: '💵', label: 'Efectivo', bg: '#e8f5e9', color: '#2e7d32' },
  qr: { icon: '📱', label: 'QR', bg: '#e8eaf6', color: '#3949ab' },
  transferencia: { icon: '🏦', label: 'Transferencia', bg: '#e3f2fd', color: '#1565c0' },
  tarjeta: { icon: '💳', label: 'Tarjeta', bg: '#f3e5f5', color: '#7b1fa2' },
}

const ESTADO_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pendiente: { label: 'Pendiente', bg: '#fff3e0', color: '#e65100', border: '#ffe0b2' },
  en_revision: { label: 'En revisión', bg: '#e3f2fd', color: '#1565c0', border: '#bbdefb' },
  aprobado: { label: 'Aprobado', bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' },
  rechazado: { label: 'Rechazado', bg: '#fce4ec', color: '#c62828', border: '#f8bbd0' },
}

function estadoCfg(estado: string) {
  return ESTADO_CFG[estado] ?? { label: estado, bg: '#f5f5f5', color: '#888', border: '#eee' }
}

function metodoCfg(metodo: string) {
  return METODO_CFG[metodo] ?? { icon: '💰', label: metodo, bg: '#f5f5f5', color: '#666' }
}

const ESTADOS_FILTRO: { value: FiltroEstado; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
]

const METODOS_FILTRO: { value: FiltroMetodo; label: string; icon: string }[] = [
  { value: 'todos', label: 'Todos', icon: '🔍' },
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'qr', label: 'QR', icon: '📱' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
]
</script>

<template>
  <section class="admin-wrap">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon"><i class="pi pi-credit-card"></i></div>
        <div>
          <h2 class="page-titulo">Pagos</h2>
          <p class="page-sub">Revisa y gestiona todos los pagos registrados</p>
        </div>
      </div>
      <button class="btn-recargar" @click="cargarPagos" :disabled="cargando">
        <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        Actualizar
      </button>
    </div>

    <!-- ── KPIs ────────────────────────────────────────────────────────────── -->
    <div class="kpis-grid">
      <!-- Recaudado total (aprobados) -->
      <div class="kpi-card kpi-featured">
        <div
          class="kpi-icon"
          style="background: linear-gradient(135deg, #e91e8c, #f06292); color: white"
        >
          <i class="pi pi-wallet"></i>
        </div>
        <div>
          <p class="kpi-valor kpi-big">Bs. {{ fmtBs(kpis.recaudado) }}</p>
          <p class="kpi-label">Total recaudado (aprobados)</p>
        </div>
      </div>

      <!-- Pendientes -->
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

      <!-- En revisión -->
      <div
        class="kpi-card kpi-clickable"
        @click="((filtroEstado = 'en_revision'), (paginaActual = 1))"
      >
        <div class="kpi-icon" style="background: #e3f2fd; color: #1565c0">
          <i class="pi pi-eye"></i>
        </div>
        <div>
          <p class="kpi-valor" style="color: #1565c0">{{ kpis.revision }}</p>
          <p class="kpi-label">En revisión</p>
        </div>
      </div>

      <!-- Rechazados -->
      <div
        class="kpi-card kpi-clickable"
        @click="((filtroEstado = 'rechazado'), (paginaActual = 1))"
      >
        <div class="kpi-icon" style="background: #fce4ec; color: #c62828">
          <i class="pi pi-times-circle"></i>
        </div>
        <div>
          <p class="kpi-valor" style="color: #c62828">{{ kpis.rechazados }}</p>
          <p class="kpi-label">Rechazados</p>
        </div>
      </div>

      <!-- Total de pagos -->
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #fce4ec; color: #e91e8c">
          <i class="pi pi-list"></i>
        </div>
        <div>
          <p class="kpi-valor">{{ kpis.total }}</p>
          <p class="kpi-label">Total registros</p>
        </div>
      </div>
    </div>

    <!-- ── Recaudado por método ─────────────────────────────────────────────── -->
    <div v-if="Object.keys(kpis.porMetodo).length" class="metodo-resumen">
      <p class="metodo-resumen-titulo">Recaudado por método (aprobados)</p>
      <div class="metodo-chips">
        <div
          v-for="(monto, metodo) in kpis.porMetodo"
          :key="metodo"
          class="metodo-chip-kpi"
          :style="`background:${metodoCfg(metodo).bg}; color:${metodoCfg(metodo).color}`"
        >
          <span>{{ metodoCfg(metodo).icon }}</span>
          <span class="mc-label">{{ metodoCfg(metodo).label }}</span>
          <strong class="mc-monto">Bs. {{ fmtBs(monto) }}</strong>
        </div>
      </div>
    </div>

    <!-- ── Filtros ─────────────────────────────────────────────────────────── -->
    <div class="filtros-wrap">
      <!-- Búsqueda -->
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="q"
          type="search"
          placeholder="Buscar por ID, pedido, cliente, email..."
          @input="paginaActual = 1"
        />
      </div>

      <!-- Tabs de estado -->
      <div class="filtro-tabs">
        <button
          v-for="e in ESTADOS_FILTRO"
          :key="e.value"
          class="tab-btn"
          :class="{ activo: filtroEstado === e.value }"
          @click="
            () => {
              filtroEstado = e.value
              paginaActual = 1
            }
          "
        >
          {{ e.label }}
          <span class="tab-count">
            {{
              e.value === 'todos' ? pagos.length : pagos.filter((p) => p.estado === e.value).length
            }}
          </span>
        </button>
      </div>

      <!-- Chips de método -->
      <div class="metodo-filtros">
        <button
          v-for="m in METODOS_FILTRO"
          :key="m.value"
          class="metodo-chip-btn"
          :class="{ activo: filtroMetodo === m.value }"
          @click="
            () => {
              filtroMetodo = m.value
              paginaActual = 1
            }
          "
        >
          {{ m.icon }} {{ m.label }}
        </button>
      </div>
    </div>

    <!-- ── Tabla ───────────────────────────────────────────────────────────── -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width: 85px">#Pago</th>
              <th style="width: 90px">#Pedido</th>
              <th>Cliente</th>
              <th style="width: 140px">Método</th>
              <th style="width: 130px">Monto</th>
              <th style="width: 140px">Estado pago</th>
              <th style="width: 130px">Estado pedido</th>
              <th style="width: 110px">Comprobante</th>
              <th style="width: 150px">Fecha pago</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton cargando -->
            <template v-if="cargando">
              <tr v-for="n in 6" :key="n" class="row-skeleton">
                <td colspan="9"><div class="skeleton-line"></div></td>
              </tr>
            </template>

            <template v-else>
              <tr v-for="p in paginados" :key="p.id">
                <!-- ID Pago -->
                <td>
                  <span class="id-badge pago">#{{ String(p.id).padStart(4, '0') }}</span>
                </td>

                <!-- ID Pedido -->
                <td>
                  <span class="id-badge pedido"
                    >#{{ String(p.pedido?.id ?? '—').padStart(5, '0') }}</span
                  >
                </td>

                <!-- Cliente -->
                <td>
                  <p class="td-nombre">{{ nombreCliente(p) }}</p>
                  <small v-if="emailCliente(p)" class="td-email">{{ emailCliente(p) }}</small>
                </td>

                <!-- Método -->
                <td>
                  <span
                    class="metodo-badge"
                    :style="`background:${metodoCfg(p.metodo).bg}; color:${metodoCfg(p.metodo).color}`"
                  >
                    {{ metodoCfg(p.metodo).icon }} {{ metodoCfg(p.metodo).label }}
                  </span>
                  <small v-if="p.maskedCard" class="masked-card">{{ p.maskedCard }}</small>
                </td>

                <!-- Monto -->
                <td>
                  <span class="monto">Bs. {{ fmtBs(p.monto) }}</span>
                </td>

                <!-- Estado pago -->
                <td>
                  <span
                    class="estado-badge"
                    :style="`background:${estadoCfg(p.estado).bg}; color:${estadoCfg(p.estado).color}; border-color:${estadoCfg(p.estado).border}`"
                  >
                    {{ estadoCfg(p.estado).label }}
                  </span>
                </td>

                <!-- Estado pedido -->
                <td>
                  <span
                    v-if="p.pedido?.estado"
                    class="estado-badge estado-pedido"
                    :class="p.pedido.estado"
                  >
                    {{ p.pedido.estado }}
                  </span>
                  <span v-else class="td-null">—</span>
                </td>

                <!-- Comprobante -->
                <td>
                  <button v-if="p.comprobante" class="btn-comprobante" @click="verComprobante(p)">
                    <i class="pi pi-image"></i> Ver
                  </button>
                  <span v-else class="td-null">Sin archivo</span>
                </td>

                <!-- Fecha -->
                <td class="td-fecha">{{ fmtFecha(p.fechaPago) }}</td>
              </tr>

              <!-- Sin resultados -->
              <tr v-if="!paginados.length">
                <td colspan="9" class="td-vacio">
                  <div class="vacio-wrap">
                    <span class="vacio-icon">💳</span>
                    <p>
                      No hay pagos
                      {{ filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : '' }}
                    </p>
                    <button
                      v-if="filtroEstado !== 'todos' || filtroMetodo !== 'todos'"
                      class="btn-reset"
                      @click="
                        () => {
                          filtroEstado = 'todos'
                          filtroMetodo = 'todos'
                          q = ''
                        }
                      "
                    >
                      Limpiar filtros
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
        <span class="pag-info">{{ filtrados.length }} registros</span>
      </div>
    </div>

    <!-- ── Modal comprobante ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModalImg" class="modal-overlay" @click.self="cerrarModal">
          <div class="modal-img-wrap">
            <button class="btn-close" @click="cerrarModal">
              <i class="pi pi-times"></i>
            </button>

            <!-- Info del pago -->
            <div v-if="modalPagoInfo" class="modal-info-bar">
              <div class="modal-info-item">
                <span>Pago</span>
                <strong>#{{ String(modalPagoInfo.id).padStart(4, '0') }}</strong>
              </div>
              <div v-if="modalPagoInfo.pedidoId" class="modal-info-item">
                <span>Pedido</span>
                <strong>#{{ String(modalPagoInfo.pedidoId).padStart(5, '0') }}</strong>
              </div>
              <div class="modal-info-item">
                <span>Monto</span>
                <strong class="monto">Bs. {{ fmtBs(modalPagoInfo.monto) }}</strong>
              </div>
              <div class="modal-info-item">
                <span>Método</span>
                <span
                  class="metodo-badge small"
                  :style="`background:${metodoCfg(modalPagoInfo.metodo).bg}; color:${metodoCfg(modalPagoInfo.metodo).color}`"
                >
                  {{ metodoCfg(modalPagoInfo.metodo).icon }}
                  {{ metodoCfg(modalPagoInfo.metodo).label }}
                </span>
              </div>
            </div>

            <p class="modal-titulo">Comprobante de pago</p>
            <img :src="modalImg" alt="Comprobante" class="modal-img" />
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
  grid-template-columns: 2fr repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
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

.kpi-card.kpi-featured {
  border-color: #f48fb1;
  background: linear-gradient(135deg, #fff0f7, #fff9fb);
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.12);
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
  font-size: 1.35rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.1rem;
}
.kpi-big {
  font-size: 1.5rem;
  color: #e91e8c;
}
.kpi-label {
  font-size: 0.72rem;
  color: #aaa;
  font-weight: 500;
  margin: 0;
}

/* ── Resumen por método ─────────────────────────────────────────────────────── */
.metodo-resumen {
  background: white;
  border-radius: 14px;
  border: 1px solid #fce4ec;
  padding: 0.9rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.05);
}

.metodo-resumen-titulo {
  font-size: 0.75rem;
  font-weight: 700;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.75rem;
}

.metodo-chips {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.metodo-chip-kpi {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.82rem;
}

.mc-label {
  font-weight: 600;
}
.mc-monto {
  font-weight: 800;
  margin-left: 0.25rem;
}

/* ── Filtros ────────────────────────────────────────────────────────────────── */
.filtros-wrap {
  display: flex;
  align-items: center;
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

/* Tabs estado */
.filtro-tabs {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.9rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #aaa;
  font-size: 0.78rem;
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
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 50px;
}

.tab-btn:not(.activo) .tab-count {
  background: #fce4ec;
  color: #e91e8c;
}
.tab-btn.activo .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

/* Chips método */
.metodo-filtros {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.metodo-chip-btn {
  padding: 0.38rem 0.85rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #888;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.metodo-chip-btn:hover {
  border-color: #f48fb1;
  color: #c2185b;
}
.metodo-chip-btn.activo {
  border-color: #880e4f;
  background: #fce4ec;
  color: #880e4f;
}

/* ── Card / tabla ───────────────────────────────────────────────────────────── */
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
  min-width: 860px;
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
tr:hover td {
  background: #fff9fb;
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

/* ── Celdas / badges ────────────────────────────────────────────────────────── */
.id-badge {
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.22rem 0.6rem;
  border-radius: 50px;
  white-space: nowrap;
  display: inline-block;
}

.id-badge.pago {
  background: #fce4ec;
  color: #c2185b;
}
.id-badge.pedido {
  background: #e8eaf6;
  color: #3949ab;
}

.td-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.875rem;
  margin: 0 0 0.12rem;
}
.td-email {
  color: #bbb;
  font-size: 0.75rem;
  display: block;
}
.td-fecha {
  font-size: 0.75rem;
  color: #aaa;
  white-space: nowrap;
}
.td-null {
  color: #ccc;
  font-style: italic;
  font-size: 0.8rem;
}

.monto {
  font-weight: 800;
  color: #e91e8c;
}

.metodo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
  white-space: nowrap;
}

.metodo-badge.small {
  font-size: 0.72rem;
}

.masked-card {
  display: block;
  font-size: 0.7rem;
  color: #aaa;
  margin-top: 0.15rem;
  font-family: monospace;
}

.estado-badge {
  display: inline-block;
  padding: 0.28rem 0.7rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1.5px solid;
  text-transform: capitalize;
}

/* Estado del pedido (sin inline style, usa clases) */
.estado-pedido.pendiente {
  background: #fff3e0;
  color: #e65100;
  border-color: #ffe0b2;
}
.estado-pedido.entregado {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #c8e6c9;
}
.estado-pedido.cancelado {
  background: #fce4ec;
  color: #c62828;
  border-color: #f8bbd0;
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
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-comprobante:hover {
  background: #bbdefb;
}

/* ── Vacío ──────────────────────────────────────────────────────────────────── */
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

.btn-reset {
  padding: 0.4rem 1rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.25rem;
}

.btn-reset:hover {
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

/* ── Modal ──────────────────────────────────────────────────────────────────── */
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

.modal-img-wrap {
  position: relative;
  background: white;
  border-radius: 18px;
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

/* Info bar del modal */
.modal-info-bar {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: #fff9fb;
  border: 1px solid #fce4ec;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.modal-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.modal-info-item > span:first-child {
  font-size: 0.68rem;
  color: #bbb;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.modal-info-item strong {
  font-size: 0.9rem;
  font-weight: 700;
  color: #880e4f;
}

.modal-titulo {
  font-weight: 700;
  color: #c2185b;
  font-size: 0.875rem;
  margin: 0 0 0.85rem;
}

.modal-img {
  width: 100%;
  height: auto;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 10px;
  display: block;
  border: 1px solid #fce4ec;
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
    grid-template-columns: 1fr repeat(4, 1fr);
  }
}

@media (max-width: 860px) {
  .kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi-featured {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .admin-wrap {
    padding: 1rem;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .filtros-wrap {
    flex-direction: column;
    align-items: stretch;
  }
  .search-wrap input {
    width: 100%;
  }
  .kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
