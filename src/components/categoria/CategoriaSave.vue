<script setup lang="ts">
import type { Categoria } from '@/models/categoria'
import http from '@/plugins/axios'
import { ref, watch } from 'vue'

// ─────────────────────────────────────────────────────────────────────────────
// Props / Emits
// ─────────────────────────────────────────────────────────────────────────────
const ENDPOINT = 'categorias'

const props = defineProps({
  mostrar: Boolean,
  categoria: { type: Object as () => Categoria, default: () => ({}) as Categoria },
  modoEdicion: Boolean,
})

const emit = defineEmits(['guardar', 'close'])

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const categoria = ref<Categoria>({ id: 0, nombre: '', descripcion: '', imagenUrl: '' } as Categoria)
const guardando = ref(false)
const subiendoImagen = ref(false)
const errorNombre = ref('')
const dragOver = ref(false)

// ─────────────────────────────────────────────────────────────────────────────
// Watchers
// ─────────────────────────────────────────────────────────────────────────────
watch(
  () => props.mostrar,
  (open) => {
    if (!open) return
    errorNombre.value = ''
    categoria.value = props.categoria?.id
      ? { ...props.categoria }
      : ({ id: 0, nombre: '', descripcion: '', imagenUrl: '' } as Categoria)
  },
)

// ─────────────────────────────────────────────────────────────────────────────
// Upload de imagen
// ─────────────────────────────────────────────────────────────────────────────
async function subirArchivo(file: File) {
  if (!file.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida')
    return
  }
  subiendoImagen.value = true
  const fd = new FormData()
  fd.append('file', file)
  try {
    const { data } = await http.post('uploads', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url = data?.url || data?.imagenUrl || data?.fileUrl || data?.path
    if (url) categoria.value.imagenUrl = url
    else alert('El backend no devolvió una URL de imagen.')
  } catch (err: any) {
    alert(err?.response?.data?.message || 'No se pudo subir la imagen')
  } finally {
    subiendoImagen.value = false
  }
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) subirArchivo(file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) subirArchivo(file)
}

function quitarImagen() {
  categoria.value.imagenUrl = ''
}

// ─────────────────────────────────────────────────────────────────────────────
// Guardar
// ─────────────────────────────────────────────────────────────────────────────
async function handleSave() {
  errorNombre.value = ''
  if (!categoria.value.nombre?.trim()) {
    errorNombre.value = 'El nombre es requerido'
    return
  }

  guardando.value = true
  try {
    const body = {
      nombre: categoria.value.nombre.trim(),
      descripcion: categoria.value.descripcion || '',
      imagenUrl: categoria.value.imagenUrl || '',
    }
    if (props.modoEdicion) await http.patch(`${ENDPOINT}/${categoria.value.id}`, body)
    else await http.post(ENDPOINT, body)

    emit('guardar')
    emit('close')
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Error al guardar la categoría')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="mostrar" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-panel">
          <!-- ── Header ──────────────────────────────────────────────────── -->
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-icon">
                <span>{{ modoEdicion ? '✏️' : '🏷️' }}</span>
              </div>
              <div>
                <h3 class="modal-titulo">
                  {{ modoEdicion ? 'Editar categoría' : 'Nueva categoría' }}
                </h3>
                <p class="modal-sub">
                  {{
                    modoEdicion
                      ? `Modificando: ${categoria.nombre || '—'}`
                      : 'Completa los datos de la categoría'
                  }}
                </p>
              </div>
            </div>
            <button class="btn-close" type="button" @click="emit('close')">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- ── Body ────────────────────────────────────────────────────── -->
          <div class="modal-body">
            <!-- Nombre -->
            <div class="field" :class="{ 'field-has-error': errorNombre }">
              <label class="field-label" for="cat-nombre">
                Nombre <span class="req">*</span>
              </label>
              <div class="input-wrap">
                <i class="pi pi-tag input-icon"></i>
                <input
                  id="cat-nombre"
                  v-model="categoria.nombre"
                  type="text"
                  class="field-input has-icon"
                  placeholder="Ej: Tortas, Cupcakes, Macarons..."
                  maxlength="60"
                  autofocus
                  @input="errorNombre = ''"
                />
              </div>
              <div class="field-footer">
                <span v-if="errorNombre" class="error-msg">
                  <i class="pi pi-exclamation-circle"></i> {{ errorNombre }}
                </span>
                <span class="char-count">{{ categoria.nombre?.length || 0 }}/60</span>
              </div>
            </div>

            <!-- Descripción -->
            <div class="field">
              <label class="field-label" for="cat-desc">Descripción</label>
              <textarea
                id="cat-desc"
                v-model="categoria.descripcion"
                class="field-textarea"
                rows="3"
                placeholder="Describe brevemente esta categoría: qué productos incluye, para qué ocasiones..."
                maxlength="200"
              ></textarea>
              <span class="char-count right">{{ categoria.descripcion?.length || 0 }}/200</span>
            </div>

            <!-- Imagen -->
            <div class="field">
              <label class="field-label">Imagen de la categoría</label>

              <div
                class="upload-zone"
                :class="{ 'drag-over': dragOver, 'tiene-imagen': categoria.imagenUrl }"
                @dragover.prevent="dragOver = true"
                @dragleave="dragOver = false"
                @drop.prevent="onDrop"
              >
                <!-- Preview con imagen cargada -->
                <template v-if="categoria.imagenUrl">
                  <div class="img-preview">
                    <img :src="categoria.imagenUrl" alt="Vista previa de la categoría" />
                    <div class="img-overlay-actions">
                      <label for="cat-img" class="btn-cambiar-img">
                        <i class="pi pi-refresh"></i> Cambiar
                      </label>
                      <button type="button" class="btn-quitar-img" @click="quitarImagen">
                        <i class="pi pi-trash"></i> Quitar
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Estado vacío -->
                <template v-else>
                  <div class="upload-placeholder">
                    <div class="upload-icon-wrap">
                      <i v-if="!subiendoImagen" class="pi pi-image"></i>
                      <i v-else class="pi pi-spin pi-spinner"></i>
                    </div>
                    <p class="upload-titulo">
                      {{ subiendoImagen ? 'Subiendo imagen...' : 'Arrastra una imagen aquí' }}
                    </p>
                    <p class="upload-sub">o</p>
                    <label for="cat-img" class="btn-upload" :class="{ disabled: subiendoImagen }">
                      <i class="pi pi-folder-open"></i>
                      Seleccionar archivo
                    </label>
                    <p class="upload-hint">JPG, PNG, WEBP · Máx. 5MB</p>
                  </div>
                </template>

                <input
                  id="cat-img"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  :disabled="subiendoImagen"
                  @change="onFileChange"
                />
              </div>
            </div>
          </div>

          <!-- ── Footer ──────────────────────────────────────────────────── -->
          <div class="modal-footer">
            <button class="btn-cancelar" type="button" @click="emit('close')" :disabled="guardando">
              Cancelar
            </button>
            <button
              class="btn-guardar"
              type="button"
              @click="handleSave"
              :disabled="guardando || subiendoImagen"
            >
              <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
              {{ guardando ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Crear categoría' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ────────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.4);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ── Panel ──────────────────────────────────────────────────────────────────── */
.modal-panel {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(136, 14, 79, 0.22);
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #fce4ec;
  background: linear-gradient(135deg, #fff0f7, #fff9fb);
  flex-shrink: 0;
}

.modal-header-info {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.modal-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  flex-shrink: 0;
}

.modal-titulo {
  font-size: 1rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.1rem;
}
.modal-sub {
  font-size: 0.72rem;
  color: #bbb;
  margin: 0;
}

.btn-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: #fce4ec;
  color: #c2185b;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-close:hover {
  background: #f8bbd0;
}

/* ── Body ───────────────────────────────────────────────────────────────────── */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  scrollbar-width: thin;
  scrollbar-color: #f48fb1 transparent;
}

/* ── Campos ─────────────────────────────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #880e4f;
  letter-spacing: 0.2px;
}

.req {
  color: #e91e8c;
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.82rem;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input.has-icon {
  padding-left: 2.35rem;
}

.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
  background: white;
}

.field-textarea {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
}

.field-textarea:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
  background: white;
}

.field-has-error .field-input {
  border-color: #ef5350;
}

.field-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 16px;
}

.char-count {
  font-size: 0.72rem;
  color: #ccc;
}
.char-count.right {
  text-align: right;
  font-size: 0.72rem;
  color: #ccc;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: #ef5350;
  font-weight: 600;
}

/* ── Upload zone ────────────────────────────────────────────────────────────── */
.upload-zone {
  border: 2px dashed #f8bbd0;
  border-radius: 16px;
  background: #fff9fb;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.upload-zone.drag-over {
  border-color: #e91e8c;
  background: #fff0f7;
  box-shadow: 0 0 0 4px rgba(233, 30, 140, 0.08);
}

.upload-zone.tiene-imagen {
  border-style: solid;
  border-color: #f48fb1;
  background: white;
}

/* Placeholder vacío */
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 2.25rem 1.5rem;
  text-align: center;
}

.upload-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fce4ec;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #e91e8c;
  margin-bottom: 0.35rem;
}

.upload-titulo {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.9rem;
  margin: 0;
}
.upload-sub {
  font-size: 0.75rem;
  color: #ccc;
  margin: 0;
}
.upload-hint {
  font-size: 0.7rem;
  color: #ccc;
  margin-top: 0.15rem;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  margin: 0.25rem 0;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.25);
  transition: opacity 0.2s;
}

.btn-upload:hover:not(.disabled) {
  opacity: 0.9;
}
.btn-upload.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Preview */
.img-preview {
  position: relative;
  display: block;
}

.img-preview img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.img-overlay-actions {
  position: absolute;
  inset: 0;
  background: rgba(136, 14, 79, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.img-preview:hover .img-overlay-actions {
  opacity: 1;
}

.btn-cambiar-img,
.btn-quitar-img {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cambiar-img {
  background: white;
  color: #e91e8c;
}

.btn-quitar-img {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
}

.btn-cambiar-img:hover {
  background: #fce4ec;
}
.btn-quitar-img:hover {
  background: rgba(255, 255, 255, 0.3);
}

.file-input-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #fce4ec;
  background: #fff9fb;
  flex-shrink: 0;
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
  transition:
    opacity 0.2s,
    transform 0.2s;
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

/* ── Transición ─────────────────────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-panel,
.modal-fade-leave-to .modal-panel {
  transform: translateY(14px);
  opacity: 0;
}
</style>
