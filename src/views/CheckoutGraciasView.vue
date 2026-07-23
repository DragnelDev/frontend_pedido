<script setup lang="ts">
import { onMounted, ref } from 'vue'
import http from '@/plugins/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const cargando = ref(true)
const pedido = ref<any>(null)
const items = ref<any[]>([])
const pago = ref<any>(null)

onMounted(async () => {
  const raw = localStorage.getItem('ultimoPedido')
  if (!raw) {
    router.replace('/')
    return
  }

  const ticket = JSON.parse(raw)
  pedido.value = {
    id: ticket.id,
    total: ticket.total,
    estado: ticket.estado,
    metodoPago: ticket.metodoPago,
    fecha: ticket.fecha,
  }

  try {
    const { data } = await http.get(`/pedidos/${ticket.id}`)
    pedido.value = {
      id: data.id,
      total: data.total,
      estado: data.estado,
      metodoPago: data.metodoPago,
      fecha: data.fechaCreacion,
      direccion: data.direccion,
      referencia: data.referencia,
      tipoEnvio: data.tipoEnvio,
    }
    items.value = (data.detallePedido || []).map((d: any) => ({
      id: d.id,
      nombre: d.producto?.nombre,
      imagenUrl: d.producto?.imagenUrl,
      precioUnit: d.precioUnitario,
      cantidad: d.cantidad,
      subtotal: d.precioUnitario * d.cantidad,
    }))
    pago.value = (data.pagos && data.pagos[0]) || null
  } catch {
    // usa datos del localStorage como fallback
  } finally {
    cargando.value = false
  }
})

function fmtFecha(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtBs(n?: number) {
  return (Number(n) || 0).toFixed(2)
}

const ESTADO_CFG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', icon: 'pi-clock', color: '#e65100', bg: '#fff3e0' },
  aprobado: { label: 'Aprobado', icon: 'pi-check-circle', color: '#2e7d32', bg: '#e8f5e9' },
  entregado: { label: 'Entregado', icon: 'pi-check-circle', color: '#1565c0', bg: '#e3f2fd' },
  cancelado: { label: 'Cancelado', icon: 'pi-times-circle', color: '#c62828', bg: '#fce4ec' },
}

function estadoCfg(estado?: string) {
  return (
    ESTADO_CFG[estado ?? ''] ?? { label: estado, icon: 'pi-circle', color: '#888', bg: '#f5f5f5' }
  )
}
</script>

<template>
  <section class="gracias-page">
    <!-- ── Confetti decorativo ────────────────────────────────────────────── -->
    <div class="confetti-wrap" aria-hidden="true">
      <span v-for="i in 18" :key="i" class="confetti-dot" :style="`--i:${i}`"></span>
    </div>

    <div class="container">
      <!-- ── Hero de confirmación ───────────────────────────────────────── -->
      <div class="hero-confirmacion">
        <div class="hero-anillo">
          <div class="hero-icono">🍰</div>
        </div>
        <h1 class="hero-titulo">¡Pedido confirmado!</h1>
        <p class="hero-subtitulo">
          Gracias por confiar en <strong>Berry Sweet</strong> 🍓<br />
          Recibirás tus delicias pronto.
        </p>

        <!-- Número de pedido destacado -->
        <div v-if="pedido" class="pedido-numero">
          <span class="pedido-label">Número de pedido</span>
          <span class="pedido-id">#{{ String(pedido.id).padStart(5, '0') }}</span>
        </div>
      </div>

      <!-- ── Estado prominente ──────────────────────────────────────────── -->
      <div v-if="pedido" class="estado-card">
        <div class="estado-left">
          <div
            class="estado-icono-wrap"
            :style="`background:${estadoCfg(pedido.estado).bg}; color:${estadoCfg(pedido.estado).color}`"
          >
            <i :class="`pi ${estadoCfg(pedido.estado).icon}`"></i>
          </div>
          <div>
            <p class="estado-etiqueta">Estado del pedido</p>
            <p class="estado-valor" :style="`color:${estadoCfg(pedido.estado).color}`">
              {{ estadoCfg(pedido.estado).label }}
            </p>
          </div>
        </div>
        <div class="estado-right">
          <p class="estado-etiqueta">Total pagado</p>
          <p class="estado-monto">Bs. {{ fmtBs(pedido.total) }}</p>
        </div>
      </div>

      <!-- ── Layout de dos columnas ─────────────────────────────────────── -->
      <div class="detalle-layout">
        <!-- Columna izquierda: productos -->
        <div class="productos-card">
          <h4 class="card-titulo"><i class="pi pi-box"></i> Productos del pedido</h4>

          <div v-if="cargando" class="cargando-wrap">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Cargando resumen...</span>
          </div>

          <div v-else-if="items.length === 0" class="vacio">
            No se encontraron productos del pedido.
          </div>

          <div v-else class="productos-lista">
            <div v-for="it in items" :key="it.id" class="producto-item">
              <div class="prod-img-wrap">
                <img :src="it.imagenUrl" :alt="it.nombre" class="prod-img" />
                <span class="prod-qty">{{ it.cantidad }}</span>
              </div>
              <div class="prod-info">
                <p class="prod-nombre">{{ it.nombre }}</p>
                <p class="prod-precio-unit">Bs. {{ fmtBs(it.precioUnit) }} c/u</p>
              </div>
              <p class="prod-subtotal">Bs. {{ fmtBs(it.subtotal) }}</p>
            </div>
          </div>

          <!-- Totales -->
          <div v-if="!cargando && items.length > 0" class="totales-mini">
            <div class="total-fila">
              <span>Subtotal</span>
              <span>Bs. {{ fmtBs(pedido?.total) }}</span>
            </div>
            <div class="total-fila">
              <span>Envío</span>
              <span class="gratis">🎁 Gratis</span>
            </div>
            <div class="total-fila total-final-fila">
              <strong>Total</strong>
              <strong class="monto-final">Bs. {{ fmtBs(pedido?.total) }}</strong>
            </div>
          </div>
        </div>

        <!-- Columna derecha: info + pago -->
        <div class="info-columna">
          <!-- Info de entrega -->
          <div class="info-card">
            <h4 class="card-titulo"><i class="pi pi-truck"></i> Entrega</h4>
            <div class="info-lista">
              <div class="info-fila">
                <i class="pi pi-calendar info-fila-icon"></i>
                <div>
                  <p class="info-fila-label">Fecha del pedido</p>
                  <p class="info-fila-valor">{{ fmtFecha(pedido?.fecha) }}</p>
                </div>
              </div>
              <div v-if="pedido?.tipoEnvio" class="info-fila">
                <i class="pi pi-map-marker info-fila-icon"></i>
                <div>
                  <p class="info-fila-label">Tipo de envío</p>
                  <p class="info-fila-valor capitalize">{{ pedido.tipoEnvio }}</p>
                </div>
              </div>
              <div v-if="pedido?.direccion" class="info-fila">
                <i class="pi pi-home info-fila-icon"></i>
                <div>
                  <p class="info-fila-label">Dirección</p>
                  <p class="info-fila-valor">{{ pedido.direccion }}</p>
                  <p v-if="pedido.referencia" class="info-fila-ref">{{ pedido.referencia }}</p>
                </div>
              </div>
              <div class="info-fila">
                <i class="pi pi-credit-card info-fila-icon"></i>
                <div>
                  <p class="info-fila-label">Método de pago</p>
                  <span class="metodo-badge">{{ pedido?.metodoPago }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Info del pago -->
          <div v-if="pago" class="info-card">
            <h4 class="card-titulo"><i class="pi pi-receipt"></i> Comprobante de pago</h4>
            <div class="info-lista">
              <div class="info-fila">
                <i class="pi pi-wallet info-fila-icon"></i>
                <div>
                  <p class="info-fila-label">Método</p>
                  <span class="metodo-badge">{{ pago.metodo }}</span>
                </div>
              </div>
              <div class="info-fila">
                <i class="pi pi-money-bill info-fila-icon"></i>
                <div>
                  <p class="info-fila-label">Monto</p>
                  <p class="info-fila-valor monto-color">Bs. {{ fmtBs(pago.monto) }}</p>
                </div>
              </div>
              <div class="info-fila">
                <div
                  class="estado-pago-dot"
                  :style="`background:${estadoCfg(pago.estado).bg}; color:${estadoCfg(pago.estado).color}`"
                >
                  <i :class="`pi ${estadoCfg(pago.estado).icon}`"></i>
                </div>
                <div>
                  <p class="info-fila-label">Estado del pago</p>
                  <p class="info-fila-valor" :style="`color:${estadoCfg(pago.estado).color}`">
                    {{ estadoCfg(pago.estado).label }}
                  </p>
                </div>
              </div>
              <div v-if="pago.comprobante" class="info-fila">
                <i class="pi pi-image info-fila-icon"></i>
                <div>
                  <p class="info-fila-label">Archivo</p>
                  <a :href="pago.comprobante" target="_blank" class="ver-link">
                    <i class="pi pi-external-link"></i> Ver comprobante
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Footer de acciones ─────────────────────────────────────────── -->
      <div class="acciones-footer">
        <RouterLink to="/" class="btn-accion primario"> 🍓 Seguir comprando </RouterLink>
        <RouterLink to="/mis-pedidos" class="btn-accion secundario">
          <i class="pi pi-list"></i> Ver mis pedidos
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Base ───────────────────────────────────────────────────────────────────── */
.gracias-page {
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 55%, #fff 100%);
  padding: 3rem 1rem 5rem;
  min-height: 80vh;
  position: relative;
  overflow: hidden;
}

/* ── Confetti ────────────────────────────────────────────────────────────────── */
.confetti-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-dot {
  position: absolute;
  width: calc(6px + (var(--i) * 2px % 8px));
  height: calc(6px + (var(--i) * 2px % 8px));
  border-radius: calc(var(--i) * 13% % 50%);
  top: calc(var(--i) * 7% % 40%);
  left: calc(var(--i) * 6.18% % 100%);
  background: hsl(calc(var(--i) * 27), 80%, 65%);
  opacity: 0.35;
  animation: confetti-float calc(4s + var(--i) * 0.3s) ease-in-out infinite alternate;
  animation-delay: calc(var(--i) * -0.4s);
}

@keyframes confetti-float {
  from {
    transform: translateY(0) rotate(0deg);
    opacity: 0.35;
  }
  to {
    transform: translateY(30px) rotate(180deg);
    opacity: 0.15;
  }
}

/* ── Hero ────────────────────────────────────────────────────────────────────── */
.hero-confirmacion {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.hero-anillo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fce4ec, #fff9fb);
  border: 3px solid #f48fb1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow:
    0 0 0 8px rgba(233, 30, 140, 0.08),
    0 8px 32px rgba(233, 30, 140, 0.18);
  animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pop-in {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.hero-icono {
  font-size: 2.8rem;
  line-height: 1;
}

.hero-titulo {
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.5rem;
  animation: slide-up 0.4s ease 0.15s both;
}

.hero-subtitulo {
  color: #999;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1.5rem;
  animation: slide-up 0.4s ease 0.25s both;
}

@keyframes slide-up {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Número de pedido */
.pedido-numero {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: 1.5px solid #fce4ec;
  border-radius: 16px;
  padding: 0.75rem 2rem;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.1);
  animation: slide-up 0.4s ease 0.35s both;
}

.pedido-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 0.2rem;
}

.pedido-id {
  font-size: 1.6rem;
  font-weight: 800;
  color: #e91e8c;
  letter-spacing: 1px;
}

/* ── Estado card ─────────────────────────────────────────────────────────────── */
.estado-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 760px;
  margin: 0 auto 1.75rem;
  background: white;
  border-radius: 20px;
  padding: 1.25rem 1.75rem;
  border: 1.5px solid #fce4ec;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
  animation: slide-up 0.4s ease 0.45s both;
}

.estado-left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.estado-icono-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.estado-etiqueta {
  font-size: 0.72rem;
  color: #bbb;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.15rem;
}

.estado-valor {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  text-transform: capitalize;
}

.estado-right {
  text-align: right;
}

.estado-monto {
  font-size: 1.5rem;
  font-weight: 800;
  color: #e91e8c;
  margin: 0;
}

/* ── Layout detalle ──────────────────────────────────────────────────────────── */
.detalle-layout {
  max-width: 760px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 1.25rem;
  align-items: start;
  animation: slide-up 0.4s ease 0.55s both;
}

/* ── Card base ──────────────────────────────────────────────────────────────── */
.productos-card,
.info-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid #fce4ec;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.06);
}

.info-columna {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #c2185b;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #fce4ec;
}

/* ── Productos ──────────────────────────────────────────────────────────────── */
.cargando-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #f48fb1;
  font-size: 0.875rem;
}

.vacio {
  text-align: center;
  color: #ccc;
  font-style: italic;
  padding: 1.5rem;
}

.productos-lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.producto-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem;
  background: #fff9fb;
  border-radius: 12px;
  border: 1px solid #fce4ec;
}

.prod-img-wrap {
  position: relative;
  flex-shrink: 0;
}

.prod-img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  border: 1.5px solid #fce4ec;
  display: block;
}

.prod-qty {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.prod-info {
  flex: 1;
  min-width: 0;
}

.prod-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.84rem;
  margin: 0 0 0.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prod-precio-unit {
  font-size: 0.72rem;
  color: #bbb;
  margin: 0;
}

.prod-subtotal {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.875rem;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Totales mini ───────────────────────────────────────────────────────────── */
.totales-mini {
  border-top: 2px solid #fce4ec;
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.total-fila {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #888;
}

.gratis {
  color: #2e7d32;
  font-weight: 600;
}

.total-final-fila {
  font-size: 0.95rem;
  color: #880e4f;
  padding-top: 0.4rem;
  border-top: 1px solid #fce4ec;
  margin-top: 0.2rem;
}

.monto-final {
  color: #e91e8c;
}

/* ── Info lista ─────────────────────────────────────────────────────────────── */
.info-lista {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.info-fila {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-fila-icon {
  font-size: 0.9rem;
  color: #f48fb1;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.estado-pago-dot {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.info-fila-label {
  font-size: 0.7rem;
  color: #bbb;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 0 0 0.15rem;
}

.info-fila-valor {
  font-size: 0.84rem;
  font-weight: 600;
  color: #444;
  margin: 0;
}

.info-fila-ref {
  font-size: 0.75rem;
  color: #bbb;
  margin: 0.15rem 0 0;
  font-style: italic;
}

.capitalize {
  text-transform: capitalize;
}

.monto-color {
  color: #e91e8c !important;
  font-weight: 800 !important;
}

.metodo-badge {
  display: inline-block;
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 50px;
  text-transform: capitalize;
}

.ver-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #1565c0;
  font-weight: 600;
  font-size: 0.82rem;
  text-decoration: none;
  transition: opacity 0.2s;
}

.ver-link:hover {
  opacity: 0.75;
}

/* ── Footer de acciones ──────────────────────────────────────────────────────── */
.acciones-footer {
  max-width: 760px;
  margin: 2rem auto 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  animation: slide-up 0.4s ease 0.65s both;
}

.btn-accion {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.925rem;
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.btn-accion.primario {
  color: white;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  box-shadow: 0 4px 18px rgba(233, 30, 140, 0.3);
}

.btn-accion.primario:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  color: white;
}

.btn-accion.secundario {
  color: #e91e8c;
  background: white;
  border: 1.5px solid #f8bbd0;
}

.btn-accion.secundario:hover {
  background: #fce4ec;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 680px) {
  .detalle-layout {
    grid-template-columns: 1fr;
  }
  .estado-card {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  .estado-right {
    text-align: left;
  }
}
</style>
