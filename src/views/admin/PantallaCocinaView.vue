<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { cocinaService } from '@/servicios/cocinaService'
import type { EstadoCocina, PedidoCocina } from '@/models/cocina'

const pedidos = ref<PedidoCocina[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)
const actualizandoId = ref<number | null>(null)

let intervalo: ReturnType<typeof setInterval> | null = null

async function cargarTablero() {
  error.value = null
  try {
    pedidos.value = await cocinaService.tablero()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el tablero de cocina'
  } finally {
    cargando.value = false
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
  actualizandoId.value = pedido.id
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
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo actualizar el estado del pedido'
  } finally {
    actualizandoId.value = null
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

function resumenProductos(pedido: PedidoCocina): string {
  return pedido.detallePedido.map((d) => `${d.cantidad}x ${d.producto?.nombre}`).join(', ')
}

const pendientes = computed(() => pedidos.value.filter((p) => p.estado === 'pendiente'))
const enPreparacion = computed(() => pedidos.value.filter((p) => p.estado === 'en_preparacion'))
const listos = computed(() => pedidos.value.filter((p) => p.estado === 'listo'))
</script>

<template>
  <div class="admin-wrap">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon"><i class="pi pi-clock"></i></div>
        <div>
          <h2 class="page-titulo">Cocina / Producción</h2>
          <p class="page-sub">Gestión de preparación de pedidos realizados por los clientes</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-recargar" @click="cargarTablero" :disabled="cargando" title="Recargar">
          <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
      </div>
    </div>

    <p v-if="error" class="admin-alert-error">
      <i class="pi pi-exclamation-circle"></i> {{ error }}
    </p>

    <div class="resumen-bar">
      <span class="resumen-item pendiente"
        ><strong>{{ pendientes.length }}</strong> Pendientes</span
      >
      <span class="resumen-item preparacion"
        ><strong>{{ enPreparacion.length }}</strong> En Preparación</span
      >
      <span class="resumen-item listo"
        ><strong>{{ listos.length }}</strong> Listos para Entrega</span
      >
    </div>

    <template v-if="cargando">
      <div class="admin-empty-state"><i class="pi pi-spin pi-spinner"></i></div>
    </template>

    <template v-else-if="pedidos.length === 0">
      <div class="admin-empty-state">
        <i class="pi pi-check-circle"></i>
        <p>No hay pedidos pendientes de preparación</p>
      </div>
    </template>

    <div v-else class="pedidos-grid">
      <div v-for="p in pedidos" :key="p.id" class="pedido-card" :class="p.estado">
        <div class="pedido-header">
          <span class="pedido-id">#{{ p.id }}</span>
          <span class="pedido-hora"
            ><i class="pi pi-clock"></i> {{ horaEntrega(p.fechaEntrega) }}</span
          >
        </div>
        <div class="pedido-body">
          <h4>{{ nombreCliente(p) }}</h4>
          <p class="detalles">{{ resumenProductos(p) }}</p>
          <div
            v-for="d in p.detallePedido.filter((d) => d.dedicatoria)"
            :key="d.id"
            class="nota-box"
          >
            <strong><i class="pi pi-pencil"></i> {{ d.producto?.nombre }}:</strong>
            {{ d.dedicatoria }}
          </div>
        </div>
        <div class="pedido-footer">
          <button
            v-if="p.estado === 'pendiente'"
            class="btn-prep"
            :disabled="actualizandoId === p.id"
            @click="cambiarEstado(p, 'en_preparacion')"
          >
            {{ actualizandoId === p.id ? 'Actualizando...' : 'Comenzar Preparación' }}
          </button>
          <button
            v-if="p.estado === 'en_preparacion'"
            class="btn-ready"
            :disabled="actualizandoId === p.id"
            @click="cambiarEstado(p, 'listo')"
          >
            <i class="pi pi-check"></i>
            {{ actualizandoId === p.id ? 'Actualizando...' : 'Marcar como Listo' }}
          </button>
          <button
            v-if="p.estado === 'listo'"
            class="btn-entregar"
            :disabled="actualizandoId === p.id"
            @click="cambiarEstado(p, 'entregado')"
          >
            <i class="pi pi-send"></i>
            {{ actualizandoId === p.id ? 'Actualizando...' : 'Marcar como Entregado' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resumen-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.resumen-item {
  padding: 0.5rem 1.1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
}
.resumen-item strong {
  font-size: 1rem;
  margin-right: 0.3rem;
}
.resumen-item.pendiente {
  background: #ffebee;
  color: #c62828;
}
.resumen-item.preparacion {
  background: #fff8e1;
  color: #e65100;
}
.resumen-item.listo {
  background: #e8f5e9;
  color: #2e7d32;
}

.pedidos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}
.pedido-card {
  background: white;
  border-radius: 16px;
  border: 1.5px solid #f8bbd0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.pedido-card.en_preparacion {
  border-color: #ffe082;
  background: #fffde7;
}
.pedido-card.listo {
  border-color: #a5d6a7;
  background: #f1f8f2;
}
.pedido-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  color: #880e4f;
  border-bottom: 1px dashed #f8bbd0;
  padding-bottom: 0.5rem;
}
.pedido-hora {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
}
.pedido-body {
  margin: 0.8rem 0;
}
.pedido-body h4 {
  margin: 0 0 0.4rem 0;
  color: #333;
}
.detalles {
  font-size: 0.95rem;
  font-weight: 600;
  color: #c2185b;
  margin: 0;
}
.nota-box {
  background: #fff3e0;
  border-left: 3px solid #ffa726;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-top: 0.6rem;
  color: #e65100;
}
.btn-prep,
.btn-ready,
.btn-entregar {
  width: 100%;
  border: none;
  padding: 0.6rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  color: white;
}
.btn-prep:disabled,
.btn-ready:disabled,
.btn-entregar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>
