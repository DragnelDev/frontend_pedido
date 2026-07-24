<script setup lang="ts">
import { ref } from 'vue'

const mesSeleccionado = ref('2026-07')

const ventas = ref([
  { id: 1, fecha: '2026-07-23', NroFactura: '1001', cliente: 'María Delgado', ciNit: '4589201', monto: 180.00, metodo: 'QR' },
  { id: 2, fecha: '2026-07-23', NroFactura: '1002', cliente: 'Carlos Vera', ciNit: '1029384', monto: 95.00, metodo: 'EFECTIVO' },
  { id: 3, fecha: '2026-07-22', NroFactura: '1003', cliente: 'Sin Nombre', ciNit: '0', monto: 45.00, metodo: 'EFECTIVO' }
])

function exportarExcel() {
  alert('Generando y descargando Libro_Ventas_' + mesSeleccionado.value + '.xlsx')
}
</script>

<template>
  <div class="modulo-container">
    <div class="header-section">
      <div class="header-title">
        <div class="header-icon">📊</div>
        <div>
          <h2>Libro de Ventas</h2>
          <p>Consolidado de facturas y recibos para declaración impositiva</p>
        </div>
      </div>
      <button class="btn-excel" @click="exportarExcel">
        <i class="pi pi-file-excel"></i> Exportar a Excel
      </button>
    </div>

    <div class="card">
      <div class="card-header border-bottom-0">
        <div class="filter-group">
          <label><i class="pi pi-filter"></i> Filtrar Período:</label>
          <input v-model="mesSeleccionado" type="month" class="field-input-sm" />
        </div>
      </div>

      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Nº Recibo / Factura</th>
              <th>Cliente</th>
              <th>NIT / CI</th>
              <th>Método Pago</th>
              <th class="text-right">Total Monto (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, index) in ventas" :key="v.id">
              <td>{{ index + 1 }}</td>
              <td>{{ v.fecha }}</td>
              <td><strong>#{{ v.NroFactura }}</strong></td>
              <td>{{ v.cliente }}</td>
              <td>{{ v.ciNit }}</td>
              <td><span class="badge-pay">{{ v.metodo }}</span></td>
              <td class="text-right text-pink">Bs. {{ v.monto.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modulo-container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.header-title { display: flex; align-items: center; gap: 1rem; }
.header-icon { font-size: 2.2rem; background: #fce4ec; padding: 0.6rem; border-radius: 16px; }
.header-title h2 { font-size: 1.6rem; color: #880e4f; margin: 0; }
.header-title p { font-size: 0.85rem; color: #888; margin: 0; }
.btn-excel { background: #2e7d32; color: white; border: none; padding: 0.75rem 1.4rem; border-radius: 50px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2); }
.card { background: white; border-radius: 20px; border: 1px solid #f8bbd0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.card-header { padding: 1.2rem 1.5rem; background: #fff9fb; }
.filter-group { display: flex; align-items: center; gap: 0.75rem; color: #880e4f; font-weight: 600; font-size: 0.9rem; }
.field-input-sm { padding: 0.4rem 0.8rem; border: 1.5px solid #f8bbd0; border-radius: 8px; outline: none; color: #333; }
.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.85rem; text-align: left; border-bottom: 1px solid #fce4ec; font-size: 0.9rem; }
.data-table th { color: #880e4f; font-weight: 700; background: #fff9fb; }
.badge-pay { background: #e3f2fd; color: #1565c0; padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.text-right { text-align: right; }
.text-pink { color: #e91e8c; font-weight: 700; }
</style>
