<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage } from '@/helpers'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type ProductoPedido = {
  id: number
  cantidad: number
  precioUnitario: number
  producto?: { id: number; nombre: string; imagenUrl?: string }
}

type Pago = {
  id: number
  metodo: string
  monto: number
  estado: string
  comprobante?: string
}

type Pedido = {
  id: number
  total: number
  estado: 'pendiente' | 'entregado' | 'cancelado'
  metodoPago: string
  tipoEnvio: string
  direccionEnvio?: string
  referencia?: string
  fechaCreacion?: string
  fechaEntrega?: string
  detallePedido?: ProductoPedido[]
  pagos?: Pago[]
  _cargandoDetalle?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const router   = useRouter()
const pedidos  = ref<Pedido[]>([])
const cargando = ref(true)
const error    = ref<string | null>(null)
const abierto  = ref<number | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Montaje
// ─────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const token = getTokenFromLocalStorage()
  if (!token) { router.replace('/login'); return }
  await cargarPedidos()
})

async function cargarPedidos() {
  cargando.value = true
  error.value    = null
  try {
    const { data } = await http.get<Pedido[]>('/pedidos/mios')
    pedidos.value  = data
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar los pedidos'
  } finally {
    cargando.value = false
  }
}

// Carga lazy del detalle al expandir
async function toggleDetalle(id: number) {
  if (abierto.value === id) { abierto.value = null; return }
  abierto.value = id

  const pedido = pedidos.value.find(p => p.id === id)
  if (!pedido || pedido.detallePedido !== undefined) return

  pedido._cargandoDetalle = true
  try {
    const { data } = await http.get(`/pedidos/${id}`)
    pedido.detallePedido  = (data.detallePedido || data.pedidosProductos || [])
    pedido.pagos          = data.pagos || []
    pedido.direccionEnvio = data.direccionEnvio || data.direccion_envio
    pedido.referencia     = data.referencia
    pedido.fechaEntrega   = data.fechaEntrega || data.fecha_entrega
  } catch {
    pedido.detallePedido = []
    pedido.pagos = []
  } finally {
    pedido._cargandoDetalle = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtFecha(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(+d)) return '—'
  return d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtBs(n?: number): string {
  return (Number(n) || 0).toFixed(2)
}

const ESTADO_CFG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pendiente: { label: 'Pendiente',  bg: '#fff3e0', color: '#e65100', icon: 'pi-clock'        },
  entregado: { label: 'Entregado',  bg: '#e8f5e9', color: '#2e7d32', icon: 'pi-check-circle' },
  cancelado: { label: 'Cancelado',  bg: '#fce4ec', color: '#c62828', icon: 'pi-times-circle' },
}

function estadoCfg(estado: string) {
  return ESTADO_CFG[estado] ?? { label: estado, bg: '#f5f5f5', color: '#888', icon: 'pi-circle' }
}

const TIPO_ENVIO_LABEL: Record<string, string> = {
  domicilio:     '🚚 Domicilio',
  delivery:      '🚚 Delivery',
  express:       '⚡ Express',
  local:         '🏪 Retiro local',
  retiro_tienda: '🏪 Retiro tienda',
}
</script>

<template>
  <section class="pedidos-page">
    <div class="pedidos-container">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="page-header">
        <span class="section-tag">Mi historial</span>
        <h2 class="page-titulo">Mis Pedidos</h2>
        <p class="page-sub">Revisa el estado y detalle de tus compras</p>
      </div>

      <!-- ── Error ───────────────────────────────────────────────────────── -->
      <div v-if="error" class="error-banner">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button class="btn-reintentar" @click="cargarPedidos">
          <i class="pi pi-refresh"></i> Reintentar
        </button>
      </div>

      <!-- ── Cargando ────────────────────────────────────────────────────── -->
      <div v-else-if="cargando" class="loading-wrap">
        <div class="loading-spinner"></div>
        <p>Cargando tus pedidos...</p>
      </div>

      <!-- ── Sin pedidos ─────────────────────────────────────────────────── -->
      <div v-else-if="pedidos.length === 0" class="vacio-card">
        <div class="vacio-icon">📦</div>
        <h4>Aún no tienes pedidos</h4>
        <p>Cuando realices una compra, aparecerá aquí con todos los detalles.</p>
        <RouterLink to="/productos" class="btn-explorar">
          🍰 Explorar productos
        </RouterLink>
      </div>

      <!-- ── Lista de pedidos ────────────────────────────────────────────── -->
      <div v-else class="pedidos-lista">
        <div
          v-for="p in pedidos"
          :key="p.id"
          class="pedido-card"
          :class="{ abierto: abierto === p.id }"
        >
          <!-- Cabecera del pedido -->
          <div class="pedido-header" @click="toggleDetalle(p.id)">

            <div class="pedido-header-left">
              <!-- Número -->
              <span class="pedido-num">#{{ String(p.id).padStart(5, '0') }}</span>

              <!-- Estado -->
              <span
                class="estado-chip"
                :style="`background:${estadoCfg(p.estado).bg}; color:${estadoCfg(p.estado).color}`"
              >
                <i :class="`pi ${estadoCfg(p.estado).icon}`"></i>
                {{ estadoCfg(p.estado).label }}
              </span>
            </div>

            <div class="pedido-header-center">
              <div class="pedido-meta-item">
                <span class="meta-label">Fecha</span>
                <span class="meta-valor">{{ fmtFecha(p.fechaCreacion) }}</span>
              </div>
              <div class="pedido-meta-item">
                <span class="meta-label">Método</span>
                <span class="meta-valor metodo-tag">{{ p.metodoPago }}</span>
              </div>
              <div class="pedido-meta-item">
                <span class="meta-label">Envío</span>
                <span class="meta-valor">{{ TIPO_ENVIO_LABEL[p.tipoEnvio] || p.tipoEnvio || '—' }}</span>
              </div>
            </div>

            <div class="pedido-header-right">
              <span class="pedido-total">Bs. {{ fmtBs(p.total) }}</span>
              <button class="btn-toggle" type="button">
                <i :class="abierto === p.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
              </button>
            </div>
          </div>

          <!-- Detalle expandible -->
          <Transition name="slide-down">
            <div v-if="abierto === p.id" class="pedido-detalle">

              <!-- Cargando detalle -->
              <div v-if="p._cargandoDetalle" class="detalle-loading">
                <div class="mini-spinner"></div>
                <span>Cargando detalle...</span>
              </div>

              <div v-else class="detalle-grid">

                <!-- Productos -->
                <div class="detalle-box">
                  <h5 class="box-titulo"><i class="pi pi-box"></i> Productos</h5>

                  <div v-if="!p.detallePedido?.length" class="box-vacio">
                    Sin productos registrados
                  </div>

                  <div v-else class="productos-lista">
                    <div v-for="item in p.detallePedido" :key="item.id" class="prod-item">
                      <div class="prod-img-wrap">
                        <img
                          v-if="item.producto?.imagenUrl"
                          :src="item.producto.imagenUrl"
                          :alt="item.producto?.nombre"
                          class="prod-img"
                        />
                        <div v-else class="prod-img-placeholder">
                          <i class="pi pi-image"></i>
                        </div>
                        <span class="prod-qty">{{ item.cantidad }}</span>
                      </div>
                      <div class="prod-info">
                        <p class="prod-nombre">{{ item.producto?.nombre || '—' }}</p>
                        <p class="prod-precio-unit">Bs. {{ fmtBs(item.precioUnitario) }} c/u</p>
                      </div>
                      <span class="prod-subtotal">Bs. {{ fmtBs(item.cantidad * item.precioUnitario) }}</span>
                    </div>
                  </div>

                  <!-- Mini total -->
                  <div v-if="p.detallePedido?.length" class="prod-total-row">
                    <span>Total</span>
                    <strong class="total-monto">Bs. {{ fmtBs(p.total) }}</strong>
                  </div>
                </div>

                <!-- Info de entrega + pago -->
                <div class="detalle-right">

                  <!-- Entrega -->
                  <div class="detalle-box">
                    <h5 class="box-titulo"><i class="pi pi-truck"></i> Entrega</h5>
                    <div class="info-lista">
                      <div class="info-fila">
                        <span>Tipo</span>
                        <span>{{ TIPO_ENVIO_LABEL[p.tipoEnvio] || p.tipoEnvio || '—' }}</span>
                      </div>
                      <div v-if="p.fechaEntrega" class="info-fila">
                        <span>Fecha estimada</span>
                        <span>{{ fmtFecha(p.fechaEntrega) }}</span>
                      </div>
                      <div v-if="p.direccionEnvio" class="info-fila">
                        <span>Dirección</span>
                        <span class="info-dir">{{ p.direccionEnvio }}</span>
                      </div>
                      <div v-if="p.referencia" class="info-fila">
                        <span>Referencia</span>
                        <span>{{ p.referencia }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Pago -->
                  <div v-if="p.pagos?.length" class="detalle-box">
                    <h5 class="box-titulo"><i class="pi pi-credit-card"></i> Pago</h5>
                    <div v-for="pg in p.pagos" :key="pg.id" class="info-lista">
                      <div class="info-fila">
                        <span>Método</span>
                        <span class="metodo-tag">{{ pg.metodo }}</span>
                      </div>
                      <div class="info-fila">
                        <span>Monto</span>
                        <strong class="total-monto">Bs. {{ fmtBs(pg.monto) }}</strong>
                      </div>
                      <div class="info-fila">
                        <span>Estado</span>
                        <span
                          class="pago-estado"
                          :class="pg.estado"
                        >{{ pg.estado.replace('_',' ') }}</span>
                      </div>
                      <div v-if="pg.comprobante" class="info-fila">
                        <span>Comprobante</span>
                        <a :href="pg.comprobante" target="_blank" class="link-comprobante">
                          <i class="pi pi-external-link"></i> Ver
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* ── Base ───────────────────────────────────────────────────────────────────── */
.pedidos-page {
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 50%, #fff 100%);
  padding: 3rem 1rem 4rem;
  min-height: 80vh;
}

.pedidos-container { max-width: 860px; margin: 0 auto; }

/* ── Header ─────────────────────────────────────────────────────────────────── */
.page-header { margin-bottom: 1.75rem; }

.section-tag {
  display: inline-block;
  background: #fce4ec;
  color: #e91e8c;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 0.28rem 0.9rem;
  border-radius: 50px;
  margin-bottom: 0.5rem;
}

.page-titulo { font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800; color: #880e4f; margin: 0 0 0.25rem; }
.page-sub    { font-size: 0.875rem; color: #f48fb1; margin: 0; }

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
}

.btn-reintentar {
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

.btn-reintentar:hover { background: #ffcdd2; }

/* ── Loading ────────────────────────────────────────────────────────────────── */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: #f48fb1;
  font-size: 0.9rem;
}

.loading-spinner {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 3px solid #fce4ec;
  border-top-color: #e91e8c;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Vacío ──────────────────────────────────────────────────────────────────── */
.vacio-card {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #fce4ec;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
}

.vacio-icon { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; display: block; }
.vacio-card h4 { font-weight: 800; color: #880e4f; margin-bottom: 0.4rem; }
.vacio-card p  { color: #aaa; margin-bottom: 1.5rem; font-size: 0.875rem; }

.btn-explorar {
  display: inline-block;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  padding: 0.8rem 1.75rem;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-explorar:hover { opacity: 0.9; transform: translateY(-2px); color: white; }

/* ── Lista de pedidos ───────────────────────────────────────────────────────── */
.pedidos-lista { display: flex; flex-direction: column; gap: 1rem; }

/* ── Pedido card ────────────────────────────────────────────────────────────── */
.pedido-card {
  background: white;
  border-radius: 20px;
  border: 1.5px solid #fce4ec;
  box-shadow: 0 3px 14px rgba(233, 30, 140, 0.07);
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.pedido-card.abierto {
  border-color: #f48fb1;
  box-shadow: 0 6px 24px rgba(233, 30, 140, 0.13);
}

/* Cabecera */
.pedido-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
  flex-wrap: wrap;
}

.pedido-header:hover { background: #fff9fb; }

.pedido-header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.pedido-num {
  font-size: 0.9rem;
  font-weight: 800;
  color: #880e4f;
  white-space: nowrap;
}

.estado-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 50px;
  white-space: nowrap;
}

.pedido-header-center {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
  flex-wrap: wrap;
}

.pedido-meta-item { display: flex; flex-direction: column; gap: 0.05rem; }
.meta-label { font-size: 0.65rem; color: #bbb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
.meta-valor { font-size: 0.8rem; font-weight: 600; color: #555; }

.metodo-tag {
  display: inline-block;
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 50px;
  text-transform: capitalize;
}

.pedido-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-left: auto;
}

.pedido-total {
  font-size: 1rem;
  font-weight: 800;
  color: #e91e8c;
  white-space: nowrap;
}

.btn-toggle {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1.5px solid #fce4ec;
  background: #fce4ec;
  color: #c2185b;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-toggle:hover { background: #f8bbd0; }

/* ── Detalle ────────────────────────────────────────────────────────────────── */
.pedido-detalle {
  border-top: 1.5px solid #fce4ec;
  padding: 1.25rem;
  background: #fff9fb;
}

.detalle-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f48fb1;
  font-size: 0.82rem;
  padding: 0.5rem;
}

.mini-spinner {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid #fce4ec;
  border-top-color: #e91e8c;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

.detalle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detalle-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Detalle box */
.detalle-box {
  background: white;
  border-radius: 14px;
  border: 1px solid #fce4ec;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.04);
}

.box-titulo {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #c2185b;
  margin: 0 0 0.85rem;
  padding-bottom: 0.6rem;
  border-bottom: 1.5px solid #fce4ec;
}

.box-vacio { font-size: 0.8rem; color: #ccc; font-style: italic; text-align: center; padding: 0.5rem; }

/* Productos en detalle */
.productos-lista { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }

.prod-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem;
  background: #fff9fb;
  border-radius: 10px;
  border: 1px solid #fce4ec;
}

.prod-img-wrap { position: relative; flex-shrink: 0; }

.prod-img,
.prod-img-placeholder {
  width: 44px; height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #fce4ec;
  display: flex; align-items: center; justify-content: center;
  background: #fce4ec; color: #f48fb1; font-size: 0.9rem;
}

.prod-qty {
  position: absolute;
  top: -5px; right: -5px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.58rem;
  font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid white;
}

.prod-info { flex: 1; min-width: 0; }
.prod-nombre     { font-weight: 700; color: #880e4f; font-size: 0.78rem; margin: 0 0 0.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prod-precio-unit { font-size: 0.68rem; color: #bbb; margin: 0; }

.prod-subtotal { font-weight: 800; color: #e91e8c; font-size: 0.8rem; white-space: nowrap; flex-shrink: 0; }

.prod-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #888;
  border-top: 1.5px solid #fce4ec;
  padding-top: 0.6rem;
}

.total-monto { color: #e91e8c; font-weight: 800; }

/* Info lista (entrega / pago) */
.info-lista { display: flex; flex-direction: column; gap: 0.5rem; }

.info-fila {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 0.78rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid #fce4ec;
  gap: 0.5rem;
}

.info-fila:last-child { border-bottom: none; padding-bottom: 0; }
.info-fila > span:first-child { color: #bbb; font-weight: 500; flex-shrink: 0; }
.info-fila > span:last-child  { color: #444; font-weight: 600; text-align: right; }

.info-dir { text-align: right; word-break: break-word; max-width: 160px; }

.pago-estado {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.18rem 0.55rem;
  border-radius: 50px;
  text-transform: capitalize;
}

.pago-estado.pendiente   { background: #fff3e0; color: #e65100; }
.pago-estado.en_revision { background: #e3f2fd; color: #1565c0; }
.pago-estado.aprobado    { background: #e8f5e9; color: #2e7d32; }
.pago-estado.rechazado   { background: #fce4ec; color: #c62828; }

.link-comprobante {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #1565c0;
  font-weight: 700;
  font-size: 0.75rem;
  text-decoration: none;
  transition: opacity 0.2s;
}

.link-comprobante:hover { opacity: 0.75; }

/* ── Transición slide ───────────────────────────────────────────────────────── */
.slide-down-enter-active { animation: slideIn 0.25s ease; }
.slide-down-leave-active { animation: slideIn 0.2s ease reverse; }

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .detalle-grid   { grid-template-columns: 1fr; }
  .pedido-header  { gap: 0.75rem; }
  .pedido-header-center { gap: 0.75rem; }
  .pedido-total   { font-size: 0.9rem; }
}
</style>
