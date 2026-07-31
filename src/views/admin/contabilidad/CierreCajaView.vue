<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { cierreCajaService } from '@/servicios/contabilidadService'
import { exportarAExcel } from '@/funciones/exportarExcel'
import type { CierreCaja } from '@/models/contabilidad'

const cargando = ref(true)
const error = ref<string | null>(null)
const guardando = ref(false)
const exportando = ref(false)
const mensajeExito = ref<string | null>(null)

const fechaHoy = new Date().toISOString().slice(0, 10)

const montoInicial = ref(0)
const ventasEfectivoEsperadas = ref(0)
const ventasQREsperadas = ref(0)
const yaCerrado = ref(false)

const efectivoContado = ref(0)
const observaciones = ref('')

const historial = ref<CierreCaja[]>([])

const totalEfectivoEsperado = computed(() => montoInicial.value + ventasEfectivoEsperadas.value)
const diferenciaEfectivo = computed(() => efectivoContado.value - totalEfectivoEsperado.value)

async function cargarResumen() {
  cargando.value = true
  error.value = null
  try {
    const [resumen, listaHistorial] = await Promise.all([
      cierreCajaService.resumenDia(fechaHoy),
      cierreCajaService.listar(),
    ])
    ventasEfectivoEsperadas.value = resumen.ventasEfectivoSistema
    ventasQREsperadas.value = resumen.ventasDigitalSistema
    yaCerrado.value = resumen.yaCerrado
    historial.value = listaHistorial

    if (resumen.cierre) {
      // Ya se cerró la caja hoy: mostramos los datos del cierre registrado
      montoInicial.value = resumen.cierre.montoInicial
      efectivoContado.value = resumen.cierre.efectivoContado
      observaciones.value = resumen.cierre.observaciones || ''
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el resumen del día'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarResumen)

async function realizarCierre() {
  guardando.value = true
  error.value = null
  mensajeExito.value = null
  try {
    await cierreCajaService.registrar({
      fecha: fechaHoy,
      montoInicial: montoInicial.value,
      efectivoContado: efectivoContado.value,
      observaciones: observaciones.value || undefined,
    })
    mensajeExito.value = 'Cierre de caja registrado con éxito'
    yaCerrado.value = true
    historial.value = await cierreCajaService.listar()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo registrar el cierre de caja'
  } finally {
    guardando.value = false
  }
}

function exportarExcel() {
  error.value = null
  exportando.value = true
  try {
    const filas = historial.value.map((c) => ({
      Fecha: c.fecha,
      'Fondo Inicial (Bs.)': Number(c.montoInicial),
      'Ventas Efectivo (Bs.)': Number(c.ventasEfectivoSistema),
      'Ventas Digital (Bs.)': Number(c.ventasDigitalSistema),
      'Efectivo Contado (Bs.)': Number(c.efectivoContado),
      'Diferencia (Bs.)': Number(c.diferencia),
      Observaciones: c.observaciones || '-',
    }))
    exportarAExcel(filas, 'Cierres de Caja', 'Historial_Cierres_Caja')
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
        <div class="page-icon"><i class="pi pi-wallet"></i></div>
        <div>
          <h2 class="page-titulo">Arqueo y Cierre de Caja</h2>
          <p class="page-sub">
            Verificación de efectivo físico contra ventas del sistema — {{ fechaHoy }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-recargar" @click="cargarResumen" :disabled="cargando" title="Recargar">
          <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
        <button
          class="btn-admin-excel"
          @click="exportarExcel"
          :disabled="exportando || historial.length === 0"
        >
          <i class="pi pi-file-excel"></i> {{ exportando ? 'Generando...' : 'Exportar Historial' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="admin-alert-error">
      <i class="pi pi-exclamation-circle"></i> {{ error }}
    </p>
    <p v-if="mensajeExito" class="admin-alert-success">
      <i class="pi pi-check-circle"></i> {{ mensajeExito }}
    </p>
    <p v-if="yaCerrado && !mensajeExito" class="admin-alert-info">
      <i class="pi pi-lock"></i> La caja de hoy ya fue cerrada. Estos son los datos registrados.
    </p>

    <div v-if="!cargando" class="grid-layout">
      <!-- Tarjeta Resumen Sistema -->
      <div class="tabla-card">
        <div class="tabla-card-header">
          <div class="header-inline">
            <i class="pi pi-desktop"></i>
            <h3>Esperado en Sistema (Hoy)</h3>
          </div>
        </div>
        <div class="card-body">
          <div class="admin-field-group">
            <label>Fondo Inicial de Caja (Bs.)</label>
            <input
              v-model.number="montoInicial"
              type="number"
              step="0.5"
              class="admin-field-input"
              :disabled="yaCerrado"
            />
          </div>
          <div class="row-info margin-top">
            <span>Ventas en Efectivo (sistema):</span>
            <strong>Bs. {{ ventasEfectivoEsperadas.toFixed(2) }}</strong>
          </div>
          <div class="row-info highlight">
            <span>Total Efectivo Esperado:</span>
            <strong class="text-pink">Bs. {{ totalEfectivoEsperado.toFixed(2) }}</strong>
          </div>
          <hr class="divider" />
          <div class="row-info">
            <span>Ventas por QR / Digital:</span>
            <strong>Bs. {{ ventasQREsperadas.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <!-- Tarjeta Conteo Real -->
      <div class="tabla-card">
        <div class="tabla-card-header">
          <div class="header-inline">
            <i class="pi pi-calculator"></i>
            <h3>Conteo Físico de Caja</h3>
          </div>
        </div>
        <div class="card-body">
          <div class="admin-field-group">
            <label>Efectivo Real en Caja (Bs.)</label>
            <input
              v-model.number="efectivoContado"
              type="number"
              step="0.5"
              class="admin-field-input main-input"
              :disabled="yaCerrado"
            />
          </div>

          <div
            class="diferencia-box"
            :class="{
              ok: diferenciaEfectivo === 0,
              sobrante: diferenciaEfectivo > 0,
              faltante: diferenciaEfectivo < 0,
            }"
          >
            <span>Diferencia de Efectivo:</span>
            <strong>
              {{ diferenciaEfectivo > 0 ? '+' : '' }}Bs. {{ diferenciaEfectivo.toFixed(2) }}
            </strong>
            <small v-if="diferenciaEfectivo === 0"> (Caja Cuadrada)</small>
            <small v-else-if="diferenciaEfectivo > 0"> (Sobrante)</small>
            <small v-else> (Faltante)</small>
          </div>

          <div class="admin-field-group margin-top">
            <label>Observaciones o Justificación</label>
            <textarea
              v-model="observaciones"
              rows="3"
              class="admin-field-input"
              placeholder="Opcional: motivos de sobrante o faltante..."
              :disabled="yaCerrado"
            ></textarea>
          </div>

          <button
            class="btn-admin-primario full-width margin-top"
            @click="realizarCierre"
            :disabled="guardando || yaCerrado"
          >
            <i class="pi pi-lock"></i>
            {{ yaCerrado ? 'Caja ya cerrada' : guardando ? 'Guardando...' : 'Cerrar Caja del Día' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Historial -->
    <div class="tabla-card margin-top-lg">
      <div class="tabla-card-header">
        <div class="header-inline">
          <i class="pi pi-history"></i>
          <h3>Historial de Cierres</h3>
        </div>
        <span class="total-badge"
          ><i class="pi pi-database"></i> {{ historial.length }}
          {{ historial.length === 1 ? 'registro' : 'registros' }}</span
        >
      </div>

      <div v-if="!cargando && historial.length === 0" class="admin-empty-state">
        <i class="pi pi-inbox"></i>
        <p>Aún no hay cierres de caja registrados</p>
      </div>

      <div v-else-if="!cargando" class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th class="text-right">Fondo Inicial</th>
              <th class="text-right">Ventas Efectivo</th>
              <th class="text-right">Ventas Digital</th>
              <th class="text-right">Contado</th>
              <th class="text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in historial" :key="c.id">
              <td>{{ c.fecha }}</td>
              <td class="text-right">Bs. {{ Number(c.montoInicial).toFixed(2) }}</td>
              <td class="text-right">Bs. {{ Number(c.ventasEfectivoSistema).toFixed(2) }}</td>
              <td class="text-right">Bs. {{ Number(c.ventasDigitalSistema).toFixed(2) }}</td>
              <td class="text-right">Bs. {{ Number(c.efectivoContado).toFixed(2) }}</td>
              <td class="text-right">
                <span
                  :class="
                    Number(c.diferencia) === 0
                      ? 'badge-ok'
                      : Number(c.diferencia) > 0
                        ? 'badge-warn'
                        : 'badge-danger'
                  "
                >
                  {{ Number(c.diferencia) > 0 ? '+' : '' }}Bs. {{ Number(c.diferencia).toFixed(2) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.header-inline {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #e91e8c;
}
.header-inline h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #880e4f;
}
.card-body {
  padding: 1.5rem;
}
.row-info {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  color: #555;
}
.row-info.highlight {
  font-size: 1.05rem;
  font-weight: bold;
  background: #fff9fb;
  padding: 0.8rem;
  border-radius: 10px;
}
.text-pink {
  color: #e91e8c;
}
.divider {
  border: none;
  border-top: 1px solid #fce4ec;
  margin: 1rem 0;
}
.main-input {
  font-size: 1.4rem;
  font-weight: bold;
  color: #880e4f;
  text-align: center;
}
.diferencia-box {
  margin-top: 1rem;
  padding: 0.9rem;
  border-radius: 12px;
  text-align: center;
  font-size: 1rem;
}
.diferencia-box.ok {
  background: #e8f5e9;
  color: #2e7d32;
}
.diferencia-box.sobrante {
  background: #e3f2fd;
  color: #1565c0;
}
.diferencia-box.faltante {
  background: #ffebee;
  color: #c62828;
}
.margin-top {
  margin-top: 1rem;
}
.margin-top-lg {
  margin-top: 1.5rem;
}
.full-width {
  width: 100%;
}
.table-wrap {
  overflow-x: auto;
}
.text-right {
  text-align: right;
}
</style>
