<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { insumosService } from '@/servicios/insumosService'
import { recetasService } from '@/servicios/recetasService'
import { productoService } from '@/servicios/productoService'
import type {
  ActualizarInsumoPayload,
  CrearInsumoPayload,
  Insumo,
  ItemReceta,
  TipoAjusteStock,
  UnidadMedida,
} from '@/models/insumo'
import type { Producto } from '@/models/producto'

// ─────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────
const tabActiva = ref<'insumos' | 'recetas'>('insumos')

// ─────────────────────────────────────────────────────────────────────────
// INSUMOS
// ─────────────────────────────────────────────────────────────────────────
const insumos = ref<Insumo[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)
const buscar = ref('')
const soloBajoStock = ref(false)

const mostrarFormNuevo = ref(false)
const guardandoInsumo = ref(false)
const editandoId = ref<number | null>(null)

const formInsumo = ref<CrearInsumoPayload>({
  nombre: '',
  categoria: '',
  unidadMedida: 'kg',
  stock: 0,
  stockMinimo: 0,
  costoUnitario: undefined,
})

const insumosFiltrados = computed(() =>
  insumos.value.filter((i) => i.nombre.toLowerCase().includes(buscar.value.toLowerCase())),
)

async function cargarInsumos() {
  cargando.value = true
  error.value = null
  try {
    insumos.value = await insumosService.listar(soloBajoStock.value)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar los insumos'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarInsumos)
watch(soloBajoStock, cargarInsumos)

function abrirCrear() {
  editandoId.value = null
  formInsumo.value = {
    nombre: '',
    categoria: '',
    unidadMedida: 'kg',
    stock: 0,
    stockMinimo: 0,
    costoUnitario: undefined,
  }
  mostrarFormNuevo.value = true
}

function abrirEditar(insumo: Insumo) {
  editandoId.value = insumo.id
  formInsumo.value = {
    nombre: insumo.nombre,
    categoria: insumo.categoria,
    unidadMedida: insumo.unidadMedida,
    stock: insumo.stock,
    stockMinimo: insumo.stockMinimo,
    costoUnitario: insumo.costoUnitario ?? undefined,
  }
  mostrarFormNuevo.value = true
}

async function guardarInsumo() {
  if (!formInsumo.value.nombre || !formInsumo.value.categoria) return

  guardandoInsumo.value = true
  error.value = null
  try {
    if (editandoId.value) {
      await insumosService.actualizar(editandoId.value, formInsumo.value as ActualizarInsumoPayload)
    } else {
      await insumosService.crear(formInsumo.value)
    }
    mostrarFormNuevo.value = false
    await cargarInsumos()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo guardar el insumo'
  } finally {
    guardandoInsumo.value = false
  }
}

async function eliminarInsumo(id: number) {
  try {
    await insumosService.eliminar(id)
    await cargarInsumos()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo eliminar el insumo'
  }
}

// ── Ajuste rápido de stock ──
const ajusteActivoId = ref<number | null>(null)
const ajusteForm = ref<{ tipo: TipoAjusteStock; cantidad: number | null; motivo: string }>({
  tipo: 'entrada',
  cantidad: null,
  motivo: '',
})
const guardandoAjuste = ref(false)

function abrirAjuste(insumo: Insumo) {
  ajusteActivoId.value = insumo.id
  ajusteForm.value = { tipo: 'entrada', cantidad: null, motivo: '' }
}

async function confirmarAjuste(id: number) {
  if (!ajusteForm.value.cantidad) return
  guardandoAjuste.value = true
  error.value = null
  try {
    await insumosService.ajustarStock(id, {
      tipo: ajusteForm.value.tipo,
      cantidad: Number(ajusteForm.value.cantidad),
      motivo: ajusteForm.value.motivo || undefined,
    })
    ajusteActivoId.value = null
    await cargarInsumos()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo ajustar el stock'
  } finally {
    guardandoAjuste.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────
// RECETAS (BOM por producto)
// ─────────────────────────────────────────────────────────────────────────
const productos = ref<Producto[]>([])
const idProductoSeleccionado = ref<number | null>(null)
const recetaItems = ref<{ idInsumo: number | null; cantidadPorUnidad: number | null }[]>([])
const cargandoReceta = ref(false)
const guardandoReceta = ref(false)
const errorReceta = ref<string | null>(null)
const exitoReceta = ref(false)

async function cargarProductos() {
  try {
    productos.value = await productoService.obtenerProductos()
  } catch {
    // silencioso: si falla, el select de productos simplemente queda vacío
  }
}

async function cargarReceta(idProducto: number) {
  cargandoReceta.value = true
  errorReceta.value = null
  exitoReceta.value = false
  try {
    const items: ItemReceta[] = await recetasService.obtener(idProducto)
    recetaItems.value = items.length
      ? items.map((i) => ({ idInsumo: i.idInsumo, cantidadPorUnidad: i.cantidadPorUnidad }))
      : [{ idInsumo: null, cantidadPorUnidad: null }]
  } catch (e: any) {
    errorReceta.value = e?.response?.data?.message || 'No se pudo cargar la receta'
  } finally {
    cargandoReceta.value = false
  }
}

watch(idProductoSeleccionado, (id) => {
  if (id) cargarReceta(id)
})

function agregarIngrediente() {
  recetaItems.value.push({ idInsumo: null, cantidadPorUnidad: null })
}

function quitarIngrediente(index: number) {
  recetaItems.value.splice(index, 1)
}

async function guardarReceta() {
  if (!idProductoSeleccionado.value) return

  const items = recetaItems.value
    .filter((i) => i.idInsumo && i.cantidadPorUnidad)
    .map((i) => ({
      idInsumo: i.idInsumo as number,
      cantidadPorUnidad: i.cantidadPorUnidad as number,
    }))

  if (items.length === 0) {
    errorReceta.value = 'Agrega al menos un ingrediente válido'
    return
  }

  guardandoReceta.value = true
  errorReceta.value = null
  try {
    await recetasService.reemplazar(idProductoSeleccionado.value, { items })
    exitoReceta.value = true
    setTimeout(() => (exitoReceta.value = false), 3000)
  } catch (e: any) {
    errorReceta.value = e?.response?.data?.message || 'No se pudo guardar la receta'
  } finally {
    guardandoReceta.value = false
  }
}

onMounted(cargarProductos)

function nombreInsumo(id: number | null): string {
  return insumos.value.find((i) => i.id === id)?.nombre || ''
}
</script>

<template>
  <div class="admin-wrap">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon"><i class="pi pi-box"></i></div>
        <div>
          <h2 class="page-titulo">Insumos y Recetas</h2>
          <p class="page-sub">Inventario de materia prima y recetas (BOM) por producto</p>
        </div>
      </div>
      <div class="header-actions" v-if="tabActiva === 'insumos'">
        <button class="btn-recargar" @click="cargarInsumos" :disabled="cargando" title="Recargar">
          <i :class="cargando ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        </button>
        <button class="btn-crear" @click="abrirCrear">
          <i class="pi pi-plus"></i> Nuevo Insumo
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        class="tab-btn"
        :class="{ activa: tabActiva === 'insumos' }"
        @click="tabActiva = 'insumos'"
      >
        <i class="pi pi-box"></i> Insumos
      </button>
      <button
        class="tab-btn"
        :class="{ activa: tabActiva === 'recetas' }"
        @click="tabActiva = 'recetas'"
      >
        <i class="pi pi-book"></i> Recetas por Producto
      </button>
    </div>

    <p v-if="error" class="admin-alert-error">
      <i class="pi pi-exclamation-circle"></i> {{ error }}
    </p>

    <!-- ═══════════════ TAB: INSUMOS ═══════════════ -->
    <template v-if="tabActiva === 'insumos'">
      <!-- Formulario Nuevo/Editar -->
      <div v-if="mostrarFormNuevo" class="tabla-card margin-bottom">
        <div class="tabla-card-header">
          <div class="header-inline">
            <i class="pi pi-pencil"></i>
            <h3>{{ editandoId ? 'Editar Insumo' : 'Nuevo Insumo' }}</h3>
          </div>
          <button class="btn-recargar" @click="mostrarFormNuevo = false" title="Cerrar">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="card-body">
          <form @submit.prevent="guardarInsumo" class="form-grid">
            <div class="admin-field-group">
              <label>Nombre</label>
              <input
                v-model="formInsumo.nombre"
                type="text"
                placeholder="Ej. Harina de Trigo"
                class="admin-field-input"
                required
              />
            </div>
            <div class="admin-field-group">
              <label>Categoría</label>
              <input
                v-model="formInsumo.categoria"
                type="text"
                placeholder="Ej. Secos, Frutas, Empaques"
                class="admin-field-input"
                required
              />
            </div>
            <div class="admin-field-group">
              <label>Unidad de Medida</label>
              <select v-model="formInsumo.unidadMedida" class="admin-field-input">
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="l">Litros (l)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="uds">Unidades (uds)</option>
              </select>
            </div>
            <div class="admin-field-group">
              <label>Stock Actual</label>
              <input
                v-model.number="formInsumo.stock"
                type="number"
                step="0.01"
                class="admin-field-input"
                required
              />
            </div>
            <div class="admin-field-group">
              <label>Stock Mínimo</label>
              <input
                v-model.number="formInsumo.stockMinimo"
                type="number"
                step="0.01"
                class="admin-field-input"
                required
              />
            </div>
            <div class="admin-field-group">
              <label>Costo Unitario (Bs., opcional)</label>
              <input
                v-model.number="formInsumo.costoUnitario"
                type="number"
                step="0.01"
                class="admin-field-input"
              />
            </div>
            <div class="admin-field-group button-align">
              <button type="submit" class="btn-admin-primario" :disabled="guardandoInsumo">
                <i class="pi pi-save"></i> {{ guardandoInsumo ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input
            v-model="buscar"
            type="search"
            class="search-input"
            placeholder="Buscar insumo..."
          />
        </div>
        <div class="toolbar-right">
          <label class="check-inline">
            <input type="checkbox" v-model="soloBajoStock" />
            Solo bajo stock
          </label>
          <span class="total-badge">
            <i class="pi pi-database"></i> {{ insumosFiltrados.length }}
            {{ insumosFiltrados.length === 1 ? 'registro' : 'registros' }}
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

        <template v-else-if="insumosFiltrados.length === 0">
          <div class="admin-empty-state">
            <i class="pi pi-inbox"></i>
            <p>No hay insumos registrados</p>
          </div>
        </template>

        <template v-else>
          <div class="table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Categoría</th>
                  <th class="text-right">Stock Actual</th>
                  <th class="text-right">Stock Mínimo</th>
                  <th>Estado</th>
                  <th style="width: 140px">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="item in insumosFiltrados" :key="item.id">
                  <tr>
                    <td>
                      <strong>{{ item.nombre }}</strong>
                    </td>
                    <td>
                      <span class="badge-cat">{{ item.categoria }}</span>
                    </td>
                    <td class="text-right">
                      <strong>{{ item.stock }} {{ item.unidadMedida }}</strong>
                    </td>
                    <td class="text-right">{{ item.stockMinimo }} {{ item.unidadMedida }}</td>
                    <td>
                      <span :class="item.stock <= item.stockMinimo ? 'badge-danger' : 'badge-ok'">
                        {{ item.stock <= item.stockMinimo ? 'Reponer' : 'Normal' }}
                      </span>
                    </td>
                    <td>
                      <div class="acciones-row">
                        <button class="btn-icon" title="Ajustar stock" @click="abrirAjuste(item)">
                          <i class="pi pi-sliders-h"></i>
                        </button>
                        <button class="btn-icon" title="Editar" @click="abrirEditar(item)">
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button
                          class="btn-icon btn-icon-del"
                          title="Eliminar"
                          @click="eliminarInsumo(item.id)"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="ajusteActivoId === item.id" class="fila-ajuste">
                    <td colspan="6">
                      <div class="ajuste-panel">
                        <select v-model="ajusteForm.tipo" class="admin-field-input ajuste-select">
                          <option value="entrada">Entrada (compra/reposición)</option>
                          <option value="salida">Salida (merma/corrección)</option>
                        </select>
                        <input
                          v-model.number="ajusteForm.cantidad"
                          type="number"
                          step="0.01"
                          placeholder="Cantidad"
                          class="admin-field-input ajuste-cantidad"
                        />
                        <input
                          v-model="ajusteForm.motivo"
                          type="text"
                          placeholder="Motivo (opcional)"
                          class="admin-field-input ajuste-motivo"
                        />
                        <button
                          class="btn-admin-primario"
                          :disabled="guardandoAjuste"
                          @click="confirmarAjuste(item.id)"
                        >
                          <i class="pi pi-check"></i> Confirmar
                        </button>
                        <button class="btn-admin-secundario" @click="ajusteActivoId = null">
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>

    <!-- ═══════════════ TAB: RECETAS ═══════════════ -->
    <template v-else>
      <div class="tabla-card">
        <div class="tabla-card-header">
          <div class="header-inline">
            <i class="pi pi-book"></i>
            <h3>Receta del Producto</h3>
          </div>
        </div>
        <div class="card-body">
          <div class="admin-field-group producto-select">
            <label>Selecciona un producto</label>
            <select v-model="idProductoSeleccionado" class="admin-field-input">
              <option :value="null">-- Elige un producto --</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>

          <p v-if="errorReceta" class="admin-alert-error">
            <i class="pi pi-exclamation-circle"></i> {{ errorReceta }}
          </p>
          <p v-if="exitoReceta" class="admin-alert-success">
            <i class="pi pi-check-circle"></i> Receta guardada correctamente
          </p>

          <template v-if="idProductoSeleccionado">
            <p v-if="cargandoReceta" class="admin-empty-state">
              <i class="pi pi-spin pi-spinner"></i>
            </p>

            <div v-else class="receta-lista">
              <div v-for="(item, index) in recetaItems" :key="index" class="receta-fila">
                <select v-model="item.idInsumo" class="admin-field-input receta-insumo">
                  <option :value="null">-- Insumo --</option>
                  <option v-for="i in insumos" :key="i.id" :value="i.id">
                    {{ i.nombre }} ({{ i.unidadMedida }})
                  </option>
                </select>
                <input
                  v-model.number="item.cantidadPorUnidad"
                  type="number"
                  step="0.001"
                  placeholder="Cantidad por unidad"
                  class="admin-field-input receta-cantidad"
                />
                <span class="receta-unidad">{{
                  item.idInsumo ? insumos.find((i) => i.id === item.idInsumo)?.unidadMedida : ''
                }}</span>
                <button
                  class="btn-icon btn-icon-del"
                  title="Quitar"
                  @click="quitarIngrediente(index)"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>

              <button class="btn-admin-secundario" @click="agregarIngrediente">
                <i class="pi pi-plus"></i> Agregar ingrediente
              </button>

              <div class="receta-guardar">
                <button
                  class="btn-admin-primario"
                  :disabled="guardandoReceta"
                  @click="guardarReceta"
                >
                  <i class="pi pi-save"></i>
                  {{ guardandoReceta ? 'Guardando...' : 'Guardar Receta' }}
                </button>
              </div>
            </div>
          </template>

          <div v-else class="admin-empty-state">
            <i class="pi pi-arrow-up"></i>
            <p>Elige un producto para ver o editar su receta</p>
          </div>
        </div>
      </div>
    </template>
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

.tabs-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1.5px solid #f8bbd0;
  color: #c2185b;
  padding: 0.55rem 1.1rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.activa {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-color: transparent;
}

.check-inline {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #880e4f;
  font-weight: 600;
  cursor: pointer;
}

.acciones-row {
  display: flex;
  gap: 0.4rem;
}
.btn-icon {
  background: #fce4ec;
  color: #c2185b;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-icon:hover {
  background: #f8bbd0;
}
.btn-icon-del {
  background: #ffebee;
  color: #c62828;
}
.btn-icon-del:hover {
  background: #ffcdd2;
}

.fila-ajuste td {
  background: #fff9fb;
  padding: 0.9rem 1.1rem;
}
.ajuste-panel {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}
.ajuste-select {
  max-width: 220px;
}
.ajuste-cantidad {
  max-width: 120px;
}
.ajuste-motivo {
  max-width: 220px;
}

.producto-select {
  max-width: 420px;
  margin-bottom: 1.25rem;
}
.receta-lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.receta-fila {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}
.receta-insumo {
  max-width: 260px;
}
.receta-cantidad {
  max-width: 160px;
}
.receta-unidad {
  color: #999;
  font-size: 0.8rem;
  min-width: 30px;
}
.receta-guardar {
  margin-top: 0.5rem;
}
</style>
