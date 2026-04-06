<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/index'
import { useRouter, useRoute } from 'vue-router'
import { parseJwt } from '@/helpers'

const router = useRouter()
const route = useRoute()
const email = ref('')
const clave = ref('')
const error = ref(false)
const cargando = ref(false)
const mostrarClave = ref(false)

async function onSubmit() {
  const authStore = useAuthStore()
  cargando.value = true
  error.value = false
  try {
    await authStore.login(email.value, clave.value)

    const token = localStorage.getItem('token')

    if (token) {
      const decoded = parseJwt(token)
      const userRole = decoded?.rol || decoded?.role || decoded?.tipo

      if (userRole === 'EMPLEADO') {
        const returnUrl = route.query.returnUrl as string
        router.push(returnUrl || '/admin')
      } else {
        router.push('/')
      }
    }
  } catch {
    error.value = true
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Decoraciones de fondo -->
    <div class="deco deco-1">🍰</div>
    <div class="deco deco-2">🍓</div>
    <div class="deco deco-3">🧁</div>
    <div class="deco deco-4">🍩</div>

    <div class="login-card">
      <!-- Logo / Marca -->
      <div class="login-brand">
        <div class="brand-icon">🍓</div>
        <h1 class="brand-name">Berry Sweet</h1>
        <p class="brand-sub">Pastelería artesanal · Sucre, Bolivia</p>
      </div>

      <h2 class="login-titulo">Iniciar Sesión</h2>

      <form @submit.prevent="onSubmit" class="login-form" novalidate>
        <!-- Email -->
        <div class="field-group">
          <label class="field-label" for="email">Correo electrónico</label>
          <div class="input-wrap">
            <i class="pi pi-envelope input-icon"></i>
            <input
              id="email"
              v-model="email"
              type="email"
              class="field-input"
              placeholder="tucorreo@ejemplo.com"
              autofocus
              required
            />
          </div>
        </div>

        <!-- Contraseña -->
        <div class="field-group">
          <label class="field-label" for="clave">Contraseña</label>
          <div class="input-wrap">
            <i class="pi pi-lock input-icon"></i>
            <input
              id="clave"
              v-model="clave"
              :type="mostrarClave ? 'text' : 'password'"
              class="field-input"
              placeholder="Tu contraseña"
              required
            />
            <button
              type="button"
              class="toggle-pass"
              @click="mostrarClave = !mostrarClave"
              :aria-label="mostrarClave ? 'Ocultar' : 'Mostrar'"
            >
              <i :class="mostrarClave ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="error-msg">
          <i class="pi pi-exclamation-triangle"></i>
          Usuario y/o contraseña incorrectos
        </div>

        <!-- Submit -->
        <button type="submit" class="btn-submit" :disabled="cargando">
          <span v-if="cargando" class="loading-dots">
            <span></span><span></span><span></span>
          </span>
          <span v-else>🍰 Ingresar</span>
        </button>
      <button type="button" class="btn-submit" @click="$router.push('/')">
          Volver a Inicio
      </button>
      </form>

      <!-- Registro -->
      <p class="login-footer">
        ¿No tienes cuenta?
        <RouterLink to="/register" class="link-register">Regístrate aquí</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ── PÁGINA ── */
.login-page {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 40%, #f48fb1 100%);
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
  font-size: 4rem;
  opacity: 0.12;
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
}

.deco-1 {
  top: 5%;
  left: 5%;
  animation-delay: 0s;
  font-size: 5rem;
}
.deco-2 {
  top: 10%;
  right: 8%;
  animation-delay: 1.5s;
  font-size: 3.5rem;
}
.deco-3 {
  bottom: 12%;
  left: 10%;
  animation-delay: 3s;
  font-size: 4rem;
}
.deco-4 {
  bottom: 8%;
  right: 5%;
  animation-delay: 0.8s;
  font-size: 3rem;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-18px) rotate(5deg);
  }
}

/* ── CARD ── */
.login-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem 2.25rem;
  width: 100%;
  max-width: 420px;
  box-shadow:
    0 20px 60px rgba(233, 30, 140, 0.2),
    0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

/* ── MARCA ── */
.login-brand {
  text-align: center;
  margin-bottom: 1.5rem;
}

.brand-icon {
  font-size: 3rem;
  margin-bottom: 0.4rem;
}

.brand-name {
  font-size: 1.7rem;
  font-weight: 800;
  color: #c2185b;
  margin: 0 0 0.2rem;
  letter-spacing: -0.5px;
}

.brand-sub {
  font-size: 0.8rem;
  color: #bbb;
  margin: 0;
}

/* ── TÍTULO ── */
.login-titulo {
  font-size: 1.15rem;
  font-weight: 700;
  color: #880e4f;
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid #fce4ec;
}

/* ── FORM ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #880e4f;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #f48fb1;
  font-size: 0.95rem;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.9rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.1);
  background: white;
}

.field-input::placeholder {
  color: #ccc;
}

.toggle-pass {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #f48fb1;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0;
  transition: color 0.2s;
}

.toggle-pass:hover {
  color: #e91e8c;
}

/* ── ERROR ── */
.error-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  color: #e53e3e;
  font-size: 0.85rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font-weight: 500;
}

/* ── BOTÓN ── */
.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.9rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 0.5rem;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.35);
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.45);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Animación de carga */
.loading-dots {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
}

.loading-dots span {
  width: 7px;
  height: 7px;
  background: white;
  border-radius: 50%;
  animation: dot-bounce 1.2s infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── FOOTER ── */
.login-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #888;
}

.link-register {
  color: #e91e8c;
  font-weight: 700;
  text-decoration: none;
  margin-left: 0.25rem;
}

.link-register:hover {
  text-decoration: underline;
}

/* ── RESPONSIVE ── */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }

  .deco {
    font-size: 2.5rem;
  }
}
</style>
