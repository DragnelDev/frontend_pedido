<script setup lang="ts">
import { ref, computed } from 'vue'

const montoInicial = ref(200.00) // Fondo inicial
const ventasEfectivoEsperadas = ref(850.00)
const ventasQREsperadas = ref(640.00)

const efectivoContado = ref(1050.00) // Lo que cuenta el cajero físicamente
const observaciones = ref('')
const guardando = ref(false)

const totalEfectivoEsperado = computed(() => montoInicial.value + ventasEfectivoEsperadas.value)
const diferenciaEfectivo = computed(() => efectivoContado.value - totalEfectivoEsperado.value)

function realizarCierre() {
  guardando.value = true
  setTimeout(() => {
    guardando.value = false
    alert('Cierre de caja registrado con éxito')
  }, 1000)
}
</script>

<template>
  <div class="modulo-container">
    <div class="header-section">
      <div class="header-title">
        <div class="header-icon">💵</div>
        <div>
          <h2>Arqueo y Cierre de Caja</h2>
          <p>Verificación de efectivo físico contra ventas del sistema</p>
        </div>
      </div>
    </div>

    <div class="grid-layout">
      <!-- Tarjeta Resumen Sistema -->
      <div class="card">
        <div class="card-header">
          <i class="pi pi-desktop card-icon"></i>
          <h3>Esperado en Sistema (Hoy)</h3>
        </div>
        <div class="card-body">
          <div class="row-info">
            <span>Fondo Inicial de Caja:</span>
            <strong>Bs. {{ montoInicial.toFixed(2) }}</strong>
          </div>
          <div class="row-info">
            <span>Ventas en Efectivo:</span>
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
      <div class="card">
        <div class="card-header">
          <i class="pi pi-calculator card-icon"></i>
          <h3>Conteo Físico de Caja</h3>
        </div>
        <div class="card-body">
          <div class="field-group">
            <label>Efectivo Real en Caja (Bs.)</label>
            <input
              v-model.number="efectivoContado"
              type="number"
              step="0.5"
              class="field-input main-input"
            />
          </div>

          <div class="diferencia-box" :class="{ 'ok': diferenciaEfectivo === 0, 'sobrante': diferenciaEfectivo > 0, 'faltante': diferenciaEfectivo < 0 }">
            <span>Diferencia de Efectivo:</span>
            <strong>
              {{ diferenciaEfectivo > 0 ? '+' : '' }}Bs. {{ diferenciaEfectivo.toFixed(2) }}
            </strong>
            <small v-if="diferenciaEfectivo === 0"> (Caja Cuadrada)</small>
            <small v-else-if="diferenciaEfectivo > 0"> (Sobrante)</small>
            <small v-else> (Faltante)</small>
          </div>

          <div class="field-group margin-top">
            <label>Observaciones o Justificación</label>
            <textarea v-model="observaciones" rows="3" class="field-input" placeholder="Opcional: motivos de sobrante o faltante..."></textarea>
          </div>

          <button class="btn-primary full-width margin-top" @click="realizarCierre" :disabled="guardando">
            <i class="pi pi-lock"></i> Cerrar Caja del Día
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modulo-container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
.header-section { display: flex; align-items: center; margin-bottom: 1.5rem; }
.header-title { display: flex; align-items: center; gap: 1rem; }
.header-icon { font-size: 2.2rem; background: #fce4ec; padding: 0.6rem; border-radius: 16px; }
.header-title h2 { font-size: 1.6rem; color: #880e4f; margin: 0; }
.header-title p { font-size: 0.85rem; color: #888; margin: 0; }
.grid-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; }
.card { background: white; border-radius: 20px; border: 1px solid #f8bbd0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.card-header { background: #fff9fb; padding: 1.2rem 1.5rem; border-bottom: 1px solid #fce4ec; display: flex; align-items: center; gap: 0.75rem; }
.card-icon { color: #e91e8c; font-size: 1.2rem; }
.card-header h3 { margin: 0; font-size: 1.1rem; color: #880e4f; }
.card-body { padding: 1.5rem; }
.row-info { display: flex; justify-content: space-between; padding: 0.6rem 0; color: #555; }
.row-info.highlight { font-size: 1.05rem; font-weight: bold; background: #fff9fb; padding: 0.8rem; border-radius: 10px; }
.text-pink { color: #e91e8c; }
.divider { border: none; border-top: 1px solid #fce4ec; margin: 1rem 0; }
.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-group label { font-size: 0.85rem; font-weight: 600; color: #880e4f; }
.field-input { width: 100%; padding: 0.65rem 0.9rem; border: 1.5px solid #f8bbd0; border-radius: 10px; outline: none; }
.main-input { font-size: 1.4rem; font-weight: bold; color: #880e4f; text-align: center; }
.diferencia-box { margin-top: 1rem; padding: 0.9rem; border-radius: 12px; text-align: center; font-size: 1rem; }
.diferencia-box.ok { background: #e8f5e9; color: #2e7d32; }
.diferencia-box.sobrante { background: #e3f2fd; color: #1565c0; }
.diferencia-box.faltante { background: #ffebee; color: #c62828; }
.margin-top { margin-top: 1rem; }
.btn-primary { background: linear-gradient(135deg, #e91e8c, #f06292); color: white; border: none; padding: 0.85rem; border-radius: 50px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.full-width { width: 100%; }
</style>
