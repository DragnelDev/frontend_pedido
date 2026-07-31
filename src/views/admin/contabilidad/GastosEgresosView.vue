<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gastosService } from '@/servicios/contabilidadService'
import { exportarAExcel } from '@/funciones/exportarExcel'
import type { CategoriaGasto, Gasto } from '@/models/contabilidad'

const egresos = ref<Gasto[]>([])
const totalGastosMes = ref(0)
const cargando = ref(true)
const guardando = ref(false)
const exportando = ref(false)
const error = ref<string | null>(null)

const nuevoGasto = ref<{
  concepto: string
  categoria: CategoriaGasto
  comprobante: string
  monto: number | null
}>({
  concepto: '',
  categoria: 'insumos',
  comprobante: '',
  monto: null,
})

const ETIQUETAS_CATEGORIA: Record<CategoriaGasto, string> = {
  insumos: 'Insumos',
  servicios: 'Servicios',
  empaques: 'Empaques',
  mantenimiento: 'Mantenimiento',
  otros: 'Otros',
}

async function cargarDatos() {
  cargando.value = true
  error.value = null
  try {
    const [lista, resumen] = await Promise.all([gastosService.listar(), gastosService.resumenMes()])
    egresos.value = lista
    totalGastosMes.value = resumen.total
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar los gastos'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarDatos)

async function registrarGasto() {
  if (!nuevoGasto.value.concepto || !nuevoGasto.value.monto) return

  guardando.value = true
  error.value = null
  try {
    await gastosService.registrar({
      concepto: nuevoGasto.value.concepto,
      categoria: nuevoGasto.value.categoria,
      comprobante: nuevoGasto.value.comprobante || undefined,
      monto: Number(nuevoGasto.value.monto),
    })
    nuevoGasto.value = { concepto: '', categoria: 'insumos', comprobante: '', monto: null }
    await cargarDatos()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo registrar el gasto'
  } finally {
    guardando.value = false
  }
}

async function eliminarGasto(id: number) {
  try {
    await gastosService.eliminar(id)
    await cargarDatos()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo eliminar el gasto'
  }
}

function exportarExcel() {
  error.value = null
  exportando.value = true
  try {
    const filas = egresos.value.map((g) => ({
      Fecha: g.fecha,
      Concepto: g.concepto,
      Categoría: ETIQUETAS_CATEGORIA[g.categoria],
      Comprobante: g.comprobante || '-',
      'Monto (Bs.)': Number(g.monto),
    }))
    exportarAExcel(filas, 'Gastos y Egresos', `Gastos_${new Date().toISOString().slice(0, 7)}`)
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
        <div class="page-icon"><i class="pi pi-money-bill"></i></div>
        <div>
          <h2 class="page-titulo">Gastos y Egresos</h2>
          <p class="page-sub">Control de salidas de dinero e insumos comprados</p>
        </div>
      </div>
      <div class="header-actions">
        <span class="total-badge kpi-gasto">
          <i class="pi pi-arrow-down"></i>
          Gastos del mes: Bs. {{ totalGastosMes.toFixed(2) }}
        </span>
        <button class="btn-recargar" @click="cargarDatos" :disabled="cargando" title="Recargar">
          <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
        <button
          class="btn-admin-excel"
          @click="exportarExcel"
          :disabled="exportando || egresos.length === 0"
        >
          <i class="pi pi-file-excel"></i> {{ exportando ? 'Generando...' : 'Exportar a Excel' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="admin-alert-error">
      <i class="pi pi-exclamation-circle"></i> {{ error }}
    </p>

    <!-- Formulario Agregar Gasto -->
    <div class="tabla-card margin-bottom">
      <div class="tabla-card-header">
        <div class="header-inline">
          <i class="pi pi-plus-circle"></i>
          <h3>Registrar Nuevo Egreso</h3>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="registrarGasto" class="form-grid">
          <div class="admin-field-group">
            <label>Concepto / Detalle</label>
            <input
              v-model="nuevoGasto.concepto"
              type="text"
              placeholder="Ej. Harina 25kg"
              class="admin-field-input"
              required
            />
          </div>
          <div class="admin-field-group">
            <label>Categoría</label>
            <select v-model="nuevoGasto.categoria" class="admin-field-input">
              <option value="insumos">Insumos / Materia Prima</option>
              <option value="servicios">Servicios Básicos</option>
              <option value="empaques">Empaques / Cajas</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div class="admin-field-group">
            <label>Nº Comprobante / Nota</label>
            <input
              v-model="nuevoGasto.comprobante"
              type="text"
              placeholder="Ej. Factura 123"
              class="admin-field-input"
            />
          </div>
          <div class="admin-field-group">
            <label>Monto (Bs.)</label>
            <input
              v-model.number="nuevoGasto.monto"
              type="number"
              step="0.10"
              placeholder="0.00"
              class="admin-field-input"
              required
            />
          </div>
          <div class="admin-field-group button-align">
            <button type="submit" class="btn-admin-primario" :disabled="guardando">
              <i class="pi pi-save"></i> {{ guardando ? 'Guardando...' : 'Guardar Gasto' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tabla de Egresos -->
    <div class="tabla-card">
      <div class="tabla-card-header">
        <div class="header-inline">
          <i class="pi pi-list"></i>
          <h3>Historial de Egresos</h3>
        </div>
        <span class="total-badge"
          ><i class="pi pi-database"></i> {{ egresos.length }}
          {{ egresos.length === 1 ? 'registro' : 'registros' }}</span
        >
      </div>

      <template v-if="cargando">
        <div class="skeleton-rows">
          <div v-for="n in 4" :key="n" class="skeleton-row">
            <div class="sk-avatar"></div>
            <div class="sk-lines">
              <div class="sk-line sk-line-lg"></div>
              <div class="sk-line sk-line-sm"></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="egresos.length === 0">
        <div class="admin-empty-state">
          <i class="pi pi-inbox"></i>
          <p>Aún no hay gastos registrados</p>
        </div>
      </template>

      <template v-else>
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Comprobante</th>
                <th class="text-right">Monto</th>
                <th style="width: 60px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in egresos" :key="item.id">
                <td>{{ item.fecha }}</td>
                <td>
                  <strong>{{ item.concepto }}</strong>
                </td>
                <td>
                  <span class="badge-cat">{{ ETIQUETAS_CATEGORIA[item.categoria] }}</span>
                </td>
                <td>{{ item.comprobante || '-' }}</td>
                <td class="text-right text-red">- Bs. {{ Number(item.monto).toFixed(2) }}</td>
                <td>
                  <button
                    class="btn-icon-del"
                    title="Eliminar gasto"
                    @click="eliminarGasto(item.id)"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.margin-bottom {
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
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: flex-end;
}
.button-align {
  justify-content: flex-end;
}
.table-wrap {
  overflow-x: auto;
}
.text-right {
  text-align: right;
}
.text-red {
  color: #c62828;
  font-weight: 700;
}
.kpi-gasto {
  background: #ffebee;
  color: #c62828;
  padding: 0.4rem 0.85rem;
  border-radius: 50px;
}
.btn-icon-del {
  background: #ffebee;
  color: #c62828;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-icon-del:hover {
  background: #ffcdd2;
}
</style>
