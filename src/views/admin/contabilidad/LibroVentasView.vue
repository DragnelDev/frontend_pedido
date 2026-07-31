<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { libroVentasService } from '@/servicios/contabilidadService'
import { exportarAExcel } from '@/funciones/exportarExcel'
import type { FilaLibroVentas } from '@/models/contabilidad'

const mesSeleccionado = ref(new Date().toISOString().slice(0, 7))
const ventas = ref<FilaLibroVentas[]>([])
const totalMes = ref(0)
const cargando = ref(true)
const exportando = ref(false)
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
  error.value = null
  exportando.value = true
  try {
    const filas = ventas.value.map((v, index) => ({
      '#': index + 1,
      Fecha: new Date(v.fecha).toLocaleDateString('es-BO'),
      'Nº Recibo/Factura': v.nroFactura,
      Cliente: v.cliente,
      'NIT/CI': v.ciNit,
      'Método de Pago': v.metodo,
      'Monto (Bs.)': v.monto,
    }))
    exportarAExcel(filas, 'Libro de Ventas', `Libro_Ventas_${mesSeleccionado.value}`)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo generar el archivo Excel'
  } finally {
    exportando.value = false
  }
}
</script>

<template>
  <div class="admin-wrap">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon"><i class="pi pi-chart-line"></i></div>
        <div>
          <h2 class="page-titulo">Libro de Ventas</h2>
          <p class="page-sub">Consolidado de facturas y recibos para declaración impositiva</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-recargar" @click="cargarVentas" :disabled="cargando" title="Recargar">
          <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
        <button
          class="btn-admin-excel"
          @click="exportarExcel"
          :disabled="exportando || ventas.length === 0"
        >
          <i class="pi pi-file-excel"></i> {{ exportando ? 'Generando...' : 'Exportar a Excel' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="admin-alert-error">
      <i class="pi pi-exclamation-circle"></i> {{ error }}
    </p>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-wrap">
        <i class="pi pi-filter search-icon"></i>
        <input v-model="mesSeleccionado" type="month" class="search-input" />
      </div>
      <div class="toolbar-right">
        <span class="total-badge">
          <i class="pi pi-wallet"></i>
          Total del mes: Bs. {{ totalMes.toFixed(2) }}
        </span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="tabla-card">
      <template v-if="cargando">
        <div class="skeleton-rows">
          <div v-for="n in 5" :key="n" class="skeleton-row">
            <div class="sk-avatar"></div>
            <div class="sk-lines">
              <div class="sk-line sk-line-lg"></div>
              <div class="sk-line sk-line-sm"></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="ventas.length === 0">
        <div class="admin-empty-state">
          <i class="pi pi-inbox"></i>
          <p>No hay ventas registradas en este período</p>
        </div>
      </template>

      <template v-else>
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width: 52px">#</th>
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
                <td>
                  <span class="nro-badge">{{ index + 1 }}</span>
                </td>
                <td>{{ new Date(v.fecha).toLocaleDateString('es-BO') }}</td>
                <td>
                  <strong>#{{ v.nroFactura }}</strong>
                </td>
                <td>{{ v.cliente }}</td>
                <td>{{ v.ciNit }}</td>
                <td>
                  <span class="badge-cat">{{ v.metodo }}</span>
                </td>
                <td class="text-right text-pink">Bs. {{ v.monto.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
}
.nro-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fce4ec;
  color: #c2185b;
  font-size: 0.75rem;
  font-weight: 700;
}
.text-pink {
  color: #e91e8c;
  font-weight: 700;
}
</style>
