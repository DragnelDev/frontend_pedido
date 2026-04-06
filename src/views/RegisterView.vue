<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import http from '@/plugins/axios'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()

const ENDPOINT_CLIENTES = '/clientes'
const ENDPOINT_USUARIOS = '/usuarios'
const DEFAULT_PWD = import.meta.env.VITE_DEFAULT_PASSWORD || 'hola123'

const datos = ref({
  cedulaIdentidad: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  celular: '',
  email: '',
  direccion: '',
  rol: 'CLIENTE',
})

const cargando = ref(false)
const error = ref<string | null>(null)
const mostrarModalExito = ref(false)

async function registrarUsuario() {
  cargando.value = true
  error.value = null
  try {
    const clienteBody = {
      cedulaIdentidad: datos.value.cedulaIdentidad.trim(),
      nombre: datos.value.nombre.trim(),
      apellidoPaterno: datos.value.apellidoPaterno.trim(),
      apellidoMaterno: datos.value.apellidoMaterno.trim(),
      celular: datos.value.celular.trim(),
      email: datos.value.email.trim(),
      direccion: datos.value.direccion.trim(),
    }

    const { data: clienteData } = await http.post(ENDPOINT_CLIENTES, clienteBody)
    const idCliente = clienteData.id

    const usuarioBody = {
      email: datos.value.email.trim(),
      rol: datos.value.rol,
      idCliente: idCliente,
    }

    await http.post(ENDPOINT_USUARIOS, usuarioBody)

    const { data: loginData } = await http.post('/auth/login', {
      email: usuarioBody.email,
      clave: DEFAULT_PWD,
    })

    localStorage.setItem('token', loginData.access_token)
    mostrarModalExito.value = true
  } catch (e: any) {
    const msg = e?.response?.data?.message
    if (typeof msg === 'string' && msg.toLowerCase().includes('existe')) {
      error.value = 'Ese correo o cédula ya está registrado. Inicia sesión para continuar.'
    } else if (Array.isArray(msg)) {
      error.value = msg.join('\n')
    } else {
      error.value = msg || 'Error al registrar usuario. Intenta nuevamente.'
    }
  } finally {
    cargando.value = false
  }
}

const irAlInicio = () => {
  mostrarModalExito.value = false
  router.push('/')
}
</script>

<template>
  <div class="register-page">
    <!-- Decoraciones -->
    <div class="deco deco-1">🍓</div>
    <div class="deco deco-2">🧁</div>
    <div class="deco deco-3">🍰</div>

    <div class="register-card">
      <!-- Marca -->
      <div class="register-brand">
        <div class="brand-icon">🍓</div>
        <h1 class="brand-name">Berry Sweet</h1>
        <p class="brand-sub">Crea tu cuenta y empieza a pedir</p>
      </div>

      <form @submit.prevent="registrarUsuario" class="register-form" novalidate>
        <!-- Fila: CI + Celular -->
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="ci">Cédula de identidad <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-id-card input-icon"></i>
              <input id="ci" v-model="datos.cedulaIdentidad" type="text" class="field-input" placeholder="1234567" required maxlength="12" />
            </div>
          </div>
          <div class="field">
            <label class="field-label" for="celular">Celular <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-phone input-icon"></i>
              <input id="celular" v-model="datos.celular" type="text" class="field-input" placeholder="70000000" required maxlength="12" />
            </div>
          </div>
        </div>

        <!-- Fila: Nombre + Apellido Paterno -->
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="nombre">Nombre <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-user input-icon"></i>
              <input id="nombre" v-model="datos.nombre" type="text" class="field-input" placeholder="Tu nombre" required />
            </div>
          </div>
          <div class="field">
            <label class="field-label" for="apPaterno">Apellido paterno <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-user input-icon"></i>
              <input id="apPaterno" v-model="datos.apellidoPaterno" type="text" class="field-input" placeholder="Apellido" required />
            </div>
          </div>
        </div>

        <!-- Apellido materno -->
        <div class="field">
          <label class="field-label" for="apMaterno">Apellido materno</label>
          <div class="input-wrap">
            <i class="pi pi-user input-icon"></i>
            <input id="apMaterno" v-model="datos.apellidoMaterno" type="text" class="field-input" placeholder="Apellido materno" />
          </div>
        </div>

        <!-- Email -->
        <div class="field">
          <label class="field-label" for="email">Correo electrónico <span class="req">*</span></label>
          <div class="input-wrap">
            <i class="pi pi-envelope input-icon"></i>
            <input id="email" v-model="datos.email" type="email" class="field-input" placeholder="tucorreo@ejemplo.com" required />
          </div>
        </div>

        <!-- Dirección -->
        <div class="field">
          <label class="field-label" for="direccion">Dirección <span class="req">*</span></label>
          <div class="input-wrap">
            <i class="pi pi-map-marker input-icon"></i>
            <input id="direccion" v-model="datos.direccion" type="text" class="field-input" placeholder="Calle, zona, ciudad..." required />
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-msg">
          <i class="pi pi-exclamation-triangle"></i>
          {{ error }}
        </div>

        <!-- Submit -->
        <button type="submit" class="btn-submit" :disabled="cargando">
          <span v-if="cargando">
            <i class="pi pi-spin pi-spinner"></i> Registrando...
          </span>
          <span v-else>🍓 Crear mi cuenta</span>
        </button>
      </form>

      <p class="register-footer">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="link-login">Inicia sesión aquí</RouterLink>
      </p>
    </div>
  </div>

  <!-- Modal de éxito -->
  <Dialog
    v-model:visible="mostrarModalExito"
    modal
    :closable="false"
    header="¡Registro exitoso!"
    :style="{ width: '90vw', maxWidth: '420px' }"
  >
    <div class="modal-exito">
      <div class="exito-icon">🎉</div>
      <p>¡Tu cuenta ha sido creada correctamente!</p>
      <p>Bienvenido/a a <strong>Berry Sweet</strong>. Ya puedes empezar a pedir.</p>
    </div>
    <div class="text-end mt-3">
      <Button label="🍰 Ir al inicio" @click="irAlInicio" />
    </div>
  </Dialog>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.deco {
  position: absolute;
  font-size: 4rem;
  opacity: 0.1;
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
}

.deco-1 { top: 5%; left: 5%; animation-delay: 0s; }
.deco-2 { top: 10%; right: 6%; animation-delay: 2s; font-size: 3rem; }
.deco-3 { bottom: 8%; right: 10%; animation-delay: 4s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-16px) rotate(5deg); }
}

.register-card {
  background: white;
  border-radius: 24px;
  padding: 2.25rem 2rem;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 20px 60px rgba(233, 30, 140, 0.2);
  position: relative;
  z-index: 1;
}

/* Marca */
.register-brand {
  text-align: center;
  margin-bottom: 1.5rem;
}

.brand-icon { font-size: 2.5rem; }

.brand-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #c2185b;
  margin: 0.25rem 0 0.15rem;
}

.brand-sub {
  font-size: 0.82rem;
  color: #bbb;
  margin: 0 0 0.5rem;
}

/* Form */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #880e4f;
}

.req { color: #e91e8c; }

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  color: #f48fb1;
  font-size: 0.875rem;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.4rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.1);
  background: white;
}

.field-input::placeholder { color: #ccc; }

/* Error */
.error-msg {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  color: #e53e3e;
  font-size: 0.85rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font-weight: 500;
  white-space: pre-line;
}

/* Botón */
.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.85rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
  margin-top: 0.25rem;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Footer */
.register-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.875rem;
  color: #888;
}

.link-login {
  color: #e91e8c;
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.2rem;
}

.link-login:hover { text-decoration: underline; }

/* Modal éxito */
.modal-exito {
  text-align: center;
  padding: 0.5rem 0 1rem;
}

.exito-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.modal-exito p {
  color: #555;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}

.modal-exito strong { color: #e91e8c; }

@media (max-width: 480px) {
  .register-card { padding: 1.75rem 1.25rem; }
  .field-row { grid-template-columns: 1fr; }
}
</style>
