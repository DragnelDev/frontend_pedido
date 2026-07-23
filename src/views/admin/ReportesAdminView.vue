<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import http from '@/plugins/axios'

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const cargando = ref(true)
const error    = ref<string | null>(null)

const totalVentas        = ref(0)
const totalPedidos       = ref(0)
const pedidosPendientes  = ref(0)
const pedidosEntregados  = ref(0)
const pedidosCancelados  = ref(0)
const ticketPromedio     = ref(0)

const topProductos    = ref<{ nombre: string; total: number; cantidad: number }[]>([])
const ventasPorMetodo = ref<{ metodo: string; total: number; cantidad: number }[]>([])
const pedidosRecientes = ref<any[]>([])

// Filtro activo sobre pedidos recientes (solo visual, no recarga datos)
const filtroEstado = ref<'todos' | 'pendiente' | 'entregado' | 'cancelado'>('todos')

// ─────────────────────────────────────────────────────────────────────────────
// Carga
// ─────────────────────────────────────────────────────────────────────────────
onMounted(cargar)

async function cargar() {
  cargando.value = true
  error.value    = null
  try {
    const [resPedidos, resPagos] = await Promise.all([
      http.get('/pedidos'),
      http.get('/pagos'),
    ])

    const pedidos: any[] = resPedidos.data
    const pagos: any[]   = resPagos.data

    // ── Métricas de pedidos ─────────────────────────────────────────────
    totalPedidos.value      = pedidos.length
    pedidosPendientes.value = pedidos.filter(p => p.estado === 'pendiente').length
    pedidosEntregados.value = pedidos.filter(p => p.estado === 'entregado').length
    pedidosCancelados.value = pedidos.filter(p => p.estado === 'cancelado').length

    // ── Ingresos (pagos aprobados/confirmados) ──────────────────────────
    const pagosAprobados = pagos.filter(p =>
      p.estado === 'aprobado' || p.estado === 'confirmado'
    )
    totalVentas.value  = pagosAprobados.reduce((s, p) => s + Number(p.monto || 0), 0)
    ticketPromedio.value = pedidosEntregados.value > 0
      ? totalVentas.value / pedidosEntregados.value
      : 0

    // ── Ventas por método ───────────────────────────────────────────────
    const metodos: Record<string, { total: number; cantidad: number }> = {}
    for (const p of pagos) {
      if (!metodos[p.metodo]) metodos[p.metodo] = { total: 0, cantidad: 0 }
      metodos[p.metodo].total    += Number(p.monto || 0)
      metodos[p.metodo].cantidad += 1
    }
    ventasPorMetodo.value = Object.entries(metodos)
      .map(([metodo, v]) => ({ metodo, ...v }))
      .sort((a, b) => b.total - a.total)

    // ── Top productos (desde detalles de pedidos entregados) ─────────────
    const conteo: Record<string, { nombre: string; total: number; cantidad: number }> = {}
    for (const pedido of pedidos) {
      if (pedido.estado !== 'entregado') continue
      for (const det of (pedido.detallePedido || pedido.pedidosProductos || [])) {
        const nombre = det.producto?.nombre || det.nombre || `#${det.idProducto}`
        if (!conteo[nombre]) conteo[nombre] = { nombre, total: 0, cantidad: 0 }
        conteo[nombre].cantidad += Number(det.cantidad || 0)
        conteo[nombre].total    += Number(det.precioUnitario || 0) * Number(det.cantidad || 0)
      }
    }
    topProductos.value = Object.values(conteo)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6)

    // ── Pedidos recientes ───────────────────────────────────────────────
    pedidosRecientes.value = [...pedidos]
      .sort((a, b) => b.id - a.id)
      .slice(0, 8)

  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar los reportes.'
    console.error(e)
  } finally {
    cargando.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────────────────────────────────────
const porcentajeEntregados = computed(() =>
  totalPedidos.value > 0
    ? Math.round((pedidosEntregados.value / totalPedidos.value) * 100)
    : 0
)

const pedidosFiltrados = computed(() => {
  if (filtroEstado.value === 'todos') return pedidosRecientes.value
  return pedidosRecientes.value.filter(p => p.estado === filtroEstado.value)
})

const maxCantidadTop = computed(() =>
  topProductos.value.length
    ? Math.max(...topProductos.value.map(p => p.cantidad))
    : 1
)

const maxMontoMetodo = computed(() =>
  ventasPorMetodo.value.length
    ? Math.max(...ventasPorMetodo.value.map(m => m.total))
    : 1
)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtBs(n: number) { return Number(n || 0).toFixed(2) }

function fmtFecha(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const METODO_ICON: Record<string, string> = {
  efectivo:      '💵',
  qr:            '📱',
  transferencia: '🏦',
  tarjeta:       '💳',
}

const ESTADO_CFG: Record<string, { bg: string; color: string }> = {
  pendiente: { bg: '#fff3e0', color: '#e65100' },
  entregado: { bg: '#e8f5e9', color: '#2e7d32' },
  cancelado: { bg: '#fce4ec', color: '#c62828' },
}

function estadoCfg(estado: string) {
  return ESTADO_CFG[estado] ?? { bg: '#f5f5f5', color: '#888' }
}
</script>

<template>
  <div class="admin-wrap">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon"><i class="pi pi-chart-bar"></i></div>
        <div>
          <h2 class="page-titulo">Reportes</h2>
          <p class="page-sub">Resumen general de ventas y pedidos</p>
        </div>
      </div>
      <button class="btn-recargar" @click="cargar" :disabled="cargando">
        <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        Actualizar
      </button>
    </div>

    <!-- ── Error ───────────────────────────────────────────────────────────── -->
    <div v-if="error && !cargando" class="error-banner">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
      <button class="btn-retry" @click="cargar">
        <i class="pi pi-refresh"></i> Reintentar
      </button>
    </div>

    <!-- ── Skeleton ─────────────────────────────────────────────────────────── -->
    <template v-if="cargando">
      <div class="kpi-grid">
        <div v-for="n in 5" :key="n" class="kpi-skeleton">
          <div class="sk-icon"></div>
          <div class="sk-lines">
            <div class="sk-line sk-sm"></div>
            <div class="sk-line sk-lg"></div>
          </div>
        </div>
      </div>
      <div class="reportes-grid">
        <div class="reporte-card sk-card-body"><div class="sk-block"></div></div>
        <div class="reporte-card sk-card-body"><div class="sk-block"></div></div>
      </div>
    </template>

    <template v-else-if="!error">

      <!-- ── KPIs ──────────────────────────────────────────────────────────── -->
      <div class="kpi-grid">

        <div class="kpi-card kpi-featured">
          <div class="kpi-icon-wrap" style="background:linear-gradient(135deg,#e91e8c,#f06292); color:white">
            <i class="pi pi-wallet"></i>
          </div>
          <div class="kpi-info">
            <p class="kpi-label">Ingresos totales</p>
            <h3 class="kpi-valor kpi-big">Bs. {{ fmtBs(totalVentas) }}</h3>
            <span class="kpi-sub">Pagos aprobados</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background:#e8eaf6; color:#3949ab">
            <i class="pi pi-list"></i>
          </div>
          <div class="kpi-info">
            <p class="kpi-label">Total pedidos</p>
            <h3 class="kpi-valor">{{ totalPedidos }}</h3>
            <span class="kpi-sub">Todos los estados</span>
          </div>
        </div>

        <div class="kpi-card kpi-click" @click="filtroEstado = 'entregado'">
          <div class="kpi-icon-wrap" style="background:#e8f5e9; color:#2e7d32">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="kpi-info">
            <p class="kpi-label">Entregados</p>
            <h3 class="kpi-valor" style="color:#2e7d32">{{ pedidosEntregados }}</h3>
            <span class="kpi-sub">{{ porcentajeEntregados }}% del total</span>
          </div>
        </div>

        <div class="kpi-card kpi-click" @click="filtroEstado = 'pendiente'">
          <div class="kpi-icon-wrap" style="background:#fff3e0; color:#e65100">
            <i class="pi pi-clock"></i>
          </div>
          <div class="kpi-info">
            <p class="kpi-label">Pendientes</p>
            <h3 class="kpi-valor" style="color:#e65100">{{ pedidosPendientes }}</h3>
            <span class="kpi-sub">Por procesar</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background:#f3e5f5; color:#7b1fa2">
            <i class="pi pi-tag"></i>
          </div>
          <div class="kpi-info">
            <p class="kpi-label">Ticket promedio</p>
            <h3 class="kpi-valor" style="color:#7b1fa2">Bs. {{ fmtBs(ticketPromedio) }}</h3>
            <span class="kpi-sub">Por pedido entregado</span>
          </div>
        </div>

      </div>

      <!-- ── Fila 2: Métodos + Estado ───────────────────────────────────────── -->
      <div class="reportes-grid">

        <!-- Ventas por método -->
        <div class="reporte-card">
          <h4 class="card-titulo">
            <i class="pi pi-credit-card"></i> Ventas por método de pago
          </h4>

          <div v-if="!ventasPorMetodo.length" class="empty-box">Sin datos de pago</div>

          <div v-else class="metodo-lista">
            <div v-for="m in ventasPorMetodo" :key="m.metodo" class="metodo-row">
              <div class="metodo-header">
                <span class="metodo-icono">{{ METODO_ICON[m.metodo] || '💰' }}</span>
                <div>
                  <p class="metodo-nombre">{{ m.metodo }}</p>
                  <p class="metodo-cant">{{ m.cantidad }} pagos</p>
                </div>
                <span class="metodo-monto">Bs. {{ fmtBs(m.total) }}</span>
              </div>
              <!-- Barra proporcional -->
              <div class="barra-wrap">
                <div
                  class="barra-fill metodo-bar"
                  :style="{ width: (m.total / maxMontoMetodo * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado de pedidos con barras -->
        <div class="reporte-card">
          <h4 class="card-titulo">
            <i class="pi pi-chart-pie"></i> Distribución de estados
          </h4>

          <!-- Donut visual simple con CSS -->
          <div class="estado-resumen">
            <div class="donut-wrap">
              <div class="donut-ring">
                <svg viewBox="0 0 36 36" class="donut-svg">
                  <!-- Fondo -->
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#fce4ec" stroke-width="3.5"/>
                  <!-- Entregados -->
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke="#4caf50" stroke-width="3.5"
                    stroke-dasharray="100" stroke-dashoffset="0"
                    :stroke-dasharray="`${porcentajeEntregados} ${100 - porcentajeEntregados}`"
                    stroke-linecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div class="donut-center">
                  <span class="donut-pct">{{ porcentajeEntregados }}%</span>
                  <span class="donut-label">entregados</span>
                </div>
              </div>
            </div>

            <div class="estado-barras">
              <div class="estado-fila">
                <div class="estado-izq">
                  <span class="estado-dot" style="background:#e65100"></span>
                  <span>Pendientes</span>
                </div>
                <div class="estado-der">
                  <span class="estado-n">{{ pedidosPendientes }}</span>
                  <div class="barra-wrap">
                    <div class="barra-fill" style="background:linear-gradient(90deg,#ff9800,#ffb74d)"
                      :style="{ width: totalPedidos > 0 ? (pedidosPendientes / totalPedidos * 100) + '%' : '0%' }">
                    </div>
                  </div>
                </div>
              </div>
              <div class="estado-fila">
                <div class="estado-izq">
                  <span class="estado-dot" style="background:#2e7d32"></span>
                  <span>Entregados</span>
                </div>
                <div class="estado-der">
                  <span class="estado-n">{{ pedidosEntregados }}</span>
                  <div class="barra-wrap">
                    <div class="barra-fill" style="background:linear-gradient(90deg,#4caf50,#81c784)"
                      :style="{ width: totalPedidos > 0 ? (pedidosEntregados / totalPedidos * 100) + '%' : '0%' }">
                    </div>
                  </div>
                </div>
              </div>
              <div class="estado-fila">
                <div class="estado-izq">
                  <span class="estado-dot" style="background:#c62828"></span>
                  <span>Cancelados</span>
                </div>
                <div class="estado-der">
                  <span class="estado-n">{{ pedidosCancelados }}</span>
                  <div class="barra-wrap">
                    <div class="barra-fill" style="background:linear-gradient(90deg,#e91e8c,#f48fb1)"
                      :style="{ width: totalPedidos > 0 ? (pedidosCancelados / totalPedidos * 100) + '%' : '0%' }">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Top Productos ──────────────────────────────────────────────────── -->
      <div v-if="topProductos.length" class="reporte-card mb-card">
        <h4 class="card-titulo">
          <i class="pi pi-star"></i> Productos más vendidos
          <span class="card-sub-hint">(pedidos entregados)</span>
        </h4>

        <div class="top-productos-grid">
          <div v-for="(p, idx) in topProductos" :key="p.nombre" class="top-prod-row">
            <div class="top-rank" :class="`rank-${idx + 1}`">
              {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}` }}
            </div>
            <div class="top-info">
              <p class="top-nombre">{{ p.nombre }}</p>
              <div class="barra-wrap">
                <div
                  class="barra-fill top-bar"
                  :style="{ width: (p.cantidad / maxCantidadTop * 100) + '%' }"
                ></div>
              </div>
            </div>
            <div class="top-stats">
              <span class="top-cant">{{ p.cantidad }} uds.</span>
              <span class="top-monto">Bs. {{ fmtBs(p.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Pedidos recientes ──────────────────────────────────────────────── -->
      <div class="reporte-card">
        <div class="card-titulo-wrap">
          <h4 class="card-titulo">
            <i class="pi pi-clock"></i> Pedidos recientes
          </h4>
          <!-- Filtro rápido sobre la tabla -->
          <div class="tabla-tabs">
            <button
              v-for="e in ['todos','pendiente','entregado','cancelado']"
              :key="e"
              class="tabla-tab"
              :class="{ activo: filtroEstado === e }"
              @click="filtroEstado = e as any"
            >
              {{ e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1) }}
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="tabla">
            <thead>
              <tr>
                <th style="width:85px">#ID</th>
                <th>Cliente</th>
                <th style="width:130px">Total</th>
                <th style="width:110px">Método</th>
                <th style="width:120px">Estado</th>
                <th style="width:130px">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in pedidosFiltrados" :key="p.id">
                <td>
                  <span class="id-badge">#{{ String(p.id).padStart(5,'0') }}</span>
                </td>
                <td>
                  <p class="td-nombre">{{ p.usuario?.cliente?.nombre || 'Venta local' }}</p>
                  <small v-if="p.usuario?.email" class="td-email">{{ p.usuario.email }}</small>
                </td>
                <td><span class="monto">Bs. {{ fmtBs(p.total) }}</span></td>
                <td>
                  <span class="metodo-badge-tabla">
                    {{ METODO_ICON[p.metodoPago] || '💰' }} {{ p.metodoPago }}
                  </span>
                </td>
                <td>
                  <span
                    class="estado-badge"
                    :style="`background:${estadoCfg(p.estado).bg}; color:${estadoCfg(p.estado).color}`"
                  >{{ p.estado }}</span>
                </td>
                <td class="fecha-cell">{{ fmtFecha(p.fechaCreacion) }}</td>
              </tr>

              <tr v-if="!pedidosFiltrados.length">
                <td colspan="6" class="empty-box">
                  Sin pedidos {{ filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
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
  margin-bottom: 1.75rem;
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

.btn-recargar:hover:not(:disabled) { background: #fce4ec; border-color: #e91e8c; }
.btn-recargar:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Error ──────────────────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffebee;
  color: #c62828;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border-left: 4px solid #e53935;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.btn-retry {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.85rem;
  background: white;
  border: 1.5px solid #ef9a9a;
  border-radius: 50px;
  color: #c62828;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover { background: #ffcdd2; }

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
.kpi-skeleton {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 16px;
  padding: 1.4rem;
  border: 1px solid #fce4ec;
}

.sk-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  flex-shrink: 0;
}

.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }

.sk-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.sk-lg { width: 60%; }
.sk-sm { width: 40%; }

.sk-card-body { min-height: 160px; }
.sk-block {
  height: 100%;
  min-height: 140px;
  border-radius: 10px;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── KPI Grid ───────────────────────────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: 2fr repeat(4, 1fr);
  gap: 1.1rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: white;
  border-radius: 18px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 3px 14px rgba(233,30,140,0.07);
  border: 1px solid #fce4ec;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card.kpi-featured {
  border-color: #f48fb1;
  background: linear-gradient(135deg, #fff0f7, #fff9fb);
  box-shadow: 0 4px 18px rgba(233,30,140,0.12);
}

.kpi-card.kpi-click {
  cursor: pointer;
}

.kpi-card.kpi-click:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(233,30,140,0.14);
  border-color: #f48fb1;
}

.kpi-icon-wrap {
  width: 46px; height: 46px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.kpi-label { font-size: 0.7rem; font-weight: 600; color: #bbb; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 0.15rem; }
.kpi-valor { font-size: 1.3rem; font-weight: 800; color: #880e4f; margin: 0 0 0.1rem; }
.kpi-big   { font-size: 1.5rem; color: #e91e8c; }
.kpi-sub   { font-size: 0.7rem; color: #ccc; }

/* ── Reportes grid (2 col) ──────────────────────────────────────────────────── */
.reportes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem;
  margin-bottom: 1.25rem;
}

/* ── Reporte card ───────────────────────────────────────────────────────────── */
.reporte-card {
  background: white;
  border-radius: 18px;
  padding: 1.4rem;
  box-shadow: 0 3px 14px rgba(233,30,140,0.07);
  border: 1px solid #fce4ec;
}

.mb-card { margin-bottom: 1.25rem; }

.card-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #c2185b;
  margin: 0 0 1.1rem;
  padding-bottom: 0.65rem;
  border-bottom: 1.5px solid #fce4ec;
}

.card-sub-hint { font-size: 0.7rem; font-weight: 500; color: #bbb; margin-left: 0.25rem; }

/* ── Métodos de pago ────────────────────────────────────────────────────────── */
.metodo-lista { display: flex; flex-direction: column; gap: 0.85rem; }

.metodo-row { display: flex; flex-direction: column; gap: 0.35rem; }

.metodo-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.metodo-icono { font-size: 1.25rem; flex-shrink: 0; }

.metodo-nombre { font-weight: 700; color: #880e4f; font-size: 0.84rem; margin: 0; text-transform: capitalize; }
.metodo-cant   { font-size: 0.7rem; color: #bbb; margin: 0; }
.metodo-monto  { margin-left: auto; font-weight: 800; color: #e91e8c; font-size: 0.9rem; white-space: nowrap; }

/* ── Barras genéricas ───────────────────────────────────────────────────────── */
.barra-wrap {
  flex: 1;
  height: 7px;
  background: #fce4ec;
  border-radius: 50px;
  overflow: hidden;
}

.barra-fill {
  height: 100%;
  border-radius: 50px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.metodo-bar { background: linear-gradient(90deg, #e91e8c, #f06292); }
.top-bar    { background: linear-gradient(90deg, #7b1fa2, #ab47bc); }

/* ── Estado donut + barras ──────────────────────────────────────────────────── */
.estado-resumen {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.donut-wrap { flex-shrink: 0; }

.donut-ring {
  position: relative;
  width: 110px; height: 110px;
}

.donut-svg { width: 100%; height: 100%; }

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-pct   { font-size: 1.3rem; font-weight: 800; color: #2e7d32; line-height: 1; }
.donut-label { font-size: 0.62rem; color: #bbb; font-weight: 600; }

.estado-barras { flex: 1; display: flex; flex-direction: column; gap: 0.85rem; }

.estado-fila {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
}

.estado-izq {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 90px;
  color: #555;
  font-weight: 500;
}

.estado-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.estado-der { display: flex; align-items: center; gap: 0.5rem; flex: 1; }

.estado-n { font-weight: 800; color: #880e4f; font-size: 0.9rem; min-width: 24px; text-align: right; }

/* ── Top productos ──────────────────────────────────────────────────────────── */
.top-productos-grid { display: flex; flex-direction: column; gap: 0.75rem; }

.top-prod-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.top-rank {
  font-size: 1.1rem;
  min-width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.top-info { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }

.top-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.84rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 0.05rem; flex-shrink: 0; }

.top-cant  { font-size: 0.72rem; color: #aaa; }
.top-monto { font-size: 0.82rem; font-weight: 800; color: #e91e8c; }

/* ── Tabla pedidos recientes ────────────────────────────────────────────────── */
.card-titulo-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.1rem;
  padding-bottom: 0.65rem;
  border-bottom: 1.5px solid #fce4ec;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-titulo-wrap .card-titulo { margin: 0; padding: 0; border: none; }

.tabla-tabs { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.tabla-tab {
  padding: 0.3rem 0.75rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #aaa;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
}

.tabla-tab:hover { border-color: #f48fb1; color: #c2185b; }
.tabla-tab.activo { background: linear-gradient(135deg,#e91e8c,#f06292); color: white; border-color: #e91e8c; }

.table-wrap { overflow-x: auto; }

.tabla { width: 100%; border-collapse: collapse; min-width: 520px; }

thead { background: linear-gradient(135deg, #e91e8c, #f06292); }

th {
  padding: 0.85rem 1rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
}

td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.875rem;
  vertical-align: middle;
}

tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #fff9fb; }

.id-badge { background: #fce4ec; color: #c2185b; font-weight: 700; font-size: 0.75rem; padding: 0.2rem 0.55rem; border-radius: 50px; white-space: nowrap; }
.td-nombre { font-weight: 700; color: #880e4f; font-size: 0.875rem; margin: 0 0 0.1rem; }
.td-email  { color: #bbb; font-size: 0.72rem; display: block; }
.monto     { font-weight: 800; color: #e91e8c; }
.fecha-cell { font-size: 0.75rem; color: #aaa; white-space: nowrap; }

.metodo-badge-tabla {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 50px;
  text-transform: capitalize;
  white-space: nowrap;
}

.estado-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
}

.empty-box {
  text-align: center;
  color: #ccc;
  font-style: italic;
  padding: 1.5rem;
  font-size: 0.875rem;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
  .kpi-card.kpi-featured { grid-column: 1 / -1; flex-direction: row; }
}

@media (max-width: 768px) {
  .admin-wrap      { padding: 1rem; }
  .kpi-grid        { grid-template-columns: repeat(2, 1fr); }
  .reportes-grid   { grid-template-columns: 1fr; }
  .estado-resumen  { flex-direction: column; align-items: flex-start; }
  .card-titulo-wrap { flex-direction: column; align-items: flex-start; }
  .page-header     { flex-direction: column; align-items: flex-start; }
}
</style>
