<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { libroVentasService } from '@/servicios/contabilidadService'
import type { FilaLibroVentas } from '@/models/contabilidad'

const mesSeleccionado = ref(new Date().toISOString().slice(0, 7))
const ventas = ref<FilaLibroVentas[]>([])
const totalMes = ref(0)
const cargando = ref(true)
const error = ref<string | null>(null)

async function cargarVentas() {
  cargando.value = true
  error.value = null
  try {
    const resultado = await libroVentasService.listar(mesSeleccionado.value)
    ventas.value = resultado.filas
    totalMes.value = resultado.total
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el libro de ventas'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarVentas)
watch(mesSeleccionado, cargarVentas)

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

    <p v-if="error" class="error-text">{{ error }}</p>

    <div class="card">
      <div class="card-header border-bottom-0">
        <div class="filter-group">
          <label><i class="pi pi-filter"></i> Filtrar Período:</label>
          <input v-model="mesSeleccionado" type="month" class="field-input-sm" />
        </div>
        <div class="total-mes">
          Total del mes: <strong>Bs. {{ totalMes.toFixed(2) }}</strong>
        </div>
      </div>

      <div class="card-body table-responsive">
        <p v-if="cargando" class="empty-text">Cargando ventas...</p>
        <p v-else-if="ventas.length === 0" class="empty-text">
          No hay ventas registradas en este período
        </p>
        <table v-else class="data-table">
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
              <td>{{ new Date(v.fecha).toLocaleDateString('es-BO') }}</td>
              <td>
                <strong>#{{ v.nroFactura }}</strong>
              </td>
              <td>{{ v.cliente }}</td>
              <td>{{ v.ciNit }}</td>
              <td>
                <span class="badge-pay">{{ v.metodo }}</span>
              </td>
              <td class="text-right text-pink">Bs. {{ v.monto.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
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
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-icon {
  font-size: 2.2rem;
  background: #fce4ec;
  padding: 0.6rem;
  border-radius: 16px;
}
.header-title h2 {
  font-size: 1.6rem;
  color: #880e4f;
  margin: 0;
}
.header-title p {
  font-size: 0.85rem;
  color: #888;
  margin: 0;
}
.btn-excel {
  background: #2e7d32;
  color: white;
  border: none;
  padding: 0.75rem 1.4rem;
  border-radius: 50px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
}
.card {
  background: white;
  border-radius: 20px;
  border: 1px solid #f8bbd0;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
}
.card-header {
  padding: 1.2rem 1.5rem;
  background: #fff9fb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.total-mes {
  color: #880e4f;
  font-size: 0.9rem;
}
.total-mes strong {
  color: #e91e8c;
}
.error-text {
  color: #c62828;
  font-size: 0.85rem;
  margin: 0 0 1rem;
}
.empty-text {
  color: #999;
  font-size: 0.9rem;
  padding: 1rem 0;
  text-align: center;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #880e4f;
  font-weight: 600;
  font-size: 0.9rem;
}
.field-input-sm {
  padding: 0.4rem 0.8rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 8px;
  outline: none;
  color: #333;
}
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 0.85rem;
  text-align: left;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.9rem;
}
.data-table th {
  color: #880e4f;
  font-weight: 700;
  background: #fff9fb;
}
.badge-pay {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
.text-right {
  text-align: right;
}
.text-pink {
  color: #e91e8c;
  font-weight: 700;
}
</style>
