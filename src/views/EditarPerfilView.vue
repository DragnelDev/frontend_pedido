<script setup lang="ts">
// ── SIN CAMBIOS ── (lógica intacta)
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

const router = useRouter()

const cargando      = ref(true)
const guardando     = ref(false)
const subiendoImg   = ref(false)
const dragOver      = ref(false)
const error         = ref<string | null>(null)
const exito         = ref<string | null>(null)

const emailUsuario  = ref('')
const idUsuario     = ref<number | null>(null)
const idCliente     = ref<number | null>(null)

const fileInput     = ref<HTMLInputElement | null>(null)

const form = ref({
  nombre:          '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  celular:         '',
  direccion:       '',
  imagenUrl:       '',
})

const nombreCompleto = computed(() =>
  [form.value.nombre, form.value.apellidoPaterno].filter(Boolean).join(' ') || 'Tu nombre'
)

const inicial = computed(() => {
  const s = form.value.nombre || emailUsuario.value || '?'
  return s.charAt(0).toUpperCase()
})

const AVATAR_COLORS = [
  ['#fce4ec','#e91e8c'], ['#e8eaf6','#3949ab'], ['#e8f5e9','#2e7d32'],
  ['#fff3e0','#e65100'], ['#f3e5f5','#7b1fa2'], ['#e3f2fd','#1565c0'],
]

const avatarColor = computed(() => {
  const code = inicial.value.charCodeAt(0) % AVATAR_COLORS.length
  const [bg, color] = AVATAR_COLORS[code]
  return { bg, color }
})

onMounted(async () => {
  const token   = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null
  if (!token || !payload?.sub) { router.replace('/login'); return }

  idUsuario.value = Number(payload.sub)

  try {
    const { data } = await http.get(`/usuarios/${payload.sub}`)
    emailUsuario.value = data.email || ''

    if (data.cliente) {
      idCliente.value                  = data.cliente.id
      form.value.nombre                = data.cliente.nombre          || ''
      form.value.apellidoPaterno       = data.cliente.apellidoPaterno || ''
      form.value.apellidoMaterno       = data.cliente.apellidoMaterno || ''
      form.value.celular               = data.cliente.celular         || ''
      form.value.direccion             = data.cliente.direccion       || ''
    }

    form.value.imagenUrl = data.imagenUrl || ''

  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar tus datos.'
  } finally {
    cargando.value = false
  }
})

async function subirImagen(file: File) {
  if (!file.type.startsWith('image/')) {
    error.value = 'El archivo no es una imagen válida.'
    return
  }
  subiendoImg.value = true
  error.value       = null

  const fd = new FormData()
  fd.append('file', file)

  try {
    const { data } = await http.post('/uploads', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const url = data?.url || data?.imagenUrl || data?.fileUrl || data?.path
    if (url) {
      form.value.imagenUrl = url
      mostrarExito('¡Foto actualizada!')
    } else {
      error.value = 'El servidor no devolvió una URL de imagen.'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo subir la imagen.'
  } finally {
    subiendoImg.value = false
  }
}

function alSeleccionarImagen(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) subirImagen(file)
}

function alSoltarImagen(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) subirImagen(file)
}

function quitarImagen() {
  form.value.imagenUrl = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function guardarCambios() {
  if (!idUsuario.value) return
  if (!form.value.nombre.trim())          { error.value = 'El nombre es obligatorio.';          return }
  if (!form.value.apellidoPaterno.trim()) { error.value = 'El apellido paterno es obligatorio.'; return }

  guardando.value = true
  error.value     = null

  try {
    await http.put(`/usuarios/${idUsuario.value}`, {
      imagenUrl: form.value.imagenUrl,
      cliente: {
        nombre:          form.value.nombre.trim(),
        apellidoPaterno: form.value.apellidoPaterno.trim(),
        apellidoMaterno: form.value.apellidoMaterno.trim(),
        celular:         form.value.celular.trim(),
        direccion:       form.value.direccion.trim(),
      },
    })
    mostrarExito('¡Perfil actualizado correctamente!')
    setTimeout(() => router.push('/perfil'), 1500)
  } catch (e: any) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join('\n') : (msg || 'Error al guardar los cambios.')
  } finally {
    guardando.value = false
  }
}

function mostrarExito(msg: string) {
  exito.value = msg
  setTimeout(() => { exito.value = null }, 3000)
}

function cancelar() { router.push('/perfil') }
</script>

<template>
  <div class="page-wrap">

    <!-- ── Cargando ── -->
    <div v-if="cargando" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p>Cargando tus datos...</p>
    </div>

    <section v-else class="perfil-container">

      <!-- ── Header ── -->
      <div class="page-header">
        <span class="section-tag">
          <i class="pi pi-user"></i> Mi cuenta
        </span>
        <h2 class="page-titulo">Editar perfil</h2>
        <p class="page-sub">Actualiza tu información personal y de contacto</p>
      </div>

      <div class="profile-card">

        <!-- ── Hero ── -->
        <div class="card-hero">
          <div class="avatar-ring">
            <div
              v-if="!form.imagenUrl"
              class="avatar-letra"
              :style="`background:${avatarColor.bg}; color:${avatarColor.color}`"
            >{{ inicial }}</div>
            <img v-else :src="form.imagenUrl" alt="Avatar" class="avatar-img" />
          </div>
          <div class="hero-info">
            <p class="hero-nombre">{{ nombreCompleto }}</p>
            <p class="hero-email">{{ emailUsuario }}</p>
          </div>
          <button type="button" class="btn-hero-edit" @click="fileInput?.click()">
            <i class="pi pi-camera"></i>
          </button>
        </div>

        <!-- ── Form body ── -->
        <div class="card-body">

          <Transition name="banner-fade">
            <div v-if="error" class="banner banner-err">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ error }}</span>
            </div>
          </Transition>
          <Transition name="banner-fade">
            <div v-if="exito" class="banner banner-ok">
              <i class="pi pi-check-circle"></i>
              <span>{{ exito }}</span>
            </div>
          </Transition>

          <form @submit.prevent="guardarCambios" novalidate>

            <!-- ── Sección 1: Foto ── -->
            <div class="sec-header">
              <span class="sec-num">1</span>
              <div>
                <p class="sec-titulo">Foto de perfil</p>
                <p class="sec-sub">Sube una imagen o arrastra desde tu equipo</p>
              </div>
            </div>

            <div
              class="upload-zone"
              :class="{ 'drag-over': dragOver, 'tiene-img': form.imagenUrl }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="alSoltarImagen"
              @click="fileInput?.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display:none"
                @change="alSeleccionarImagen"
              />

              <div v-if="subiendoImg" class="upload-estado">
                <i class="pi pi-spin pi-spinner upload-spinner"></i>
                <p class="upload-titulo">Subiendo tu foto...</p>
              </div>

              <template v-else-if="form.imagenUrl">
                <div class="img-preview">
                  <img :src="form.imagenUrl" alt="Vista previa" />
                  <div class="img-overlay">
                    <i class="pi pi-camera"></i>
                    <span>Cambiar foto</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-quitar-img"
                  @click.stop="quitarImagen"
                >
                  <i class="pi pi-times"></i> Quitar foto
                </button>
              </template>

              <template v-else>
                <div class="upload-estado">
                  <div class="upload-icon-wrap">
                    <i class="pi pi-cloud-upload"></i>
                  </div>
                  <p class="upload-titulo">Arrastra tu foto aquí</p>
                  <span class="upload-hint">o haz clic para explorar · JPG, PNG, WEBP</span>
                </div>
              </template>
            </div>

            <div class="sec-divider"></div>

            <!-- ── Sección 2: Datos personales ── -->
            <div class="sec-header">
              <span class="sec-num">2</span>
              <div>
                <p class="sec-titulo">Datos personales</p>
                <p class="sec-sub">Nombre y apellidos tal como aparecerán en tus pedidos</p>
              </div>
            </div>

            <div class="fields-grid">
              <div class="field full">
                <label class="field-label" for="nombre">
                  Nombre <span class="req">*</span>
                </label>
                <div class="input-wrap">
                  <i class="pi pi-user input-icon"></i>
                  <input
                    id="nombre"
                    v-model="form.nombre"
                    type="text"
                    class="field-input has-icon"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              </div>

              <div class="field">
                <label class="field-label" for="apPat">
                  Apellido paterno <span class="req">*</span>
                </label>
                <input
                  id="apPat"
                  v-model="form.apellidoPaterno"
                  type="text"
                  class="field-input"
                  placeholder="Apellido paterno"
                  required
                />
              </div>

              <div class="field">
                <label class="field-label" for="apMat">Apellido materno</label>
                <input
                  id="apMat"
                  v-model="form.apellidoMaterno"
                  type="text"
                  class="field-input"
                  placeholder="Apellido materno (opcional)"
                />
              </div>
            </div>

            <div class="sec-divider"></div>

            <!-- ── Sección 3: Contacto ── -->
            <div class="sec-header">
              <span class="sec-num">3</span>
              <div>
                <p class="sec-titulo">Contacto y entrega</p>
                <p class="sec-sub">Datos que usamos para coordinar tus pedidos</p>
              </div>
            </div>

            <div class="fields-grid">
              <div class="field full">
                <label class="field-label">Correo electrónico</label>
                <div class="input-wrap">
                  <i class="pi pi-envelope input-icon"></i>
                  <input
                    :value="emailUsuario"
                    type="email"
                    class="field-input has-icon"
                    disabled
                  />
                </div>
                <span class="field-hint">El correo no puede modificarse.</span>
              </div>

              <div class="field">
                <label class="field-label" for="celular">Celular</label>
                <div class="input-wrap">
                  <i class="pi pi-mobile input-icon"></i>
                  <input
                    id="celular"
                    v-model="form.celular"
                    type="tel"
                    class="field-input has-icon"
                    placeholder="77123456"
                  />
                </div>
              </div>

              <div class="field">
                <label class="field-label" for="direccion">Dirección de entrega</label>
                <div class="input-wrap">
                  <i class="pi pi-map-marker input-icon"></i>
                  <input
                    id="direccion"
                    v-model="form.direccion"
                    type="text"
                    class="field-input has-icon"
                    placeholder="Calle, número, barrio..."
                  />
                </div>
              </div>
            </div>

            <div class="sec-divider"></div>

            <!-- ── Acciones ── -->
            <div class="form-acciones">
              <button
                type="button"
                class="btn-cancelar"
                :disabled="guardando || subiendoImg"
                @click="cancelar"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-guardar"
                :disabled="guardando || subiendoImg"
              >
                <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
                {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>

          </form>
        </div>
      </div>

    </section>
  </div>
</template>

<style scoped>
/* ── Base ── */
.page-wrap {
  min-height: 80vh;
  padding: 2.5rem 1rem 4rem;
  background: #FFE3EE;
  display: flex;
  justify-content: center;
  font-family: 'Segoe UI', 'Nunito', Arial, sans-serif;
}

/* ── Loading ── */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #D83B7E;
  font-size: 0.9rem;
  font-weight: 600;
}

.loading-spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid #F2C4D8;
  border-top-color: #D83B7E;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Contenedor ── */
.perfil-container {
  width: 100%;
  max-width: 560px;
}

/* ── Header ── */
.page-header {
  margin-bottom: 1.5rem;
}

.section-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #D83B7E;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 0.32rem 0.95rem;
  border-radius: 50px;
  margin-bottom: 0.55rem;
  box-shadow: 0 2px 8px rgba(216, 59, 126, 0.28);
}

.page-titulo {
  font-size: clamp(1.4rem, 4vw, 1.8rem);
  font-weight: 800;
  color: #4A0E2E;
  margin: 0 0 0.2rem;
}

.page-sub {
  font-size: 0.875rem;
  color: #9E5070;
  margin: 0;
}

/* ── Profile card ── */
.profile-card {
  background: #ffffff;
  border-radius: 24px;
  border: 1.5px solid #F2C4D8;
  box-shadow: 0 8px 32px rgba(216, 59, 126, 0.10);
  overflow: hidden;
}

/* ── Hero ── */
.card-hero {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 1.4rem 1.75rem;
  background: #FFF5F9;
  border-bottom: 1.5px solid #F2C4D8;
  position: relative;
}

.avatar-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 3px;
  background: #D83B7E;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(216, 59, 126, 0.30);
}

.avatar-letra,
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  background: white;
  object-fit: cover;
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.hero-nombre {
  font-size: 0.95rem;
  font-weight: 800;
  color: #4A0E2E;
  margin: 0 0 0.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-email {
  font-size: 0.78rem;
  color: #B07090;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-hero-edit {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid #F2C4D8;
  background: white;
  color: #D83B7E;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
  flex-shrink: 0;
}

.btn-hero-edit:hover {
  background: #FFE3EE;
  border-color: #D83B7E;
  transform: scale(1.08);
}

/* ── Card body ── */
.card-body {
  padding: 1.5rem 1.75rem;
}

/* ── Banners ── */
.banner {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 500;
  margin-bottom: 1.1rem;
  white-space: pre-line;
  line-height: 1.4;
}

.banner-err {
  background: #fff1f4;
  color: #b0203a;
  border: 1.5px solid #F5B8C4;
}

.banner-err i {
  color: #D83B7E;
  flex-shrink: 0;
}

.banner-ok {
  background: #f0faf4;
  color: #1a6b3a;
  border: 1.5px solid #a8e0bc;
}

.banner-ok i {
  color: #22a05a;
  flex-shrink: 0;
}

/* ── Secciones ── */
.sec-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sec-num {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #D83B7E;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(216, 59, 126, 0.28);
}

.sec-titulo {
  font-size: 0.88rem;
  font-weight: 700;
  color: #4A0E2E;
  margin: 0 0 0.1rem;
}

.sec-sub {
  font-size: 0.72rem;
  color: #B07090;
  margin: 0;
}

.sec-divider {
  height: 1.5px;
  background: linear-gradient(90deg, transparent, #F2C4D8, transparent);
  margin: 1.3rem 0;
}

/* ── Upload zone ── */
.upload-zone {
  border: 2px dashed #F2C4D8;
  border-radius: 16px;
  background: #FFF5F9;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-zone:hover {
  border-color: #D83B7E;
  background: #FFE3EE;
}

.upload-zone.drag-over {
  border-color: #4A0E2E;
  background: #ffd6e8;
  box-shadow: 0 0 0 4px rgba(216, 59, 126, 0.13);
}

.upload-zone.tiene-img {
  border-style: solid;
  border-color: #F2C4D8;
  background: white;
}

.upload-estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 2rem 1.5rem;
  text-align: center;
}

.upload-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #FFE3EE;
  border: 1.5px solid #F2C4D8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #D83B7E;
  margin-bottom: 0.25rem;
}

.upload-spinner {
  font-size: 2rem;
  color: #D83B7E;
}

.upload-titulo {
  font-weight: 700;
  color: #4A0E2E;
  font-size: 0.88rem;
  margin: 0;
}

.upload-hint {
  font-size: 0.72rem;
  color: #B07090;
}

/* Preview */
.img-preview {
  position: relative;
  width: 100%;
  display: block;
}

.img-preview img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(74, 14, 46, 0.52);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s;
}

.upload-zone:hover .img-overlay {
  opacity: 1;
}

.img-overlay i {
  font-size: 1.5rem;
}

.btn-quitar-img {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.95rem;
  margin: 0.65rem 0 0.5rem;
  background: #FFE3EE;
  color: #D83B7E;
  border: 1.5px solid #F2C4D8;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-quitar-img:hover {
  background: #F2C4D8;
  border-color: #D83B7E;
}

/* ── Campos ── */
.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field.full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #7A2B50;
  letter-spacing: 0.2px;
}

.req {
  color: #D83B7E;
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #D83B7E;
  font-size: 0.82rem;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.68rem 1rem;
  border: 1.5px solid #F2C4D8;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #4A0E2E;
  outline: none;
  background: #FFF5F9;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input::placeholder {
  color: #C090A8;
}

.field-input.has-icon {
  padding-left: 2.35rem;
}

.field-input:focus {
  border-color: #D83B7E;
  box-shadow: 0 0 0 3px rgba(216, 59, 126, 0.11);
  background: white;
}

.field-input:disabled {
  background: #FFF0F5;
  color: #C090A8;
  cursor: not-allowed;
  border-color: #F5D8E6;
}

.field-hint {
  font-size: 0.7rem;
  color: #B07090;
}

/* ── Acciones ── */
.form-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
}

.btn-cancelar {
  padding: 0.68rem 1.4rem;
  border-radius: 50px;
  border: 1.5px solid #E8C0D0;
  background: white;
  color: #7A2B50;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  font-family: inherit;
}

.btn-cancelar:hover:not(:disabled) {
  background: #FFE3EE;
  border-color: #D83B7E;
  color: #D83B7E;
}

.btn-cancelar:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-guardar {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.68rem 1.6rem;
  border-radius: 50px;
  border: none;
  background: #D83B7E;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(216, 59, 126, 0.32);
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.btn-guardar:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(216, 59, 126, 0.40);
}

.btn-guardar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ── Transiciones ── */
.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.banner-fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.banner-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .card-body     { padding: 1.25rem; }
  .fields-grid   { grid-template-columns: 1fr; }
  .field.full    { grid-column: 1; }
  .form-acciones { flex-direction: column-reverse; }
  .btn-cancelar,
  .btn-guardar   { width: 100%; justify-content: center; }
}
</style>
