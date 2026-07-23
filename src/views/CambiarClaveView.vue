<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/index'
import { useRouter } from 'vue-router'
import { parseJwt } from '@/helpers'
import axios from 'axios' // O el cliente HTTP personalizado que uses

const router = useRouter()
const authStore = useAuthStore()

const claveActual = ref('')
const nuevaClave = ref('')
const confirmarClave = ref('')

const cargando = ref(false)
const errorMsg = ref('')
const mostrarClaves = ref(false)

// Validaciones del lado del cliente
const contrasenasCoinciden = computed(() => nuevaClave.value === confirmarClave.value)
const largoValido = computed(() => nuevaClave.value.length >= 6)
const formularioValido = computed(() => {
  return claveActual.value && nuevaClave.value && confirmarClave.value && contrasenasCoinciden.value && largoValido.value
})

async function onCambiarClave() {
  if (!formularioValido.value) return

  cargando.value = true
  errorMsg.value = ''

  try {
    // Debug: Ver qué hay en el store
    console.log('authStore.usuario:', authStore.usuario)
    console.log('authStore.token:', authStore.token)

    // Obtenemos el ID del usuario autenticado desde el store
    let usuarioId = authStore.usuario?.id
    
    if (!usuarioId) {
      // Fallback: intentar extraer del JWT
      const token = localStorage.getItem('token')
      console.log('Token del localStorage:', token ? 'existe' : 'no existe')
      const decoded = parseJwt(token || '')
      console.log('Decoded JWT:', decoded)
      usuarioId = decoded?.id || decoded?.sub
    }

    if (!usuarioId) {
      throw new Error('No se encontró la sesión del usuario. Por favor inicia sesión de nuevo.')
    }

    console.log('Enviando cambio de contraseña para usuarioId:', usuarioId)

    // Petición PATCH al endpoint que creamos en NestJS
    const response = await axios.patch(`${import.meta.env.VITE_BASE_URL_ENDPOINT}/usuarios/${usuarioId}/cambiar-clave`, {
      claveActual: claveActual.value,
      nuevaClave: nuevaClave.value
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })

    console.log('Respuesta del servidor:', response.data)

    // Mostrar mensaje de éxito
    errorMsg.value = ''
    alert('✅ Contraseña actualizada con éxito')

    // Limpiar formulario
    claveActual.value = ''
    nuevaClave.value = ''
    confirmarClave.value = ''

    // Esperar un poco y luego redirigir
    setTimeout(() => {
      // Actualizamos el estado local en caso de que sea necesario y redirigimos
      // Si era empleado, lo mandamos al panel de administración; si no, al inicio.
      const userRole = authStore.usuario?.rol || 'CLIENTE'
      if (userRole === 'EMPLEADO') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }, 1000)

  } catch (error: any) {
    // Captura el mensaje de error que viene desde las excepciones de NestJS
    console.error('Error al cambiar contraseña:', error.response?.data || error.message)
    errorMsg.value = error.response?.data?.message || error.message || 'Hubo un problema al actualizar la contraseña.'
  } finally {
    cargando.value = false
  }
}

// Función auxiliar para decodificar JWT si no está en el store global
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return null
  }
}
</script>

<template>
  <div class="login-page">
    <div class="deco deco-1">🍰</div>
    <div class="deco deco-2">🍓</div>
    <div class="deco deco-3">🧁</div>
    <div class="deco deco-4">🍩</div>

    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon">🔒</div>
        <h1 class="brand-name">Actualizar Contraseña</h1>
        <p class="brand-sub">Por seguridad, debes cambiar tu clave temporal en tu primer ingreso</p>
      </div>

      <form @submit.prevent="onCambiarClave" class="login-form" novalidate>

        <div class="field-group">
          <label class="field-label" for="claveActual">Contraseña actual (temporal)</label>
          <div class="input-wrap">
            <i class="pi pi-lock-open input-icon"></i>
            <input
              id="claveActual"
              v-model="claveActual"
              :type="mostrarClaves ? 'text' : 'password'"
              class="field-input"
              placeholder="Ingresa la contraseña actual"
              required
            />
          </div>
        </div>

        <div class="field-group">
          <label class="field-label" for="nuevaClave">Nueva contraseña</label>
          <div class="input-wrap">
            <i class="pi pi-lock input-icon"></i>
            <input
              id="nuevaClave"
              v-model="nuevaClave"
              :type="mostrarClaves ? 'text' : 'password'"
              class="field-input"
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              class="toggle-pass"
              @click="mostrarClaves = !mostrarClaves"
            >
              <i :class="mostrarClaves ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
          <small v-if="nuevaClave && !largoValido" class="validar-texto error">
            ⚠️ Debe tener al menos 6 caracteres.
          </small>
        </div>

        <div class="field-group">
          <label class="field-label" for="confirmarClave">Confirmar nueva contraseña</label>
          <div class="input-wrap">
            <i class="pi pi-shield input-icon"></i>
            <input
              id="confirmarClave"
              v-model="confirmarClave"
              :type="mostrarClaves ? 'text' : 'password'"
              class="field-input"
              placeholder="Repite tu nueva contraseña"
              required
            />
          </div>
          <small v-if="confirmarClave && !contrasenasCoinciden" class="validar-texto error">
            ❌ Las contraseñas no coinciden.
          </small>
          <small v-if="confirmarClave && contrasenasCoinciden && largoValido" class="validar-texto exito">
            ✅ ¡Las contraseñas coinciden!
          </small>
        </div>

        <div v-if="errorMsg" class="error-msg">
          <i class="pi pi-exclamation-triangle"></i>
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn-submit" :disabled="cargando || !formularioValido">
          <span v-if="cargando" class="loading-dots">
            <span></span><span></span><span></span>
          </span>
          <span v-else>Confirmar y Continuar 🍓</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Estilos adicionales para las validaciones en tiempo real */
.validar-texto {
  font-size: 0.75rem;
  margin-top: 0.2rem;
  padding-left: 1rem;
  font-weight: 600;
}
.validar-texto.error {
  color: #e53e3e;
}
.validar-texto.exito {
  color: #38a169;
}

/* Estructura base recuperada del login */
.login-page {
  min-height: 100vh; width: 100%;
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 40%, #f48fb1 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1rem; position: relative; overflow: hidden;
}
.deco { position: absolute; font-size: 4rem; opacity: 0.12; pointer-events: none; animation: float 6s ease-in-out infinite; }
.deco-1 { top: 5%; left: 5%; font-size: 5rem; }
.deco-2 { top: 10%; right: 8%; animation-delay: 1.5s; font-size: 3.5rem; }
.deco-3 { bottom: 12%; left: 10%; animation-delay: 3s; font-size: 4rem; }
.deco-4 { bottom: 8%; right: 5%; animation-delay: 0.8s; font-size: 3rem; }
@keyframes float { 0%, 100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-18px) rotate(5deg); } }
.login-card { background: white; border-radius: 24px; padding: 2.5rem 2.25rem; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(233, 30, 140, 0.2), 0 4px 16px rgba(0, 0, 0, 0.08); position: relative; z-index: 1; }
.login-brand { text-align: center; margin-bottom: 1.5rem; }
.brand-icon { font-size: 3rem; margin-bottom: 0.4rem; }
.brand-name { font-size: 1.7rem; font-weight: 800; color: #c2185b; margin: 0 0 0.2rem; letter-spacing: -0.5px; }
.brand-sub { font-size: 0.8rem; color: #888; margin: 0; }
.login-form { display: flex; flex-direction: column; gap: 1.1rem; }
.field-group { display: flex; flex-direction: column; gap: 0.4rem; }
.field-label { font-size: 0.85rem; font-weight: 600; color: #880e4f; }
.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 1rem; color: #f48fb1; font-size: 0.95rem; pointer-events: none; }
.field-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border: 1.5px solid #f8bbd0; border-radius: 50px; font-size: 0.9rem; color: #333; outline: none; background: #fff9fb; transition: border-color 0.2s, box-shadow 0.2s; }
.field-input:focus { border-color: #e91e8c; box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.1); background: white; }
.toggle-pass { position: absolute; right: 1rem; background: none; border: none; color: #f48fb1; cursor: pointer; font-size: 0.95rem; padding: 0; }
.error-msg { display: flex; align-items: center; gap: 0.5rem; background: #fff5f5; border: 1px solid #fed7d7; color: #e53e3e; font-size: 0.85rem; padding: 0.65rem 1rem; border-radius: 10px; font-weight: 500; }
.btn-submit { width: 100%; background: linear-gradient(135deg, #e91e8c, #f06292); color: white; font-weight: 700; font-size: 1rem; padding: 0.9rem; border: none; border-radius: 50px; cursor: pointer; margin-top: 0.5rem; box-shadow: 0 6px 20px rgba(233, 30, 140, 0.35); transition: opacity 0.2s, transform 0.2s; }
.btn-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-2px); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.loading-dots { display: inline-flex; gap: 5px; align-items: center; justify-content: center; }
.loading-dots span { width: 7px; height: 7px; background: white; border-radius: 50%; animation: dot-bounce 1.2s infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-bounce { 0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
</style>