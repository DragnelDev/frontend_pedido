<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import {
  buscarClienteRegistrado,
  crearCliente,
  crearUsuario,
  type ClienteRegistrable,
} from '@/servicios/registroClienteService'

const router = useRouter()
const DEFAULT_PWD = import.meta.env.VITE_DEFAULT_PASSWORD || 'hola123'

// ─────────────────────────────────────────────────────────────────────────────
// Estado del flujo
// ─────────────────────────────────────────────────────────────────────────────
type Modo = 'buscar' | 'registrar'

const modo = ref<Modo>('buscar')
const clienteEncontrado = ref<ClienteRegistrable | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)
const exito = ref(false)

// ─────────────────────────────────────────────────────────────────────────────
// Formulario
// ─────────────────────────────────────────────────────────────────────────────
const datos = ref({
  cedulaIdentidad: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  celular: '',
  email: '',
  direccion: '',
})

const erroresCampos = ref<Record<string, string>>({})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const tituloModo = computed(() => {
  if (modo.value === 'buscar') return 'Busca tu cuenta'
  return clienteEncontrado.value ? 'Completa tu registro' : 'Crear nueva cuenta'
})

const subModo = computed(() => {
  if (modo.value === 'buscar') return 'Ingresa tu CI o correo para verificar si ya tienes cuenta'
  if (clienteEncontrado.value)
    return `Cliente encontrado: ${clienteEncontrado.value.nombre} ${clienteEncontrado.value.apellidoPaterno || ''}`
  return 'Completa tus datos para crear una nueva cuenta'
})

function getErrorMessage(err: unknown): string {
  const e = err as any
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg.join('\n')
  return msg || 'Ocurrió un error. Intenta nuevamente.'
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 1 — Buscar cliente
// ─────────────────────────────────────────────────────────────────────────────
async function buscarCliente() {
  error.value = null
  const ci = datos.value.cedulaIdentidad.trim()
  const email = datos.value.email.trim()

  if (!ci && !email) {
    error.value = 'Ingresa tu cédula de identidad o correo electrónico para continuar.'
    return
  }

  cargando.value = true
  try {
    const cliente = await buscarClienteRegistrado(ci, email)
    if (cliente) {
      clienteEncontrado.value = cliente
      datos.value = {
        cedulaIdentidad: cliente.cedulaIdentidad,
        nombre: cliente.nombre,
        apellidoPaterno: cliente.apellidoPaterno || '',
        apellidoMaterno: cliente.apellidoMaterno || '',
        celular: cliente.celular || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
      }
    } else {
      clienteEncontrado.value = null
      // precarga ci/email para no reescribir
      datos.value.cedulaIdentidad = ci
      datos.value.email = email
    }
    modo.value = 'registrar'
    error.value = null
  } catch {
    error.value = 'Error al buscar el cliente. Verifica tu conexión e intenta de nuevo.'
  } finally {
    cargando.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 2 — Validar campos del registro
// ─────────────────────────────────────────────────────────────────────────────
function validarRegistro(): boolean {
  erroresCampos.value = {}
  const d = datos.value
  if (!d.cedulaIdentidad.trim()) erroresCampos.value.cedulaIdentidad = 'La cédula es obligatoria'
  if (!d.nombre.trim()) erroresCampos.value.nombre = 'El nombre es obligatorio'
  if (!d.apellidoPaterno.trim())
    erroresCampos.value.apellidoPaterno = 'El apellido paterno es obligatorio'
  if (!d.celular.trim()) erroresCampos.value.celular = 'El celular es obligatorio'
  if (!d.email.trim()) erroresCampos.value.email = 'El correo es obligatorio'
  if (!d.direccion.trim()) erroresCampos.value.direccion = 'La dirección es obligatoria'
  return Object.keys(erroresCampos.value).length === 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 2 — Crear usuario (con cliente existente o nuevo)
// ─────────────────────────────────────────────────────────────────────────────
async function crearUsuarioFinal() {
  if (!validarRegistro()) return
  error.value = null
  cargando.value = true

  try {
    let idCliente = clienteEncontrado.value?.id

    if (!idCliente) {
      const nuevoCliente = await crearCliente({
        cedulaIdentidad: datos.value.cedulaIdentidad.trim(),
        nombre: datos.value.nombre.trim(),
        apellidoPaterno: datos.value.apellidoPaterno.trim(),
        apellidoMaterno: datos.value.apellidoMaterno.trim(),
        celular: datos.value.celular.trim(),
        email: datos.value.email.trim(),
        direccion: datos.value.direccion.trim(),
      })
      idCliente = nuevoCliente.id
    }

    await crearUsuario({
      email: datos.value.email.trim(),
      rol: 'CLIENTE',
      idCliente,
    })

    // Auto-login
    const { data: loginData } = await http.post('/auth/login', {
      email: datos.value.email,
      clave: DEFAULT_PWD,
    })

    localStorage.setItem('token', loginData.access_token)
    exito.value = true
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    cargando.value = false
  }
}

function reiniciarFlujo() {
  modo.value = 'buscar'
  clienteEncontrado.value = null
  error.value = null
  erroresCampos.value = {}
  datos.value = {
    cedulaIdentidad: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    celular: '',
    email: '',
    direccion: '',
  }
}

function irAInicio() {
  exito.value = false
  router.push('/')
}
</script>

<template>
  <div class="register-page">
    <!-- Decoraciones flotantes -->
    <span class="deco d1" aria-hidden="true">🍰</span>
    <span class="deco d2" aria-hidden="true">🍓</span>
    <span class="deco d3" aria-hidden="true">🧁</span>
    <span class="deco d4" aria-hidden="true">🍩</span>

    <div class="register-card">
      <!-- ── Logo / Marca ──────────────────────────────────────────────── -->
      <div class="brand">
        <div class="brand-logo">🍓</div>
        <p class="brand-name">Berry Sweet</p>
      </div>

      <!-- ── Indicador de pasos ────────────────────────────────────────── -->
      <div class="steps-bar">
        <div class="step" :class="{ activo: modo === 'buscar', done: modo === 'registrar' }">
          <span class="step-dot">
            <i v-if="modo === 'registrar'" class="pi pi-check"></i>
            <span v-else>1</span>
          </span>
          <span class="step-label">Verificar</span>
        </div>
        <div class="step-line" :class="{ done: modo === 'registrar' }"></div>
        <div class="step" :class="{ activo: modo === 'registrar' }">
          <span class="step-dot"><span>2</span></span>
          <span class="step-label">Registro</span>
        </div>
      </div>

      <!-- ── Título dinámico ───────────────────────────────────────────── -->
      <div class="card-header">
        <h2 class="card-titulo">{{ tituloModo }}</h2>
        <p class="card-sub">{{ subModo }}</p>

        <!-- Badge cliente encontrado -->
        <div v-if="clienteEncontrado" class="cliente-found-badge">
          <i class="pi pi-check-circle"></i>
          Cliente registrado encontrado
        </div>
      </div>

      <!-- ── Error global ──────────────────────────────────────────────── -->
      <div v-if="error" class="error-banner">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ error }}</span>
      </div>

      <!-- ══ PASO 1: Buscar ════════════════════════════════════════════════ -->
      <Transition name="fade-slide" mode="out-in">
        <form
          v-if="modo === 'buscar'"
          key="buscar"
          @submit.prevent="buscarCliente"
          class="form-body"
        >
          <div class="field">
            <label class="field-label" for="buscar-ci"> Cédula de identidad </label>
            <div class="input-wrap">
              <i class="pi pi-id-card input-icon"></i>
              <input
                id="buscar-ci"
                v-model="datos.cedulaIdentidad"
                type="text"
                class="field-input"
                placeholder="Ej: 1234567"
                maxlength="12"
              />
            </div>
          </div>

          <div class="field-divider">
            <span>o</span>
          </div>

          <div class="field">
            <label class="field-label" for="buscar-email"> Correo electrónico </label>
            <div class="input-wrap">
              <i class="pi pi-envelope input-icon"></i>
              <input
                id="buscar-email"
                v-model="datos.email"
                type="email"
                class="field-input"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
          </div>

          <button type="submit" class="btn-primary" :disabled="cargando">
            <span v-if="cargando"> <i class="pi pi-spin pi-spinner"></i> Buscando... </span>
            <span v-else> <i class="pi pi-search"></i> Buscar mi cuenta </span>
          </button>

          <button type="button" class="btn-outline" @click="modo = 'registrar'">
            <i class="pi pi-user-plus"></i> Soy nuevo, crear cuenta
          </button>
        </form>

        <!-- ══ PASO 2: Registro ══════════════════════════════════════════════ -->
        <form v-else key="registrar" @submit.prevent="crearUsuarioFinal" class="form-body">
          <!-- CI + Celular -->
          <div class="field-row">
            <div class="field" :class="{ 'field-error': erroresCampos.cedulaIdentidad }">
              <label class="field-label" for="reg-ci">CI <span class="req">*</span></label>
              <div class="input-wrap">
                <i class="pi pi-id-card input-icon"></i>
                <input
                  id="reg-ci"
                  v-model="datos.cedulaIdentidad"
                  type="text"
                  class="field-input"
                  placeholder="1234567"
                  maxlength="12"
                  :disabled="!!clienteEncontrado"
                />
              </div>
              <span v-if="erroresCampos.cedulaIdentidad" class="campo-error">
                <i class="pi pi-exclamation-circle"></i> {{ erroresCampos.cedulaIdentidad }}
              </span>
            </div>

            <div class="field" :class="{ 'field-error': erroresCampos.celular }">
              <label class="field-label" for="reg-celular"
                >Celular <span class="req">*</span></label
              >
              <div class="input-wrap">
                <i class="pi pi-phone input-icon"></i>
                <input
                  id="reg-celular"
                  v-model="datos.celular"
                  type="tel"
                  class="field-input"
                  placeholder="70000000"
                  maxlength="12"
                />
              </div>
              <span v-if="erroresCampos.celular" class="campo-error">
                <i class="pi pi-exclamation-circle"></i> {{ erroresCampos.celular }}
              </span>
            </div>
          </div>

          <!-- Nombre + Ap. Paterno -->
          <div class="field-row">
            <div class="field" :class="{ 'field-error': erroresCampos.nombre }">
              <label class="field-label" for="reg-nombre">Nombre <span class="req">*</span></label>
              <div class="input-wrap">
                <i class="pi pi-user input-icon"></i>
                <input
                  id="reg-nombre"
                  v-model="datos.nombre"
                  type="text"
                  class="field-input"
                  placeholder="Tu nombre"
                  :disabled="!!clienteEncontrado"
                />
              </div>
              <span v-if="erroresCampos.nombre" class="campo-error">
                <i class="pi pi-exclamation-circle"></i> {{ erroresCampos.nombre }}
              </span>
            </div>

            <div class="field" :class="{ 'field-error': erroresCampos.apellidoPaterno }">
              <label class="field-label" for="reg-apPat"
                >Ap. paterno <span class="req">*</span></label
              >
              <div class="input-wrap">
                <i class="pi pi-user input-icon"></i>
                <input
                  id="reg-apPat"
                  v-model="datos.apellidoPaterno"
                  type="text"
                  class="field-input"
                  placeholder="Apellido paterno"
                  :disabled="!!clienteEncontrado"
                />
              </div>
              <span v-if="erroresCampos.apellidoPaterno" class="campo-error">
                <i class="pi pi-exclamation-circle"></i> {{ erroresCampos.apellidoPaterno }}
              </span>
            </div>
          </div>

          <!-- Ap. Materno -->
          <div class="field">
            <label class="field-label" for="reg-apMat">Apellido materno</label>
            <div class="input-wrap">
              <i class="pi pi-user input-icon"></i>
              <input
                id="reg-apMat"
                v-model="datos.apellidoMaterno"
                type="text"
                class="field-input"
                placeholder="Apellido materno (opcional)"
                :disabled="!!clienteEncontrado"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="field" :class="{ 'field-error': erroresCampos.email }">
            <label class="field-label" for="reg-email"
              >Correo electrónico <span class="req">*</span></label
            >
            <div class="input-wrap">
              <i class="pi pi-envelope input-icon"></i>
              <input
                id="reg-email"
                v-model="datos.email"
                type="email"
                class="field-input"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            <span v-if="erroresCampos.email" class="campo-error">
              <i class="pi pi-exclamation-circle"></i> {{ erroresCampos.email }}
            </span>
          </div>

          <!-- Dirección -->
          <div class="field" :class="{ 'field-error': erroresCampos.direccion }">
            <label class="field-label" for="reg-dir">Dirección <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-map-marker input-icon"></i>
              <input
                id="reg-dir"
                v-model="datos.direccion"
                type="text"
                class="field-input"
                placeholder="Calle, número, zona, ciudad..."
              />
            </div>
            <span v-if="erroresCampos.direccion" class="campo-error">
              <i class="pi pi-exclamation-circle"></i> {{ erroresCampos.direccion }}
            </span>
          </div>

          <!-- Nota contraseña -->
          <div class="pwd-nota">
            <i class="pi pi-info-circle"></i>
            Tu contraseña inicial será <strong>{{ DEFAULT_PWD }}</strong
            >. Cámbiala luego en tu perfil.
          </div>

          <!-- Acciones -->
          <div class="form-acciones">
            <button type="button" class="btn-back" @click="reiniciarFlujo">
              <i class="pi pi-arrow-left"></i> Atrás
            </button>
            <button type="submit" class="btn-primary" :disabled="cargando">
              <span v-if="cargando"> <i class="pi pi-spin pi-spinner"></i> Creando cuenta... </span>
              <span v-else> <i class="pi pi-check"></i> Crear cuenta </span>
            </button>
          </div>
        </form>
      </Transition>

      <!-- ── Footer ────────────────────────────────────────────────────── -->
      <p class="register-footer">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="link-login">Inicia sesión</RouterLink>
      </p>
    </div>

    <!-- ── Modal éxito ───────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="exito" class="modal-overlay">
          <div class="modal-exito">
            <div class="exito-anillo">
              <span class="exito-emoji">🎉</span>
            </div>
            <h3>¡Cuenta creada!</h3>
            <p>
              Bienvenid@ a <strong>Berry Sweet</strong>, {{ datos.nombre }}.<br />
              Ya iniciaste sesión automáticamente.
            </p>
            <p class="exito-email"><i class="pi pi-envelope"></i> {{ datos.email }}</p>
            <button class="btn-primary" @click="irAInicio">🍰 Ir al inicio</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Base ───────────────────────────────────────────────────────────────────── */
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 45%, #f48fb1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

/* Decoraciones flotantes */
.deco {
  position: absolute;
  font-size: 3.5rem;
  opacity: 0.1;
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
  user-select: none;
}

.d1 {
  top: 6%;
  left: 4%;
  animation-delay: 0s;
}
.d2 {
  top: 8%;
  right: 5%;
  animation-delay: 2s;
  font-size: 2.8rem;
}
.d3 {
  bottom: 6%;
  right: 8%;
  animation-delay: 4s;
}
.d4 {
  bottom: 12%;
  left: 8%;
  animation-delay: 1.5s;
  font-size: 2.5rem;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-18px) rotate(4deg);
  }
}

/* ── Card ───────────────────────────────────────────────────────────────────── */
.register-card {
  background: white;
  border-radius: 28px;
  padding: 2.25rem 2rem 1.75rem;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 24px 64px rgba(136, 14, 79, 0.2);
  position: relative;
  z-index: 1;
}

/* ── Marca ──────────────────────────────────────────────────────────────────── */
.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.brand-logo {
  font-size: 1.6rem;
}
.brand-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #c2185b;
  letter-spacing: 0.3px;
}

/* ── Steps ──────────────────────────────────────────────────────────────────── */
.steps-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 1.5rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.step-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  border: 2px solid #fce4ec;
  background: white;
  color: #ccc;
  transition: all 0.3s;
}

.step.activo .step-dot {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: white;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.3);
}

.step.done .step-dot {
  background: #e8f5e9;
  border-color: #c8e6c9;
  color: #2e7d32;
}

.step-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #ccc;
}
.step.activo .step-label {
  color: #e91e8c;
}
.step.done .step-label {
  color: #2e7d32;
}

.step-line {
  width: 60px;
  height: 2px;
  background: #fce4ec;
  margin: 0 0.5rem;
  transition: background 0.3s;
}

.step-line.done {
  background: linear-gradient(90deg, #f48fb1, #e91e8c);
}

/* ── Card header ────────────────────────────────────────────────────────────── */
.card-header {
  margin-bottom: 1.25rem;
}

.card-titulo {
  font-size: 1.25rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.25rem;
}
.card-sub {
  font-size: 0.82rem;
  color: #aaa;
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.cliente-found-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  margin-top: 0.25rem;
}

/* ── Error ──────────────────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fff5f5;
  border: 1.5px solid #fed7d7;
  color: #c62828;
  font-size: 0.82rem;
  font-weight: 500;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  white-space: pre-line;
  line-height: 1.4;
}

.error-banner i {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

/* ── Formulario ─────────────────────────────────────────────────────────────── */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #880e4f;
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
  padding: 0.65rem 1rem 0.65rem 2.35rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
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

.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.09);
  background: white;
}

.field-input:disabled {
  background: #fafafa;
  color: #aaa;
  cursor: not-allowed;
}

.field-input::placeholder {
  color: #ccc;
}

.field-error .field-input {
  border-color: #ef5350;
}

.campo-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #ef5350;
  font-weight: 600;
  padding-left: 0.5rem;
}

/* Divider "o" */
.field-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ddd;
  font-size: 0.78rem;
  font-weight: 600;
}

.field-divider::before,
.field-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #fce4ec;
}

/* Nota contraseña */
.pwd-nota {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fff8e1;
  border: 1.5px solid #ffe082;
  color: #8d6e63;
  font-size: 0.75rem;
  padding: 0.65rem 0.9rem;
  border-radius: 12px;
  line-height: 1.45;
}

.pwd-nota i {
  flex-shrink: 0;
  margin-top: 0.1rem;
}
.pwd-nota strong {
  color: #e65100;
}

/* Acciones del form */
.form-acciones {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

/* ── Botones ────────────────────────────────────────────────────────────────── */
.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.8rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
  transition:
    opacity 0.2s,
    transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-outline {
  width: 100%;
  background: white;
  color: #c2185b;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  padding: 0.75rem;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-outline:hover {
  background: #fce4ec;
  border-color: #f48fb1;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1.1rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-back:hover {
  background: #f8bbd0;
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.register-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.82rem;
  color: #bbb;
}

.link-login {
  color: #e91e8c;
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.2rem;
}

.link-login:hover {
  text-decoration: underline;
}

/* ── Modal éxito ────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.45);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-exito {
  background: white;
  border-radius: 28px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(136, 14, 79, 0.22);
}

.exito-anillo {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fce4ec, #fff9fb);
  border: 3px solid #f48fb1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow:
    0 0 0 8px rgba(233, 30, 140, 0.07),
    0 6px 24px rgba(233, 30, 140, 0.15);
  animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pop-in {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.exito-emoji {
  font-size: 2.5rem;
}

.modal-exito h3 {
  font-size: 1.3rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.65rem;
}
.modal-exito p {
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
  margin: 0 0 0.4rem;
}

.exito-email {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #fce4ec;
  color: #c2185b;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.3rem 0.9rem;
  border-radius: 50px;
  margin-bottom: 1.25rem !important;
}

/* ── Transiciones ───────────────────────────────────────────────────────────── */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .register-card {
    padding: 1.75rem 1.25rem 1.5rem;
  }
  .field-row {
    grid-template-columns: 1fr;
  }
  .form-acciones {
    grid-template-columns: 1fr;
  }
}
</style>
