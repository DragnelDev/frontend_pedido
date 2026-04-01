<script setup lang="ts">
import type { Producto } from '@/models/producto'
import http from '@/plugins/axios'
import { Dialog } from 'primevue'
import { computed, onMounted, ref } from 'vue'

const ENDPOINT = 'productos'
const productos = ref<Producto[]>([])
const productoDelete = ref<Producto | null>(null)
const mostrarConfirmDialog = ref<boolean>(false)
const busqueda = ref<string>('')

const paginaActual = ref(1)
const itemsPorPagina = ref(10)

const emit = defineEmits(['edit'])

const productosFiltrados = computed(() =>
  productos.value.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()) ||
      p.categoria?.nombre.toLowerCase().includes(busqueda.value.toLowerCase()),
  ),
)

const totalPaginas = computed(() =>
  Math.ceil(productosFiltrados.value.length / itemsPorPagina.value),
)

const productosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina.value
  return productosFiltrados.value.slice(inicio, inicio + itemsPorPagina.value)
})

function cambiarPagina(pagina: number) {
  if (pagina >= 1 && pagina <= totalPaginas.value) paginaActual.value = pagina
}

async function obtenerLista() {
  productos.value = await http.get(ENDPOINT).then((r) => r.data)
}

function emitirEdicion(producto: Producto) {
  emit('edit', producto)
}

function mostrarEliminarConfirm(producto: Producto) {
  productoDelete.value = producto
  mostrarConfirmDialog.value = true
}

async function eliminar() {
  await http.delete(`${ENDPOINT}/${productoDelete.value?.id}`)
  obtenerLista()
  mostrarConfirmDialog.value = false
}

onMounted(obtenerLista)
defineExpose({ obtenerLista })
</script>

<template>
  <div class="lista-container">
    <!-- Buscador -->
    <div class="header-acciones">
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre o categoría..."
          class="search-input"
        />
      </div>
      <span class="total-badge">{{ productosFiltrados.length }} productos</span>
    </div>

    <!-- Tabla -->
    <div class="tabla-card">
      <div class="table-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Nro</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(producto, index) in productosPaginados" :key="producto.id">
              <td>
                <span class="nro">{{ (paginaActual - 1) * itemsPorPagina + index + 1 }}</span>
              </td>
              <td>
                <div class="producto-info">
                  <img :src="producto.imagenUrl" alt="foto" class="tabla-img" />
                  <span class="producto-nombre">{{ producto.nombre }}</span>
                </div>
              </td>
              <td>
                <span class="cat-badge">{{ producto.categoria?.nombre || '—' }}</span>
              </td>
              <td>
                <span class="precio">Bs. {{ Number(producto.precio)?.toFixed(2) || '0.00' }}</span>
              </td>
              <td>
                <span
                  class="stock-badge"
                  :class="producto.stock <= 10 ? 'stock-bajo' : 'stock-ok'"
                >
                  <i :class="producto.stock <= 10 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
                  {{ producto.stock }}
                </span>
              </td>
              <td>
                <div class="acciones">
                  <button class="btn-accion editar" @click="emitirEdicion(producto)" title="Editar">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="btn-accion eliminar" @click="mostrarEliminarConfirm(producto)" title="Eliminar">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="productosPaginados.length === 0">
              <td colspan="6" class="empty-state">
                <div class="empty-icon">🍰</div>
                <p>No se encontraron productos</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="paginacion">
        <button class="btn-pag" :disabled="paginaActual === 1" @click="cambiarPagina(paginaActual - 1)">
          <i class="pi pi-chevron-left"></i>
        </button>
        <div class="paginas">
          <button
            v-for="p in totalPaginas" :key="p"
            class="btn-num" :class="{ activo: p === paginaActual }"
            @click="cambiarPagina(p)"
          >{{ p }}</button>
        </div>
        <button class="btn-pag" :disabled="paginaActual === totalPaginas" @click="cambiarPagina(paginaActual + 1)">
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Dialog confirmación -->
    <Dialog
      v-model:visible="mostrarConfirmDialog"
      header="Confirmar Eliminación"
      :style="{ width: '90vw', maxWidth: '420px' }"
      modal
    >
      <div class="confirm-content">
        <div class="confirm-icon">⚠️</div>
        <p>
          ¿Estás seguro de que deseas eliminar el producto
          <strong>{{ productoDelete?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cancelar" @click="mostrarConfirmDialog = false">Cancelar</button>
          <button class="btn-eliminar" @click="eliminar">
            <i class="pi pi-trash"></i> Eliminar
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.lista-container {
  padding: 1.25rem;
}

/* Header */
.header-acciones {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.875rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.4rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  outline: none;
  background: white;
  color: #333;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
}

.total-badge {
  font-size: 0.8rem;
  color: #f48fb1;
  font-weight: 600;
  white-space: nowrap;
}

/* Tabla */
.tabla-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(233, 30, 140, 0.07);
  overflow: hidden;
  border: 1px solid #fce4ec;
}

.table-wrap {
  overflow-x: auto;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  min-width: 580px;
}

.tabla thead {
  background: linear-gradient(135deg, #e91e8c, #f06292);
}

.tabla th {
  padding: 0.85rem 1rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.tabla td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.875rem;
  vertical-align: middle;
}

.tabla tbody tr:last-child td {
  border-bottom: none;
}

.tabla tbody tr:hover td {
  background: #fff9fb;
}

.nro {
  font-weight: 700;
  color: #f48fb1;
  font-size: 0.8rem;
}

/* Producto info */
.producto-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tabla-img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #fce4ec;
  flex-shrink: 0;
}

.producto-nombre {
  font-weight: 600;
  color: #880e4f;
}

/* Badges */
.cat-badge {
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
}

.precio {
  font-weight: 800;
  color: #e91e8c;
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
}

.stock-ok {
  background: #e8f5e9;
  color: #2e7d32;
}

.stock-bajo {
  background: #fce4ec;
  color: #c62828;
}

/* Acciones */
.acciones {
  display: flex;
  gap: 0.4rem;
}

.btn-accion {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: background 0.2s, transform 0.15s;
}

.btn-accion:hover {
  transform: scale(1.1);
}

.btn-accion.editar {
  background: #e3f2fd;
  color: #1565c0;
}

.btn-accion.editar:hover {
  background: #bbdefb;
}

.btn-accion.eliminar {
  background: #fce4ec;
  color: #c62828;
}

.btn-accion.eliminar:hover {
  background: #f8bbd0;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 2.5rem;
}

.empty-icon {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #ccc;
  font-style: italic;
  font-size: 0.9rem;
  margin: 0;
}

/* Paginación */
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #fce4ec;
}

.paginas {
  display: flex;
  gap: 0.3rem;
}

.btn-pag,
.btn-num {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid #f8bbd0;
  background: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  color: #c2185b;
  transition: all 0.2s;
}

.btn-pag:hover:not(:disabled),
.btn-num:hover {
  background: #fce4ec;
}

.btn-pag:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-num.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-color: #e91e8c;
}

/* Dialog */
.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0 1rem;
}

.confirm-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.confirm-content p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
}

.confirm-content strong {
  color: #880e4f;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.btn-cancelar {
  padding: 0.6rem 1.4rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancelar:hover {
  background: #f5f5f5;
}

.btn-eliminar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #ef5350, #e53935);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-eliminar:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@media (max-width: 576px) {
  .header-acciones {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrap {
    max-width: 100%;
  }
}
</style>
