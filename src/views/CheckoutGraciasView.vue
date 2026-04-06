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
  if (!raw) { router.replace('/'); return }

  const ticket = JSON.parse(raw)
  pedido.value = {
    id: ticket.id, total: ticket.total,
    estado: ticket.estado, metodoPago: ticket.metodoPago, fecha: ticket.fecha,
  }

  try {
    const { data } = await http.get(`/pedidos/${ticket.id}`)
    pedido.value = {
      id: data.id, total: data.total, estado: data.estado,
      metodoPago: data.metodoPago, fecha: data.fechaCreacion,
      direccion: data.direccion, referencia: data.referencia, tipoEnvio: data.tipoEnvio,
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
  } finally {
    cargando.value = false
  }
})

function fmtFecha(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}

function fmtBs(n?: number) {
  return (Number(n) || 0).toFixed(2)
}
</script>

<template>
  <section class="gracias-page">
    <div class="container">
      <!-- Header -->
      <div class="gracias-header">
        <div class="gracias-icon">🍰</div>
        <h2>¡Gracias por tu compra!</h2>
        <p>Tu pedido fue registrado correctamente en <strong>Berry Sweet 🍓</strong></p>
      </div>

      <!-- Datos del pedido -->
      <div class="info-panel">
        <h4 class="panel-titulo"><i class="pi pi-shopping-bag"></i> Detalles del pedido</h4>
        <div class="info-grid">
          <div class="info-row"><span>Pedido #</span><strong>#{{ pedido?.id }}</strong></div>
          <div class="info-row"><span>Total</span><strong class="monto">Bs. {{ fmtBs(pedido?.total) }}</strong></div>
          <div class="info-row"><span>Fecha</span><span>{{ fmtFecha(pedido?.fecha) }}</span></div>
          <div class="info-row"><span>Método de pago</span><span class="metodo-badge">{{ pedido?.metodoPago }}</span></div>
          <div class="info-row">
            <span>Estado</span>
            <span class="estado-badge" :class="pedido?.estado">{{ pedido?.estado }}</span>
          </div>
          <div v-if="pedido?.direccion" class="info-row">
            <span>Envío</span>
            <span>{{ pedido?.tipoEnvio }} — {{ pedido?.direccion }}
              <span v-if="pedido?.referencia"> ({{ pedido?.referencia }})</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Productos -->
      <div class="panel-titulo-standalone">
        <h3><i class="pi pi-box"></i> Productos del pedido</h3>
      </div>

      <div v-if="cargando" class="cargando">
        <i class="pi pi-spin pi-spinner"></i> Cargando resumen...
      </div>

      <div v-else>
        <div v-if="items.length === 0" class="vacio">No se encontraron productos del pedido.</div>

        <div v-else class="productos-lista">
          <div v-for="it in items" :key="it.id" class="producto-item">
            <img :src="it.imagenUrl" alt="" class="producto-img" />
            <div class="producto-info">
              <div class="producto-nombre">{{ it.nombre }}</div>
              <div class="producto-detalle">
                Cant: {{ it.cantidad }} · Precio: Bs. {{ fmtBs(it.precioUnit) }}
              </div>
            </div>
            <div class="producto-monto">Bs. {{ fmtBs(it.subtotal) }}</div>
          </div>
        </div>
      </div>

      <!-- Pago -->
      <div v-if="pago" class="info-panel">
        <h4 class="panel-titulo"><i class="pi pi-credit-card"></i> Información de pago</h4>
        <div class="info-grid">
          <div class="info-row"><span>Método</span><span class="metodo-badge">{{ pago.metodo }}</span></div>
          <div class="info-row"><span>Monto</span><strong class="monto">Bs. {{ fmtBs(pago.monto) }}</strong></div>
          <div v-if="pago.maskedCard" class="info-row"><span>Tarjeta</span><span>{{ pago.maskedCard }}</span></div>
          <div class="info-row">
            <span>Estado</span>
            <span class="estado-badge" :class="pago.estado">{{ pago.estado }}</span>
          </div>
          <div v-if="pago.comprobante" class="info-row">
            <span>Comprobante</span>
            <a :href="pago.comprobante" target="_blank" class="ver-link">
              <i class="pi pi-external-link"></i> Ver comprobante
            </a>
          </div>
        </div>
      </div>

      <!-- Botón -->
      <div class="gracias-footer">
        <RouterLink to="/" class="btn-inicio">
          🍓 Volver al inicio
        </RouterLink>
        <RouterLink to="/mis-pedidos" class="btn-pedidos">
          📦 Ver mis pedidos
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.gracias-page {
  padding: 3rem 1rem;
  background: linear-gradient(180deg, #fff9fb 0%, #fce4ec 100%);
  min-height: 80vh;
}

/* Header */
.gracias-header {
  text-align: center;
  margin-bottom: 2rem;
}

.gracias-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1rem;
  box-shadow: 0 8px 24px rgba(233, 30, 140, 0.3);
}

.gracias-header h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #880e4f;
  margin-bottom: 0.4rem;
}

.gracias-header p {
  color: #ad1457;
  opacity: 0.8;
}

/* Panels */
.info-panel {
  max-width: 720px;
  margin: 0 auto 1.5rem;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #fce4ec;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.08);
}

.panel-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #c2185b;
  margin: 0 0 1rem;
  padding-bottom: 0.65rem;
  border-bottom: 2px solid #fce4ec;
}

.panel-titulo-standalone {
  max-width: 720px;
  margin: 0 auto 1rem;
}

.panel-titulo-standalone h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #c2185b;
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
  font-size: 0.875rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #fce4ec;
}

.info-row:last-child { border-bottom: none; }

.info-row span:first-child { color: #aaa; font-weight: 500; }

.monto { font-weight: 800; color: #e91e8c; font-size: 1rem; }

.metodo-badge {
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 50px;
  text-transform: capitalize;
}

.estado-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 50px;
  text-transform: capitalize;
}

.estado-badge.pendiente { background: #fff3e0; color: #e65100; }
.estado-badge.entregado { background: #e8f5e9; color: #2e7d32; }
.estado-badge.cancelado { background: #fce4ec; color: #c62828; }
.estado-badge.aprobado { background: #e8f5e9; color: #2e7d32; }

.ver-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #1565c0;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
}

/* Productos */
.cargando {
  text-align: center;
  padding: 2rem;
  color: #f48fb1;
  font-size: 0.9rem;
}

.vacio {
  text-align: center;
  color: #ccc;
  font-style: italic;
  padding: 1.5rem;
}

.productos-lista {
  max-width: 720px;
  margin: 0 auto 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.producto-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #fce4ec;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.06);
}

.producto-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #fce4ec;
  flex-shrink: 0;
}

.producto-info { flex: 1; }

.producto-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.producto-detalle { font-size: 0.8rem; color: #aaa; }

.producto-monto {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.95rem;
  white-space: nowrap;
}

/* Footer */
.gracias-footer {
  max-width: 720px;
  margin: 2rem auto 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-inicio {
  display: inline-block;
  padding: 0.85rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-inicio:hover {
  transform: translateY(-2px);
  opacity: 0.9;
  color: white;
}

.btn-pedidos {
  display: inline-block;
  padding: 0.85rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  color: #e91e8c;
  background: white;
  border: 1.5px solid #f8bbd0;
  transition: background 0.2s;
}

.btn-pedidos:hover {
  background: #fce4ec;
}
</style>
