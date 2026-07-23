<template>
  <section class="newsletter-section">
    <div class="container">
      <div class="newsletter-card">

        <div class="deco deco-1" aria-hidden="true">🍓</div>
        <div class="deco deco-2" aria-hidden="true">🎂</div>

        <div class="newsletter-inner">

          <div class="nl-left">
            <span class="eyebrow"><span class="eyebrow-dot"></span> Ofertas exclusivas</span>
            <h2 class="nl-titulo">Dulces noticias directo a tu correo</h2>
            <p class="nl-sub">
              Descuentos especiales, nuevos productos y tips de pastelería. Sin spam, solo lo que vale.
            </p>
            <div class="trust-row">
              <span class="trust-item"><i class="pi pi-lock"></i> Sin spam</span>
              <span class="trust-item"><i class="pi pi-bell"></i> Novedades primero</span>
              <span class="trust-item"><i class="pi pi-tag"></i> Descuentos exclusivos</span>
            </div>
          </div>

          <div class="nl-right">
            <div class="form-wrap">
              <div class="input-row">
                <i class="pi pi-envelope input-icon"></i>
                <input
                  v-model="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  class="nl-input"
                  :disabled="suscrito"
                />
              </div>
              <button class="nl-btn" @click="suscribirse" :disabled="cargando || suscrito">
                <i v-if="cargando" class="pi pi-spin pi-spinner"></i>
                <template v-else-if="suscrito">
                  <i class="pi pi-check"></i> ¡Suscrito!
                </template>
                <template v-else>
                  Suscribirme <i class="pi pi-arrow-right"></i>
                </template>
              </button>
            </div>

            <p v-if="mensaje" class="nl-mensaje">
              <i class="pi pi-check-circle"></i> {{ mensaje }}
            </p>
            <p v-else class="nl-nota">
              <i class="pi pi-lock"></i> Tus datos están seguros. Cancela cuando quieras.
            </p>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email    = ref('')
const cargando = ref(false)
const mensaje  = ref('')
const suscrito = ref(false)

const suscribirse = async () => {
  if (!email.value) return
  cargando.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  mensaje.value  = '¡Gracias! Te has suscrito correctamente.'
  suscrito.value = true
  email.value    = ''
  cargando.value = false
}
</script>

<style scoped>
/* ── Base ── */
.newsletter-section {
  padding: 5rem 0 4rem;
  /* CAMBIADO: Adaptado al degradado de fondo oficial del Hero Banner */
  background: linear-gradient(135deg, #fff0f5 0%, #ffe4ef 100%);
}
.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* ── Card ── */
.newsletter-card {
  /* CAMBIADO: Ajustado a un degradado dinámico usando la base rosa oscura insignia de la marca */
  background: linear-gradient(135deg, #c2185b 0%, #e91e8c 100%);
  border-radius: 24px;
  padding: 3.5rem 3rem;
  position: relative;
  overflow: hidden;
  /* CAMBIADO: Sombra consistente con la estética del sitio */
  box-shadow: 0 16px 40px rgba(194, 24, 91, 0.2);
}

/* Decoración */
.deco {
  position: absolute;
  font-size: 7rem;
  opacity: 0.1;
  pointer-events: none;
  line-height: 1;
  user-select: none;
}
.deco-1 { top: -20px; right: 3rem; }
.deco-2 { bottom: -20px; left: 2rem; font-size: 5rem; }

/* ── Inner layout ── */
.newsletter-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

/* ── Texto izquierda ── */
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.65rem;
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* CAMBIADO: Sincronizado con el rosa vibrante */
  background: #ff80b0;
  display: inline-block;
}
.nl-titulo {
  font-size: clamp(1.4rem, 2.5vw, 1.9rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
  letter-spacing: -0.4px;
  margin: 0 0 0.75rem;
}
.nl-sub {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0 0 1.25rem;
}

/* Trust pills */
.trust-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.trust-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 50px;
}
.trust-item i { font-size: 0.7rem; }

/* ── Formulario derecha ── */
.form-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-row {
  position: relative;
}
.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  /* CAMBIADO: Tono ciruela suave para el ícono interno del input */
  color: rgba(136, 14, 79, 0.4);
  font-size: 0.9rem;
  pointer-events: none;
}
.nl-input {
  width: 100%;
  padding: 0.9rem 1.1rem 0.9rem 42px;
  border: none;
  border-radius: 50px; /* CAMBIADO: Estilo redondeado (Pill) para hacer juego con los botones del Hero */
  font-size: 0.9rem;
  background: #fff;
  /* CAMBIADO: Color de texto interno adaptado a la base ciruela oscura */
  color: #880e4f;
  outline: none;
  box-sizing: border-box;
  transition: box-shadow 0.18s;
  -webkit-appearance: none;
}
.nl-input:focus {
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.35);
}
.nl-input:disabled {
  background: rgba(255, 255, 255, 0.7);
  color: rgba(136, 14, 79, 0.5);
  cursor: not-allowed;
}
/* CAMBIADO: Color de placeholder adaptado */
.nl-input::placeholder { color: rgba(136, 14, 79, 0.4); }

.nl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 0.9rem 1.5rem;
  border-radius: 50px; /* CAMBIADO: Botón redondeado consistente con el sitio */
  border: none;
  /* CAMBIADO: El botón ahora usa el degradado lineal exacto del botón del Hero */
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s;
  letter-spacing: 0.2px;
}
.nl-btn i { font-size: 0.85rem; transition: transform 0.18s; }
.nl-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2); }
.nl-btn:hover:not(:disabled) .pi-arrow-right { transform: translateX(3px); }
.nl-btn:disabled { opacity: 0.85; cursor: not-allowed; background: #fff; color: #e91e8c; }

/* Nota / mensaje */
.nl-nota {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 4px 0 0 8px;
}
.nl-nota i { font-size: 0.72rem; }
.nl-mensaje {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50px; /* CAMBIADO: Redondeado a juego */
  padding: 0.65rem 1.2rem;
  margin: 4px 0 0;
}
.nl-mensaje i { font-size: 0.9rem; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .newsletter-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .newsletter-card { padding: 2.5rem 1.75rem; }
  .deco-2 { display: none; }
}
@media (max-width: 480px) {
  .newsletter-section { padding: 3.5rem 0 3rem; }
  .newsletter-card { padding: 2rem 1.25rem; }
  .trust-row { gap: 6px; }
}
</style>
