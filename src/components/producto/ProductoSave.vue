<script setup lang="ts">
import type { Categoria } from '@/models/categoria'
import type { Producto } from '@/models/producto'
import http from '@/plugins/axios'
import { Dialog, Select } from 'primevue'
import { computed, ref, watch } from 'vue'

const ENDPOINT = 'productos'
const props = defineProps({
  mostrar: Boolean,
  producto: {
    type: Object as () => Producto,
    default: () => ({}) as Producto,
  },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const categorias = ref<Categoria[]>([])
const guardando = ref(false)
const subiendoImagen = ref(false)

const dialogVisible = computed({
  get: () => props.mostrar,
  set: (value) => { if (!value) emit('close') },
})

const producto = ref<Producto>({ ...props.producto })
const idCategoria = ref<number>(0)

watch(
  () => props.producto,
  (p) => {
    if (p?.id) {
      producto.value = {
        ...p,
        precio: Number(p.precio) || 0,
        stock: Number(p.stock) || 0,
        porciones: Number(p.porciones) || 0,
        tiempoPreparacion: Number(p.tiempoPreparacion) || 0,
      }
      idCategoria.value = p.idCategoria ?? p.categoria?.id ?? 0
    }
  },
)

async function obtenerCategorias() {
  categorias.value = await http.get('categorias').then((r) => r.data)
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { alert('Por favor selecciona una imagen válida'); return }

  subiendoImagen.value = true
  const fd = new FormData()
  fd.append('file', file)

  try {
    const response = await http.post('/uploads', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const data = response.data
    const imageUrl = data?.url || data?.imagenUrl || data?.fileUrl || data?.path || (typeof data === 'string' ? data : null)
    if (imageUrl) {
      producto.value.imagenUrl = imageUrl
    } else {
      alert('El backend no devolvió URL de imagen')
    }
  } catch (err: any) {
    alert(`No se pudo subir la imagen: ${err.response?.data?.message || err.message}`)
  } finally {
    subiendoImagen.value = false
  }
}

async function handleSave() {
  const precio = Number(producto.value.precio) || 0
  const stock = Number(producto.value.stock) || 0

  if (!producto.value.nombre?.trim()) { alert('El nombre es requerido'); return }
  if (precio <= 0) { alert('El precio debe ser mayor a 0'); return }
  if (stock < 0) { alert('El stock no puede ser negativo'); return }
  if (!idCategoria.value) { alert('Selecciona una categoría'); return }

  guardando.value = true
  try {
    const body = {
      idCategoria: idCategoria.value,
      nombre: producto.value.nombre,
      descripcion: producto.value.descripcion,
      precio,
      stock,
      porciones: Number(producto.value.porciones) || 0,
      tiempoPreparacion: Number(producto.value.tiempoPreparacion) || 0,
      imagenUrl: producto.value.imagenUrl,
    }

    if (props.modoEdicion) {
      await http.patch(`${ENDPOINT}/${producto.value.id}`, body)
    } else {
      await http.post(ENDPOINT, body)
    }

    emit('guardar')
    producto.value = {} as Producto
    dialogVisible.value = false
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Error al guardar el producto')
  } finally {
    guardando.value = false
  }
}

watch(
  () => props.mostrar,
  (open) => {
    if (open) {
      obtenerCategorias()
      if (props.producto?.id) {
        producto.value = {
          ...props.producto,
          precio: Number(props.producto.precio) || 0,
          stock: Number(props.producto.stock) || 0,
          porciones: Number(props.producto.porciones) || 0,
          tiempoPreparacion: Number(props.producto.tiempoPreparacion) || 0,
        }
        idCategoria.value = props.producto.idCategoria ?? props.producto.categoria?.id ?? 0
      } else {
        producto.value = {
          id: 0, idCategoria: 0, nombre: '', descripcion: '',
          precio: 0, stock: 0, porciones: 0, tiempoPreparacion: 0,
          imagenUrl: '', categoria: { id: 0 } as Categoria,
        } as Producto
        idCategoria.value = 0
      }
    }
  },
)
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="props.modoEdicion ? '✏️ Editar producto' : '🍰 Nuevo producto'"
    :style="{ width: '90vw', maxWidth: '540px' }"
    modal
    :closable="true"
  >
    <div class="form-body">
      <!-- Categoría -->
      <div class="field">
        <label class="field-label">Categoría <span class="required">*</span></label>
        <Select
          v-model="idCategoria"
          :options="categorias"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Selecciona una categoría"
          class="berry-select"
        />
      </div>

      <!-- Nombre -->
      <div class="field">
        <label class="field-label" for="p-nombre">Nombre <span class="required">*</span></label>
        <input
          id="p-nombre"
          v-model="producto.nombre"
          type="text"
          class="field-input"
          placeholder="Ej: Torta de fresa, Cupcake de vainilla..."
          maxlength="60"
        />
        <span class="field-hint">{{ producto.nombre?.length || 0 }}/60</span>
      </div>

      <!-- Descripción -->
      <div class="field">
        <label class="field-label" for="p-desc">Descripción</label>
        <textarea
          id="p-desc"
          v-model="producto.descripcion"
          class="field-textarea"
          rows="3"
          placeholder="Describe brevemente el producto..."
          maxlength="200"
        ></textarea>
        <span class="field-hint">{{ producto.descripcion?.length || 0 }}/200</span>
      </div>

      <!-- Fila: Precio + Stock -->
      <div class="field-row">
        <div class="field">
          <label class="field-label" for="p-precio">Precio (Bs.) <span class="required">*</span></label>
          <input
            id="p-precio"
            v-model.number="producto.precio"
            type="number"
            min="0"
            step="0.5"
            class="field-input"
            placeholder="0.00"
          />
        </div>
        <div class="field">
          <label class="field-label" for="p-stock">Stock <span class="required">*</span></label>
          <input
            id="p-stock"
            v-model.number="producto.stock"
            type="number"
            min="0"
            class="field-input"
            placeholder="0"
          />
        </div>
      </div>

      <!-- Fila: Porciones + Tiempo preparación -->
      <div class="field-row">
        <div class="field">
          <label class="field-label" for="p-porciones">Porciones</label>
          <input
            id="p-porciones"
            v-model.number="producto.porciones"
            type="number"
            min="0"
            class="field-input"
            placeholder="0"
          />
        </div>
        <div class="field">
          <label class="field-label" for="p-tiempo">Tiempo prep. (min)</label>
          <input
            id="p-tiempo"
            v-model.number="producto.tiempoPreparacion"
            type="number"
            min="0"
            class="field-input"
            placeholder="0"
          />
        </div>
      </div>

      <!-- Imagen -->
      <div class="field">
        <label class="field-label">Imagen</label>
        <div class="upload-area">
          <label for="p-img" class="upload-label" :class="{ uploading: subiendoImagen }">
            <i :class="subiendoImagen ? 'pi pi-spin pi-spinner' : 'pi pi-upload'"></i>
            <span>{{ subiendoImagen ? 'Subiendo imagen...' : 'Seleccionar imagen' }}</span>
          </label>
          <input
            id="p-img"
            type="file"
            accept="image/*"
            class="file-input"
            @change="onFileChange"
            :disabled="subiendoImagen"
          />
        </div>

        <div v-if="producto.imagenUrl" class="img-preview">
          <img :src="producto.imagenUrl" alt="Vista previa" />
          <div class="img-overlay"><span>Vista previa</span></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="dialog-footer">
        <button class="btn-cancelar" @click="dialogVisible = false" :disabled="guardando">
          Cancelar
        </button>
        <button class="btn-guardar" @click="handleSave" :disabled="guardando || subiendoImagen">
          <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
          <span>{{ guardando ? 'Guardando...' : 'Guardar' }}</span>
        </button>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 0.25rem 0 0.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #880e4f;
}

.required {
  color: #e91e8c;
  margin-left: 2px;
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.field-input:focus,
.field-textarea:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
  background: white;
}

/* Override PrimeVue Select para que herede el estilo rosa */
.berry-select {
  width: 100%;
}

:deep(.berry-select .p-select) {
  border: 1.5px solid #f8bbd0 !important;
  border-radius: 10px !important;
  background: #fff9fb !important;
  width: 100%;
}

:deep(.berry-select .p-select:focus),
:deep(.berry-select .p-select.p-focus) {
  border-color: #e91e8c !important;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08) !important;
}

.field-hint {
  font-size: 0.75rem;
  color: #ccc;
  text-align: right;
}

/* Upload */
.upload-area {
  position: relative;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: #fce4ec;
  color: #c2185b;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  border: 1.5px dashed #f48fb1;
}

.upload-label:hover {
  background: #f8bbd0;
}

.upload-label.uploading {
  opacity: 0.7;
  cursor: not-allowed;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 0;
  height: 0;
}

.img-preview {
  position: relative;
  margin-top: 0.75rem;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #fce4ec;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.12);
}

.img-preview img {
  width: 110px;
  height: 110px;
  object-fit: cover;
  display: block;
}

.img-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(194, 24, 91, 0.65);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  padding: 0.2rem;
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.btn-cancelar {
  padding: 0.65rem 1.4rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancelar:hover:not(:disabled) {
  background: #f5f5f5;
}

.btn-cancelar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-guardar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-guardar:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 480px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
