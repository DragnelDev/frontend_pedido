<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { cocinaService } from '@/servicios/cocinaService'
import type { EstadoCocina, PedidoCocina } from '@/models/cocina'

const pedidos = ref<PedidoCocina[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)
const actualizandoIds = ref(new Set<number>())

let intervalo: ReturnType<typeof setInterval> | null = null
let solicitudEnCurso = false

function mensajeError(error: unknown, predeterminado: string): string {
  if (!error || typeof error !== 'object' || !('response' in error)) return predeterminado
  const response = error.response
  if (!response || typeof response !== 'object' || !('data' in response)) return predeterminado
  const data = response.data
  if (!data || typeof data !== 'object' || !('message' in data)) return predeterminado
  const message = data.message
  if (typeof message === 'string') return message
  if (Array.isArray(message) && message.every((part) => typeof part === 'string')) {
    return message.join(', ')
  }
  return predeterminado
}

async function cargarTablero() {
  if (solicitudEnCurso || actualizandoIds.value.size > 0) return
  solicitudEnCurso = true
  error.value = null
  try {
    pedidos.value = await cocinaService.tablero()
  } catch (e: unknown) {
    error.value = mensajeError(e, 'No se pudo cargar el tablero de cocina')
  } finally {
    cargando.value = false
    solicitudEnCurso = false
  }
}

onMounted(() => {
  cargarTablero()
  // Refresco automático cada 30s para que la pantalla de cocina se
  // mantenga al día sin necesidad de recargar manualmente.
  intervalo = setInterval(cargarTablero, 30000)
})

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo)
})

async function cambiarEstado(pedido: PedidoCocina, nuevoEstado: EstadoCocina) {
  if (actualizandoIds.value.has(pedido.id)) return
  actualizandoIds.value = new Set(actualizandoIds.value).add(pedido.id)
  error.value = null
  try {
    const actualizado = await cocinaService.cambiarEstado(pedido.id, nuevoEstado)
    if (nuevoEstado === 'entregado') {
      // Sale del tablero de cocina una vez entregado
      pedidos.value = pedidos.value.filter((p) => p.id !== pedido.id)
    } else {
      const idx = pedidos.value.findIndex((p) => p.id === pedido.id)
      if (idx !== -1) pedidos.value[idx] = actualizado
    }
  } catch (e: unknown) {
    error.value = mensajeError(e, 'No se pudo actualizar el estado del pedido')
  } finally {
    const actualizando = new Set(actualizandoIds.value)
    actualizando.delete(pedido.id)
    actualizandoIds.value = actualizando
  }
}

function nombreCliente(pedido: PedidoCocina): string {
  const c = pedido.usuario?.cliente
  if (!c) return 'Cliente eventual'
  return [c.nombre, c.apellidoPaterno].filter(Boolean).join(' ')
}

function horaEntrega(fecha: string): string {
  return new Date(fecha).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pagoAprobado(pedido: PedidoCocina): boolean {
  return pedido.pagos?.[0]?.estado === 'aprobado'
}

function mensajeBloqueoPago(pedido: PedidoCocina): string | null {
  const estadoPago = pedido.pagos?.[0]?.estado
  if (estadoPago === 'aprobado') return null
  if (!estadoPago) {
    return 'No hay un pago registrado. Verifica el pago en la pantalla de Pagos para continuar.'
  }
  if (estadoPago === 'en_revision') {
    return 'El comprobante está en revisión. Aprueba el pago en Pagos para continuar.'
  }
  if (estadoPago === 'pendiente') {
    return 'El pago está pendiente de aprobación. Apruébalo en Pagos para continuar.'
  }
  if (estadoPago === 'rechazado') {
    return 'El pago fue rechazado. El pedido no puede avanzar.'
  }
  return `El pago está en estado "${estadoPago}". Debe aprobarse antes de continuar.`
}

function esRetiroLocal(tipoEnvio?: string | null): boolean {
  const tipo = (tipoEnvio || '').trim().toLowerCase()
  return tipo === 'local' || tipo.includes('retiro')
}

const pendientes = computed(() => pedidos.value.filter((p) => p.estado === 'pendiente'))
const enPreparacion = computed(() => pedidos.value.filter((p) => p.estado === 'en_preparacion'))
const listos = computed(() => pedidos.value.filter((p) => p.estado === 'listo'))

const columnas = computed(() => [
  { estado: 'pendiente' as const, titulo: 'Pendientes', pedidos: pendientes.value },
  { estado: 'en_preparacion' as const, titulo: 'En preparación', pedidos: enPreparacion.value },
  { estado: 'listo' as const, titulo: 'Listos para entrega', pedidos: listos.value },
])
</script>

<template>
  <div class="admin-wrap">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon"><i class="pi pi-clock"></i></div>
        <div>
          <h2 class="page-titulo">Cocina / Producción</h2>
          <p class="page-sub">Gestión de preparación de pedidos realizados por los clientes</p>
        </div>
      </div>
      <div class="header-actions">
        <button
          class="btn-recargar"
          @click="cargarTablero"
          :disabled="cargando || actualizandoIds.size > 0"
          title="Recargar tablero"
          aria-label="Recargar tablero"
        >
          <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
      </div>
    </div>

    <p v-if="error" class="admin-alert-error">
      <i class="pi pi-exclamation-circle"></i> {{ error }}
    </p>

    <div class="page-content cocina-content">
      <template v-if="cargando">
        <div class="cocina-loading"><i class="pi pi-spin pi-spinner"></i> Cargando pedidos...</div>
      </template>

      <template v-else-if="pedidos.length === 0">
        <div class="cocina-vacio">
          <i class="pi pi-check-circle"></i>
          <p>No hay pedidos pendientes de preparación</p>
        </div>
      </template>

      <div v-else class="tablero-cocina">
        <section v-for="columna in columnas" :key="columna.estado" class="columna-cocina">
          <header class="columna-header" :class="columna.estado">
            <div>
              <h3>{{ columna.titulo }}</h3>
              <span>{{ columna.pedidos.length }} pedidos</span>
            </div>
            <strong>{{ columna.pedidos.length }}</strong>
          </header>

          <div v-if="!columna.pedidos.length" class="columna-vacia">Sin pedidos en esta etapa</div>

          <article v-for="p in columna.pedidos" :key="p.id" class="pedido-card" :class="p.estado">
            <header class="pedido-header">
              <strong class="pedido-id">Pedido #{{ p.id }}</strong>
              <span class="pedido-hora" :title="`Entrega: ${horaEntrega(p.fechaEntrega)}`">
                <i class="pi pi-clock"></i> {{ horaEntrega(p.fechaEntrega) }}
              </span>
            </header>

            <div class="pedido-cliente">
              <i class="pi pi-user"></i>
              <h4>{{ nombreCliente(p) }}</h4>
            </div>

            <div v-if="mensajeBloqueoPago(p)" class="pedido-alerta-pago" role="status">
              <i class="pi pi-lock"></i>
              <span>{{ mensajeBloqueoPago(p) }}</span>
            </div>

            <div v-if="esRetiroLocal(p.tipoEnvio)" class="pedido-retiro-local">
              <i class="pi pi-home"></i>
              <strong>Retiro en local</strong>
            </div>

            <div class="productos-lista">
              <div v-for="d in p.detallePedido" :key="d.id" class="producto-cocina">
                <img
                  v-if="d.producto?.imagenUrl"
                  class="producto-imagen"
                  :src="d.producto.imagenUrl"
                  :alt="d.producto.nombre"
                  loading="lazy"
                />
                <div v-else class="producto-imagen-placeholder" aria-hidden="true">
                  <i class="pi pi-image"></i>
                </div>
                <div class="producto-info">
                  <strong>{{ d.producto?.nombre || 'Producto' }}</strong>
                </div>
                <span class="producto-cantidad">×{{ d.cantidad }}</span>
                <div v-if="d.dedicatoria?.trim()" class="dedicatoria-cocina">
                  <strong><i class="pi pi-pencil"></i> Nota para el producto</strong>
                  <p>{{ d.dedicatoria }}</p>
                </div>
              </div>
            </div>

            <p v-if="p.direccionEnvio && !esRetiroLocal(p.tipoEnvio)" class="pedido-direccion">
              <i class="pi pi-map-marker"></i> {{ p.direccionEnvio }}
            </p>

            <footer class="pedido-footer">
              <button
                v-if="p.estado === 'pendiente'"
                class="btn-estado btn-prep"
                :disabled="actualizandoIds.has(p.id) || !pagoAprobado(p)"
                @click="cambiarEstado(p, 'en_preparacion')"
              >
                <i :class="actualizandoIds.has(p.id) ? 'pi pi-spin pi-spinner' : 'pi pi-play'"></i>
                {{
                  actualizandoIds.has(p.id)
                    ? 'Guardando...'
                    : pagoAprobado(p)
                      ? 'Iniciar preparación'
                      : 'Esperando aprobación'
                }}
              </button>
              <button
                v-else-if="p.estado === 'en_preparacion'"
                class="btn-estado btn-ready"
                :disabled="actualizandoIds.has(p.id) || !pagoAprobado(p)"
                @click="cambiarEstado(p, 'listo')"
              >
                <i :class="actualizandoIds.has(p.id) ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{
                  actualizandoIds.has(p.id)
                    ? 'Guardando...'
                    : pagoAprobado(p)
                      ? 'Marcar listo'
                      : 'Esperando aprobación'
                }}
              </button>
              <button
                v-else-if="p.estado === 'listo'"
                class="btn-estado btn-entregar"
                :disabled="actualizandoIds.has(p.id) || !pagoAprobado(p)"
                @click="cambiarEstado(p, 'entregado')"
              >
                <i :class="actualizandoIds.has(p.id) ? 'pi pi-spin pi-spinner' : 'pi pi-send'"></i>
                {{
                  actualizandoIds.has(p.id)
                    ? 'Guardando...'
                    : pagoAprobado(p)
                      ? 'Confirmar entrega'
                      : 'Esperando aprobación'
                }}
              </button>
            </footer>
          </article>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;
}
.page-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.page-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: #fff;
  font-size: 1.2rem;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
}
.page-titulo {
  margin: 0 0 0.2rem;
  color: #880e4f;
  font-size: 1.5rem;
  font-weight: 800;
}
.page-sub {
  margin: 0;
  color: #f48fb1;
  font-size: 0.85rem;
}
.btn-recargar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1.5px solid #f8bbd0;
  border-radius: 12px;
  background: #fff;
  color: #c2185b;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.btn-recargar:hover:not(:disabled) {
  border-color: #e91e8c;
  background: #fce4ec;
}
.btn-recargar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-content {
  overflow: hidden;
  border: 1px solid #fce4ec;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
}
.cocina-content {
  padding: 1rem;
}
.cocina-loading,
.cocina-vacio,
.columna-vacia {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: #737373;
}
.cocina-loading,
.cocina-vacio {
  min-height: 220px;
  flex-direction: column;
}
.cocina-loading i,
.cocina-vacio i {
  font-size: 1.6rem;
  color: #e91e8c;
}
.cocina-vacio p {
  margin: 0;
}
.tablero-cocina {
  display: grid;
  grid-template-columns: repeat(3, minmax(280px, 1fr));
  align-items: start;
  gap: 1rem;
}
.columna-cocina {
  display: grid;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.8rem;
  background: #fff9fb;
  border: 1px solid #fce4ec;
  border-radius: 12px;
}
.columna-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.2rem 0.75rem;
  border-bottom: 2px solid #f8bbd0;
}
.columna-header h3 {
  margin: 0;
  color: #880e4f;
  font-size: 1rem;
}
.columna-header span {
  color: #b06b85;
  font-size: 0.78rem;
}
.columna-header > strong {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fce4ec;
  color: #c2185b;
}
.columna-header.pendiente {
  border-color: #e91e8c;
}
.columna-header.en_preparacion {
  border-color: #ffa726;
}
.columna-header.listo {
  border-color: #66a36e;
}
.columna-vacia {
  min-height: 92px;
  color: #b06b85;
  font-size: 0.84rem;
}
.pedido-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
  background: #fff;
  border: 1px solid #f8bbd0;
  border-left: 4px solid #e91e8c;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(233, 30, 140, 0.06);
}
.pedido-card.en_preparacion {
  border-color: #ffe082;
  border-left-color: #ffa726;
  background: #fffde7;
}
.pedido-card.listo {
  border-color: #a5d6a7;
  border-left-color: #2e7d32;
  background: #f1f8f2;
}
.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #fce4ec;
}
.pedido-id {
  color: #880e4f;
  font-size: 0.93rem;
}
.pedido-hora {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #888;
  font-size: 0.76rem;
}
.pedido-cliente {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #c2185b;
}
.pedido-cliente h4 {
  margin: 0;
  color: #333;
  font-size: 0.9rem;
}
.pedido-alerta-pago {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.7rem;
  border: 1px solid #ffe0b2;
  border-left: 4px solid #ffa726;
  border-radius: 8px;
  background: #fff8e1;
  color: #8a4b00;
  font-size: 0.78rem;
  line-height: 1.4;
}
.pedido-alerta-pago i {
  margin-top: 0.1rem;
  color: #e65100;
}
.pedido-retiro-local {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #bbdefb;
  border-radius: 8px;
  background: #e3f2fd;
  color: #1565c0;
  font-size: 0.82rem;
}
.productos-lista {
  display: grid;
  gap: 0.55rem;
}
.producto-cocina {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem;
  background: #fff9fb;
  border: 1px solid #fce4ec;
  border-radius: 8px;
}
.producto-imagen,
.producto-imagen-placeholder {
  width: 104px;
  height: 104px;
  border-radius: 6px;
}
.producto-imagen {
  object-fit: cover;
}
.producto-imagen-placeholder {
  display: grid;
  place-items: center;
  background: #fce4ec;
  color: #f48fb1;
}
.producto-info {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}
.producto-info > strong {
  color: #880e4f;
  font-size: 0.83rem;
  overflow-wrap: anywhere;
}
.producto-cantidad {
  align-self: start;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  background: #fce4ec;
  color: #c2185b;
  font-size: 0.82rem;
  font-weight: 700;
}
.dedicatoria-cocina {
  grid-column: 1 / -1;
  padding: 0.65rem 0.75rem;
  background: #fff3e0;
  border-left: 4px solid #ffa726;
  border-radius: 4px;
  color: #e65100;
  overflow-wrap: anywhere;
}
.dedicatoria-cocina strong {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  text-transform: uppercase;
}
.dedicatoria-cocina p {
  margin: 0.35rem 0 0;
  color: #bf5700;
  font-size: 0.95rem;
  font-weight: 700;
}
.pedido-direccion {
  display: flex;
  gap: 0.4rem;
  margin: 0;
  color: #888;
  font-size: 0.77rem;
}
.pedido-footer {
  margin-top: auto;
  padding-top: 0.25rem;
}
.btn-estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 42px;
  padding: 0.55rem 0.75rem;
  border: 0;
  border-radius: 5px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-prep {
  background: #ffa726;
}
.btn-ready {
  background: #2e7d32;
}
.btn-entregar {
  background: #1565c0;
}
.btn-estado:disabled {
  opacity: 0.65;
  cursor: wait;
}
@media (max-width: 1050px) {
  .tablero-cocina {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .admin-wrap {
    padding: 1rem;
  }
  .page-header {
    margin-bottom: 1.25rem;
  }
  .cocina-content {
    padding: 0.65rem;
  }
}
</style>
