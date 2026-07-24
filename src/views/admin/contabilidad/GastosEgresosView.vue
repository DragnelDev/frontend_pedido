<script setup lang="ts">
import { ref, computed } from 'vue'

const egresos = ref([
  { id: 1, fecha: '2026-07-23', concepto: 'Compra de Frutillas y Moras', categoria: 'Insumos', comprobante: 'Recibo #102', monto: 140.00 },
  { id: 2, fecha: '2026-07-22', concepto: 'Pago Servicio de Luz', categoria: 'Servicios', comprobante: 'Factura #9921', monto: 280.00 }
])

const nuevoGasto = ref({
  concepto: '',
  categoria: 'Insumos',
  comprobante: '',
  monto: null as number | null
})

const totalGastosMes = computed(() => egresos.value.reduce((acc, curr) => acc + curr.monto, 0))

function registrarGasto() {
  if (!nuevoGasto.value.concepto || !nuevoGasto.value.monto) return

  egresos.value.unshift({
    id: Date.now(),
    fecha: new Date().toISOString().split('T')[0],
    ...nuevoGasto.value,
    monto: Number(nuevoGasto.value.monto)
  })

  nuevoGasto.value = { concepto: '', categoria: 'Insumos', comprobante: '', monto: null }
}
</script>

<template>
  <div class="modulo-container">
    <div class="header-section">
      <div class="header-title">
        <div class="header-icon">💸</div>
        <div>
          <h2>Gestión de Gastos y Egresos</h2>
          <p>Control de salidas de dinero e insumos comprados</p>
        </div>
      </div>
      <div class="kpi-badge">
        <span>Gastos de este mes:</span>
        <strong>Bs. {{ totalGastosMes.toFixed(2) }}</strong>
      </div>
    </div>

    <!-- Formulario Agregar Gasto -->
    <div class="card margin-bottom">
      <div class="card-header">
        <i class="pi pi-plus-circle card-icon"></i>
        <h3>Registrar Nuevo Egreso</h3>
      </div>
      <div class="card-body">
        <form @submit.prevent="registrarGasto" class="form-grid">
          <div class="field-group">
            <label>Concepto / Detalle</label>
            <input v-model="nuevoGasto.concepto" type="text" placeholder="Ej. Harina 25kg" class="field-input" required />
          </div>
          <div class="field-group">
            <label>Categoría</label>
            <select v-model="nuevoGasto.categoria" class="field-input">
              <option value="Insumos">Insumos / Materia Prima</option>
              <option value="Servicios">Servicios Básicos</option>
              <option value="Empaques">Empaques / Cajas</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div class="field-group">
            <label>Nº Comprobante / Nota</label>
            <input v-model="nuevoGasto.comprobante" type="text" placeholder="Ej. Factura 123" class="field-input" />
          </div>
          <div class="field-group">
            <label>Monto (Bs.)</label>
            <input v-model.number="nuevoGasto.monto" type="number" step="0.10" placeholder="0.00" class="field-input" required />
          </div>
          <div class="field-group button-align">
            <button type="submit" class="btn-primary">
              <i class="pi pi-save"></i> Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tabla de Egresos -->
    <div class="card">
      <div class="card-header">
        <i class="pi pi-list card-icon"></i>
        <h3>Historial de Egresos</h3>
      </div>
      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Comprobante</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in egresos" :key="item.id">
              <td>{{ item.fecha }}</td>
              <td><strong>{{ item.concepto }}</strong></td>
              <td><span class="badge">{{ item.categoria }}</span></td>
              <td>{{ item.comprobante || '-' }}</td>
              <td class="text-right text-red">- Bs. {{ item.monto.toFixed(2) }}</td>
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
.kpi-badge { background: #ffebee; border: 1px solid #ffcdd2; color: #c62828; padding: 0.75rem 1.25rem; border-radius: 50px; font-size: 0.9rem; display: flex; gap: 0.5rem; }
.card { background: white; border-radius: 20px; border: 1px solid #f8bbd0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.margin-bottom { margin-bottom: 1.5rem; }
.card-header { background: #fff9fb; padding: 1.2rem 1.5rem; border-bottom: 1px solid #fce4ec; display: flex; align-items: center; gap: 0.75rem; }
.card-icon { color: #e91e8c; font-size: 1.2rem; }
.card-header h3 { margin: 0; font-size: 1.1rem; color: #880e4f; }
.card-body { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end; }
.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-group label { font-size: 0.825rem; font-weight: 600; color: #880e4f; }
.field-input { padding: 0.65rem 0.9rem; border: 1.5px solid #f8bbd0; border-radius: 10px; outline: none; font-size: 0.9rem; }
.btn-primary { background: linear-gradient(135deg, #e91e8c, #f06292); color: white; border: none; padding: 0.75rem 1.2rem; border-radius: 50px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 42px; }
.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.85rem; text-align: left; border-bottom: 1px solid #fce4ec; font-size: 0.9rem; }
.data-table th { color: #880e4f; font-weight: 700; background: #fff9fb; }
.badge { background: #fce4ec; color: #c2185b; padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.text-right { text-align: right; }
.text-red { color: #c62828; font-weight: 700; }
</style>
