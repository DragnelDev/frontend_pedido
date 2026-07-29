<script setup lang="ts">
import { ref } from 'vue'

const pedidosCocina = ref([
  {
    id: 'PED-104',
    cliente: 'Ana Martínez',
    horaEntrega: '15:30',
    detalles: 'Torta de Frutilla 1kg',
    notaCliente: 'Escribir con crema: "¡Feliz Cumpleaños Mamá!"',
    estado: 'PENDIENTE',
  },
  {
    id: 'PED-105',
    cliente: 'Roberto Gómez',
    horaEntrega: '16:00',
    detalles: '12 Cupcakes de Chocolate',
    notaCliente: 'Sin Chispas de chocolate',
    estado: 'EN_PREPARACION',
  },
])

function cambiarEstado(pedido: any, nuevoEstado: string) {
  pedido.estado = nuevoEstado
}
</script>

<template>
  <div class="modulo-container">
    <div class="header-section">
      <h2>🧑‍🍳 Tablero de Producción / Repostería</h2>
      <p>Gestión de preparación de pedidos realizados por los clientes</p>
    </div>

    <div class="pedidos-grid">
      <div
        v-for="p in pedidosCocina"
        :key="p.id"
        class="pedido-card"
        :class="p.estado.toLowerCase()"
      >
        <div class="pedido-header">
          <span class="pedido-id">#{{ p.id }}</span>
          <span class="pedido-hora">⏰ {{ p.horaEntrega }}</span>
        </div>
        <div class="pedido-body">
          <h4>{{ p.cliente }}</h4>
          <p class="detalles">{{ p.detalles }}</p>
          <div v-if="p.notaCliente" class="nota-box">
            <strong>📝 Nota:</strong> {{ p.notaCliente }}
          </div>
        </div>
        <div class="pedido-footer">
          <button
            v-if="p.estado === 'PENDIENTE'"
            class="btn-prep"
            @click="cambiarEstado(p, 'EN_PREPARACION')"
          >
            Comenzar Preparación
          </button>
          <button
            v-if="p.estado === 'EN_PREPARACION'"
            class="btn-ready"
            @click="cambiarEstado(p, 'LISTO')"
          >
            ✓ Marcar como Listo
          </button>
          <span v-if="p.estado === 'LISTO'" class="badge-listo">✨ Listo para Entrega</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modulo-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.header-section h2 {
  margin: 0;
  color: #880e4f;
}
.header-section p {
  margin: 0 0 1.5rem 0;
  color: #888;
  font-size: 0.85rem;
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
.pedido-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  color: #880e4f;
  border-bottom: 1px dashed #f8bbd0;
  padding-bottom: 0.5rem;
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
.btn-prep {
  width: 100%;
  background: #ffa726;
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.btn-ready {
  width: 100%;
  background: #2e7d32;
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.badge-listo {
  display: block;
  text-align: center;
  color: #2e7d32;
  font-weight: bold;
  padding: 0.5rem;
}
</style>
