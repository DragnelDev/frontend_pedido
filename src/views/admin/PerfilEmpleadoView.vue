<script setup lang="ts">
// ── SIN CAMBIOS ── (lógica intacta)
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

const router = useRouter()

const subiendoImagen = ref(false)
const dragOver       = ref(false)

const cargando     = ref(true)
const guardando    = ref(false)
const modoEdicion  = ref(false)
const error        = ref<string | null>(null)
const mensajeExito = ref<string | null>(null)

const usuario = ref({
  id: 0,
  idEmpleado: null as number | null,
  idCliente: null as number | null,
  email: '',
  rol: '',
  imagenUrl: ''
})

const empleado = ref({
  id: 0,
  cedulaIdentidad: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  direccion: '',
  celular: '',
  email: '',
  fechaIngreso: '',
  cargo: '',
  salario: '',
  activo: true
})

const formulario = ref({
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  celular: '',
  direccion: '',
  imagenUrl: ''
})

onMounted(async () => {
  const token   = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null

  if (!token || !payload?.sub || payload?.rol !== 'EMPLEADO') {
    router.replace('/login')
    return
  }

  try {
    const { data } = await http.get(`/usuarios/${payload.sub}`)
    usuario.value = data

    if (data.empleado) {
      empleado.value = data.empleado
      formulario.value.nombre          = data.empleado.nombre || ''
      formulario.value.apellidoPaterno = data.empleado.apellidoPaterno || ''
      formulario.value.apellidoMaterno = data.empleado.apellidoMaterno || ''
      formulario.value.celular         = data.empleado.celular || ''
      formulario.value.direccion       = data.empleado.direccion || ''
    }
    formulario.value.imagenUrl = data.imagenUrl || ''
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al cargar el perfil de empleado'
  } finally {
    cargando.value = false
  }
})

const nombreCompleto = computed(() => {
  if (!empleado.value.nombre) return '—'
  return [empleado.value.nombre, empleado.value.apellidoPaterno, empleado.value.apellidoMaterno]
    .filter(Boolean).join(' ')
})

const inicial = computed(() => {
  return (empleado.value.nombre || usuario.value.email || '?').charAt(0).toUpperCase()
})

const formatearMoneda = (valor: string) => {
  if (!valor) return '0.00'
  return parseFloat(valor).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })
}

const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return '—'
  return new Date(fechaStr).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
}

const activarEdicion = () => { modoEdicion.value = true }

const cancelarEdicion = () => {
  modoEdicion.value = false
  error.value = null
  formulario.value.nombre          = empleado.value.nombre
  formulario.value.apellidoPaterno = empleado.value.apellidoPaterno
  formulario.value.apellidoMaterno = empleado.value.apellidoMaterno
  formulario.value.celular         = empleado.value.celular
  formulario.value.direccion       = empleado.value.direccion
  formulario.value.imagenUrl       = usuario.value.imagenUrl
}

const guardarCambios = async () => {
  guardando.value    = true
  error.value        = null
  mensajeExito.value = null

  try {
    await http.put(`/usuarios/${usuario.value.id}`, {
      imagenUrl: formulario.value.imagenUrl,
      empleado: {
        ...empleado.value,
        nombre:          formulario.value.nombre,
        apellidoPaterno: formulario.value.apellidoPaterno,
        apellidoMaterno: formulario.value.apellidoMaterno,
        celular:         formulario.value.celular,
        direccion:       formulario.value.direccion
      }
    })

    empleado.value.nombre          = formulario.value.nombre
    empleado.value.apellidoPaterno = formulario.value.apellidoPaterno
    empleado.value.apellidoMaterno = formulario.value.apellidoMaterno
    empleado.value.celular         = formulario.value.celular
    empleado.value.direccion       = formulario.value.direccion
    usuario.value.imagenUrl        = formulario.value.imagenUrl

    mensajeExito.value = '¡Perfil actualizado correctamente!'
    modoEdicion.value  = false
    setTimeout(() => { mensajeExito.value = null }, 3000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al guardar las modificaciones'
  } finally {
    guardando.value = false
  }
}

const alSeleccionarImagen = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.[0]) await subirImagen(target.files[0])
}

const alSoltarImagen = async (event: DragEvent) => {
  dragOver.value = false
  if (event.dataTransfer?.files?.[0]) await subirImagen(event.dataTransfer.files[0])
}

const subirImagen = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    error.value = 'El archivo seleccionado no es una imagen válida.'
    return
  }
  subiendoImagen.value = true
  error.value = null
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await http.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    formulario.value.imagenUrl = data.url
    mensajeExito.value = '¡Imagen subida con éxito!'
    setTimeout(() => { mensajeExito.value = null }, 2000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo subir la imagen'
  } finally {
    subiendoImagen.value = false
  }
}
</script>

<template>
  <div class="perfil-page">

    <!-- Estado de carga -->
    <div v-if="cargando" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p>Cargando perfil...</p>
    </div>

    <section v-else class="dashboard-container">

      <!-- ── Header ── -->
      <div class="dashboard-header">
        <div>
          <span class="badge-rol">
            <i class="pi pi-briefcase"></i>
            {{ empleado.cargo || usuario.rol }}
          </span>
          <h2 class="page-titulo">Mi Perfil Laboral</h2>
          <p class="page-sub">Gestión de cuenta interna · Berry Sweet</p>
        </div>
        <button v-if="!modoEdicion" class="btn-editar-top" @click="activarEdicion">
          <i class="pi pi-user-edit"></i> Editar datos
        </button>
      </div>

      <!-- ── Banners ── -->
      <div v-if="error" class="banner banner-err">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
      </div>
      <div v-if="mensajeExito" class="banner banner-ok">
        <i class="pi pi-check-circle"></i>
        <span>{{ mensajeExito }}</span>
      </div>

      <!-- ── Grid principal ── -->
      <div class="dashboard-grid">

        <!-- Columna izquierda -->
        <div class="col-left">

          <!-- Card hero / avatar -->
          <div class="card hero-card">
            <div class="avatar-wrap">
              <img
                v-if="usuario.imagenUrl"
                :src="usuario.imagenUrl"
                :alt="nombreCompleto"
                class="avatar-img"
              />
              <div v-else class="avatar-fallback">{{ inicial }}</div>
              <span class="status-dot" :class="{ activo: empleado.activo }"></span>
            </div>

            <h3 class="emp-nombre">{{ nombreCompleto }}</h3>
            <p class="emp-cargo">{{ empleado.cargo }}</p>
            <p class="emp-ci">CI: {{ empleado.cedulaIdentidad || '—' }}</p>

            <div class="card-divider"></div>

            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">Salario mensual</span>
                <span class="stat-val green">{{ formatearMoneda(empleado.salario) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Fecha de ingreso</span>
                <span class="stat-val">{{ formatearFecha(empleado.fechaIngreso) }}</span>
              </div>
            </div>
          </div>

          <!-- Card credenciales -->
          <div class="card">
            <div class="sec-head">
              <span class="sec-num"><i class="pi pi-lock"></i></span>
              <span class="sec-title">Credenciales de acceso</span>
            </div>
            <div class="info-row">
              <span class="info-label">Usuario institucional</span>
              <span class="info-val">{{ usuario.email }}</span>
            </div>
          </div>

        </div>

        <!-- Columna derecha -->
        <div class="col-right">
          <div class="card form-card">

            <div class="sec-head">
              <span class="sec-num"><i class="pi pi-id-card"></i></span>
              <span class="sec-title">
                {{ modoEdicion ? 'Modificar información personal' : 'Información personal y contacto' }}
              </span>
            </div>

            <!-- ── Formulario de edición ── -->
            <form v-if="modoEdicion" @submit.prevent="guardarCambios" class="form-body">

              <!-- Foto de perfil -->
              <div class="fg">
                <label>Foto de perfil</label>
                <div
                  class="upload-zone"
                  :class="{ 'drag-over': dragOver, 'has-image': formulario.imagenUrl }"
                  @dragover.prevent="dragOver = true"
                  @dragleave.prevent="dragOver = false"
                  @drop.prevent="alSoltarImagen"
                  @click="($refs.fileInput as HTMLInputElement).click()"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    style="display:none"
                    @change="alSeleccionarImagen"
                  />

                  <div v-if="subiendoImagen" class="upload-loading">
                    <i class="pi pi-spin pi-spinner"></i>
                    <span>Subiendo imagen...</span>
                  </div>

                  <template v-else-if="formulario.imagenUrl">
                    <img :src="formulario.imagenUrl" alt="Previsualización" class="upload-preview" />
                    <div class="upload-overlay">
                      <i class="pi pi-camera"></i>
                      <span>Cambiar foto</span>
                    </div>
                  </template>

                  <template v-else>
                    <div class="upload-icon-wrap">
                      <i class="pi pi-cloud-upload"></i>
                    </div>
                    <p class="upload-title">Arrastra tu foto aquí</p>
                    <span class="upload-sub">JPG, PNG o WEBP · haz clic para explorar</span>
                  </template>
                </div>
              </div>

              <!-- Nombre -->
              <div class="fg">
                <label>Nombre(s) *</label>
                <input v-model="formulario.nombre" type="text" required placeholder="Tu nombre" />
              </div>

              <!-- Apellidos -->
              <div class="g2">
                <div class="fg">
                  <label>Apellido paterno *</label>
                  <input v-model="formulario.apellidoPaterno" type="text" required />
                </div>
                <div class="fg">
                  <label>Apellido materno</label>
                  <input v-model="formulario.apellidoMaterno" type="text" />
                </div>
              </div>

              <!-- Celular -->
              <div class="fg">
                <label>Celular</label>
                <div class="input-wrap">
                  <i class="pi pi-mobile"></i>
                  <input v-model="formulario.celular" type="tel" placeholder="77123456" />
                </div>
              </div>

              <!-- Dirección -->
              <div class="fg">
                <label>Dirección domiciliaria</label>
                <div class="input-wrap">
                  <i class="pi pi-map-marker"></i>
                  <input v-model="formulario.direccion" type="text" placeholder="Calle, número, barrio..." />
                </div>
              </div>

              <!-- Acciones -->
              <div class="form-actions">
                <button type="button" class="btn-cancel" :disabled="guardando" @click="cancelarEdicion">
                  Cancelar
                </button>
                <button type="submit" class="btn-save" :disabled="guardando">
                  <i v-if="guardando" class="pi pi-spin pi-spinner"></i>
                  <span v-else><i class="pi pi-save"></i> Guardar cambios</span>
                </button>
              </div>
            </form>

            <!-- ── Vista solo lectura ── -->
            <div v-else class="datos-grid">
              <div class="dato-item">
                <div class="dato-icon icon-blue"><i class="pi pi-phone"></i></div>
                <div>
                  <span class="dato-label">Celular de contacto</span>
                  <span class="dato-val">{{ empleado.celular || 'No registrado' }}</span>
                </div>
              </div>
              <div class="dato-item">
                <div class="dato-icon icon-pink"><i class="pi pi-map-marker"></i></div>
                <div>
                  <span class="dato-label">Dirección particular</span>
                  <span class="dato-val">{{ empleado.direccion || 'No registrada' }}</span>
                </div>
              </div>
              <div class="dato-item">
                <div class="dato-icon icon-orange"><i class="pi pi-calendar"></i></div>
                <div>
                  <span class="dato-label">Fecha de nacimiento</span>
                  <span class="dato-val">{{ formatearFecha(empleado.fechaNacimiento) }}</span>
                </div>
              </div>
              <div class="dato-item">
                <div class="dato-icon icon-purple"><i class="pi pi-envelope"></i></div>
                <div>
                  <span class="dato-label">Email del empleado</span>
                  <span class="dato-val">{{ empleado.email || 'Mismo que institucional' }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Variables Berry Sweet ── */
:root {
  --bs-rosa-fuerte:  #D83B7E;
  --bs-rosa-claro:   #FFE3EE;
  --bs-guinda:       #4A0E2E;
  --bs-guinda-suave: #7A2B50;
  --bs-rosa-borde:   #F2C4D8;
  --bs-rosa-bg:      #FFF5F9;
}

/* ── Base ── */
.perfil-page {
  min-height: 90vh;
  padding: 2.5rem 2rem 4rem;
  background: #FFE3EE;
  display: flex;
  justify-content: center;
  font-family: 'Segoe UI', 'Nunito', Arial, sans-serif;
}

.dashboard-container {
  width: 100%;
  max-width: 1100px;
}

/* ── Header ── */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.badge-rol {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #D83B7E;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.35rem 0.95rem;
  border-radius: 50px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.55rem;
  box-shadow: 0 2px 8px rgba(216, 59, 126, 0.30);
}

.page-titulo {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #4A0E2E;
  letter-spacing: -0.5px;
  margin: 0 0 0.2rem;
}

.page-sub {
  font-size: 0.85rem;
  color: #9E5070;
  margin: 0;
}

.btn-editar-top {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  border: 2px solid #D83B7E;
  color: #D83B7E;
  padding: 0.65rem 1.35rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(216, 59, 126, 0.15);
}

.btn-editar-top:hover {
  background: #D83B7E;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(216, 59, 126, 0.35);
}

/* ── Banners ── */
.banner {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0.9rem 1.2rem;
  border-radius: 14px;
  font-size: 0.84rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.banner-err {
  background: #fff1f4;
  color: #b0203a;
  border: 1.5px solid #f5b8c4;
}

.banner-ok {
  background: #f0faf4;
  color: #1a6b3a;
  border: 1.5px solid #a8e0bc;
}

/* ── Grid ── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.5rem;
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Cards ── */
.card {
  background: #ffffff;
  border-radius: 24px;
  border: 1.5px solid #F2C4D8;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(216, 59, 126, 0.07);
}

.hero-card {
  text-align: center;
}

/* ── Avatar ── */
.avatar-wrap {
  position: relative;
  width: 92px;
  height: 92px;
  margin: 0 auto 1rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 0 0 3px #D83B7E;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #D83B7E, #f07ca8);
  color: #fff;
  font-size: 2.1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 3px #FFE3EE, 0 0 0 5px #D83B7E;
}

.status-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2.5px solid #fff;
  background: #ccc;
}

.status-dot.activo {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.emp-nombre {
  font-size: 1.1rem;
  font-weight: 800;
  color: #4A0E2E;
  margin: 0 0 5px;
  letter-spacing: -0.3px;
}

.emp-cargo {
  font-size: 0.75rem;
  font-weight: 700;
  color: #D83B7E;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 4px;
}

.emp-ci {
  font-size: 0.8rem;
  color: #B07090;
  margin: 0;
}

.card-divider {
  height: 1.5px;
  background: linear-gradient(90deg, transparent, #F2C4D8, transparent);
  margin: 1.25rem 0;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  text-align: left;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.67rem;
  font-weight: 700;
  color: #B07090;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.stat-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: #4A0E2E;
}

.stat-val.green {
  color: #16803a;
}

/* ── Credenciales ── */
.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #B07090;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.info-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4A0E2E;
}

/* ── Sec heads ── */
.sec-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 1.3rem;
}

.sec-num {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #FFE3EE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #D83B7E;
  border: 1px solid #F2C4D8;
}

.sec-title {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: #D83B7E;
}

/* ── Vista solo lectura ── */
.datos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.dato-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #FFF5F9;
  border: 1.5px solid #F2C4D8;
  border-radius: 16px;
  padding: 1rem;
  transition: box-shadow 0.18s;
}

.dato-item:hover {
  box-shadow: 0 4px 14px rgba(216, 59, 126, 0.12);
}

.dato-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

/* Iconos alineados con la paleta Berry Sweet */
.icon-blue   { background: #FFE3EE; color: #D83B7E; }
.icon-pink   { background: #F9D0E4; color: #b02060; }
.icon-orange { background: #FFF0E0; color: #D97706; }
.icon-purple { background: #F0E8FF; color: #7C3AED; }

.dato-label {
  display: block;
  font-size: 0.67rem;
  font-weight: 700;
  color: #B07090;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 4px;
}

.dato-val {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4A0E2E;
}

/* ── Formulario ── */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.g2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.fg {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fg label {
  font-size: 0.73rem;
  font-weight: 700;
  color: #7A2B50;
  letter-spacing: 0.3px;
}

/* ── Inputs ── */
.fg input,
.input-wrap input {
  width: 100%;
  padding: 0.7rem 1rem;
  font-size: 0.875rem;
  background: #FFF5F9;
  border: 1.5px solid #F2C4D8;
  border-radius: 12px;
  color: #4A0E2E;
  outline: none;
  transition: border 0.18s, background 0.18s, box-shadow 0.18s;
  box-sizing: border-box;
  -webkit-appearance: none;
  font-family: inherit;
}

.fg input::placeholder,
.input-wrap input::placeholder {
  color: #C090A8;
}

.fg input:focus,
.input-wrap input:focus {
  border-color: #D83B7E;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(216, 59, 126, 0.13);
}

.fg input:disabled,
.input-wrap input:disabled {
  background: #FFF0F5;
  color: #C090A8;
  cursor: not-allowed;
  border-color: #F5D8E6;
}

.input-wrap {
  position: relative;
}

.input-wrap i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #D83B7E;
  font-size: 0.875rem;
  pointer-events: none;
}

.input-wrap input {
  padding-left: 38px;
}

/* ── Upload zone ── */
.upload-zone {
  border: 2px dashed #F2C4D8;
  border-radius: 16px;
  padding: 1.35rem;
  background: #FFF5F9;
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 148px;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.upload-zone:hover {
  border-color: #D83B7E;
  background: #FFE3EE;
  box-shadow: 0 4px 16px rgba(216, 59, 126, 0.12);
}

.upload-zone.drag-over {
  border-color: #4A0E2E;
  background: #ffd6e8;
  box-shadow: 0 4px 20px rgba(216, 59, 126, 0.2);
}

.upload-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: #FFE3EE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #D83B7E;
  border: 1.5px solid #F2C4D8;
}

.upload-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #4A0E2E;
  margin: 0;
}

.upload-sub {
  font-size: 0.72rem;
  color: #B07090;
}

.upload-preview {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 0 0 3px #D83B7E;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(74, 14, 46, 0.50);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  font-size: 0.83rem;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 14px;
}

.upload-zone:hover .upload-overlay {
  opacity: 1;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  color: #D83B7E;
  font-size: 0.85rem;
  font-weight: 600;
}

.upload-loading i {
  font-size: 1.5rem;
}

/* ── Acciones del formulario ── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 0.35rem;
}

.btn-cancel {
  padding: 0.65rem 1.35rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1.5px solid #E8C0D0;
  background: transparent;
  color: #7A2B50;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  font-family: inherit;
}

.btn-cancel:hover:not(:disabled) {
  background: #FFE3EE;
  border-color: #D83B7E;
  color: #D83B7E;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0.65rem 1.6rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  border: none;
  background: #D83B7E;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
  box-shadow: 0 3px 12px rgba(216, 59, 126, 0.35);
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(216, 59, 126, 0.40);
}

.btn-cancel:disabled,
.btn-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

/* ── Loading ── */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 50vh;
  color: #D83B7E;
  font-size: 0.9rem;
  font-weight: 600;
}

.loading-spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid #FFE3EE;
  border-top-color: #D83B7E;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .dashboard-grid  { grid-template-columns: 1fr; }
  .datos-grid      { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .perfil-page     { padding: 1.5rem 1rem 3rem; }
  .g2              { grid-template-columns: 1fr; }
  .form-actions    { flex-direction: column-reverse; }
  .btn-cancel,
  .btn-save        { width: 100%; justify-content: center; }
  .dashboard-header { flex-direction: column; gap: 1rem; }
}
</style>
