<script setup lang="ts">
import type { Categoria } from '@/models/categoria'
import http from '@/plugins/axios'
import { Dialog } from 'primevue'
import { computed, ref, watch } from 'vue'

const ENDPOINT = 'categorias'
const props = defineProps({
  mostrar: Boolean,
  categoria: {
    type: Object as () => Categoria,
    default: () => ({}) as Categoria,
  },
  modoEdicion: Boolean,
})
const emit = defineEmits(['guardar', 'close'])

const dialogVisible = computed({
  get: () => props.mostrar,
  set: (value) => { if (!value) emit('close') },
})

const categoria = ref<Categoria>({ ...props.categoria })
const guardando = ref(false)
const subiendoImagen = ref(false)

watch(
  () => props.categoria,
  (newVal) => { categoria.value = { ...newVal } },
)

watch(
  () => props.mostrar,
  (open) => {
    if (open) {
      if (props.categoria?.id) {
        categoria.value = { ...props.categoria }
      } else {
        categoria.value = { id: 0, nombre: '', descripcion: '', imagenUrl: '' } as Categoria
      }
    }
  },
)

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  subiendoImagen.value = true
  const fd = new FormData()
  fd.append('file', file)

  try {
    const { data } = await http.post('uploads', fd)
    if (data?.url) categoria.value.imagenUrl = data.url
  } catch (err: any) {
    alert(err?.response?.data?.message || 'No se pudo subir la imagen')
  } finally {
    subiendoImagen.value = false
  }
}

async function handleSave() {
  if (!categoria.value.nombre?.trim()) { alert('El nombre es requerido'); return }

  guardando.value = true
  try {
    const body = {
      nombre: categoria.value.nombre,
      descripcion: categoria.value.descripcion,
      imagenUrl: categoria.value.imagenUrl || '',
    }

    if (props.modoEdicion) {
      await http.patch(`${ENDPOINT}/${categoria.value.id}`, body)
    } else {
      await http.post(ENDPOINT, body)
    }

    emit('guardar')
    dialogVisible.value = false
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Error al guardar la categoría')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="props.modoEdicion ? '✏️ Editar categoría' : '🏷️ Nueva categoría'"
    :style="{ width: '90vw', maxWidth: '480px' }"
    modal
    :closable="true"
  >
    <div class="form-body">
      <!-- Nombre -->
      <div class="field">
        <label class="field-label" for="cat-nombre">Nombre <span class="required">*</span></label>
        <input
          id="cat-nombre"
          v-model="categoria.nombre"
          type="text"
          class="field-input"
          placeholder="Ej: Tortas, Cupcakes..."
          maxlength="60"
          autofocus
        />
        <span class="field-hint">{{ categoria.nombre?.length || 0 }}/60</span>
      </div>

      <!-- Descripción -->
      <div class="field">
        <label class="field-label" for="cat-desc">Descripción</label>
        <textarea
          id="cat-desc"
          v-model="categoria.descripcion"
          class="field-textarea"
          rows="3"
          placeholder="Describe brevemente esta categoría..."
          maxlength="200"
        ></textarea>
        <span class="field-hint">{{ categoria.descripcion?.length || 0 }}/200</span>
      </div>

      <!-- Imagen -->
      <div class="field">
        <label class="field-label" for="cat-img">Imagen</label>
        <div class="upload-area">
          <label for="cat-img" class="upload-label" :class="{ uploading: subiendoImagen }">
            <i :class="subiendoImagen ? 'pi pi-spin pi-spinner' : 'pi pi-upload'"></i>
            <span>{{ subiendoImagen ? 'Subiendo...' : 'Seleccionar imagen' }}</span>
          </label>
          <input
            id="cat-img"
            type="file"
            accept="image/*"
            class="file-input"
            @change="onFileChange"
            :disabled="subiendoImagen"
          />
        </div>

        <!-- Preview -->
        <div v-if="categoria.imagenUrl" class="img-preview">
          <img :src="categoria.imagenUrl" alt="Vista previa" />
          <div class="img-overlay">
            <span>Vista previa</span>
          </div>
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
  gap: 1.25rem;
  padding: 0.25rem 0 0.5rem;
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
  cursor: pointer;
  width: 0;
  height: 0;
}

/* Preview */
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
</style>
