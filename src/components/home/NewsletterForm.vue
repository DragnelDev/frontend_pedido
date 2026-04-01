<template>
  <section class="newsletter py-5">
    <div class="container">
      <div class="newsletter-card">
        <div class="row align-items-center">
          <div class="col-12 col-md-6 mb-4 mb-md-0 text-center text-md-start">
            <span class="section-tag">🍓 Ofertas exclusivas</span>
            <h2 class="newsletter-titulo">Suscríbete a nuestro boletín</h2>
            <p class="newsletter-subtitulo">
              Recibe descuentos especiales, nuevos productos y tips de pastelería directo en tu
              correo
            </p>
          </div>
          <div class="col-12 col-md-6">
            <div class="form-group">
              <input
                v-model="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                class="newsletter-input"
              />
              <button class="newsletter-btn" @click="suscribirse" :disabled="cargando">
                <span v-if="cargando">Enviando...</span>
                <span v-else>Suscribirme</span>
              </button>
            </div>
            <p class="newsletter-nota">🔒 Sin spam, solo dulces noticias.</p>
            <p v-if="mensaje" class="newsletter-mensaje">{{ mensaje }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const cargando = ref(false)
const mensaje = ref('')

const suscribirse = async () => {
  if (!email.value) return
  cargando.value = true
  // Aquí conectar con el backend
  await new Promise((resolve) => setTimeout(resolve, 1000)) // simulación
  mensaje.value = '¡Gracias! Te has suscrito correctamente 🎉'
  email.value = ''
  cargando.value = false
}
</script>

<style scoped>
.newsletter {
  background: white;
}

.newsletter-card {
  background: linear-gradient(135deg, #e91e8c 0%, #f06292 50%, #f48fb1 100%);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow: 0 12px 40px rgba(233, 30, 140, 0.25);
  position: relative;
  overflow: hidden;
}

.newsletter-card::before {
  content: '🍰';
  position: absolute;
  top: -20px;
  right: 2rem;
  font-size: 8rem;
  opacity: 0.12;
  pointer-events: none;
}

.section-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 0.3rem 1rem;
  border-radius: 50px;
  margin-bottom: 0.75rem;
}

.newsletter-titulo {
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.newsletter-subtitulo {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.form-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.newsletter-input {
  flex: 1;
  min-width: 0;
  padding: 0.85rem 1.2rem;
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  outline: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  color: #333;
}

.newsletter-input:focus {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.newsletter-btn {
  background: #880e4f;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.85rem 1.8rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.newsletter-btn:hover:not(:disabled) {
  background: #6a0636;
  transform: scale(1.03);
}

.newsletter-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.newsletter-nota {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-top: 0.75rem;
  margin-bottom: 0;
}

.newsletter-mensaje {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

@media (max-width: 576px) {
  .newsletter-card {
    padding: 2rem 1.5rem;
  }

  .form-group {
    flex-direction: column;
  }

  .newsletter-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
