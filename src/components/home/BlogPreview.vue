<template>
  <section class="features-section">
    <div class="container">
      <!-- Header -->
      <div class="section-header">
        <span class="eyebrow"><span class="eyebrow-dot"></span> Así de fácil</span>
        <h2 class="section-titulo">Compra online fácilmente</h2>
        <p class="section-sub">Tus pasteles favoritos, a un clic de distancia</p>
      </div>

      <!-- Grid -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="icon-wrap">
            <i class="pi pi-truck"></i>
          </div>
          <h3 class="feature-title">Envíos a domicilio</h3>
          <p class="feature-text">Recibe tu pedido fresco y listo en la puerta de tu casa</p>
        </div>

        <div class="feature-card">
          <div class="icon-wrap">
            <i class="pi pi-shield"></i>
          </div>
          <h3 class="feature-title">Compra segura</h3>
          <p class="feature-text">
            Resguardamos tu información y te brindamos seguimiento a tu pedido
          </p>
        </div>

        <div class="feature-card">
          <div class="icon-wrap">
            <i class="pi pi-whatsapp"></i>
          </div>
          <h3 class="feature-title">Atención al cliente</h3>
          <p class="feature-text">¡Contáctanos ante cualquier duda! Nos encantaría ayudarte</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Sección lista para lógica futura
</script>

<style scoped>
/* ── Base ── */
.features-section {
  padding: 5rem 0 4rem;
  /* Mantenemos fondo claro plano para contrastar con las secciones en degradado */
  background: #fff8fb;
}
.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* ── Header ── */
.section-header {
  text-align: center;
  margin-bottom: 3rem;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  /* CAMBIADO: Tono rosa corporativo unificado */
  color: #ff80b0;
  margin-bottom: 0.6rem;
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff80b0;
  display: inline-block;
}
.section-titulo {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 800;
  /* CAMBIADO: Color insignia para títulos */
  color: #c2185b;
  letter-spacing: -0.5px;
  margin: 0 0 0.35rem;
  line-height: 1.2;
}
.section-sub {
  font-size: 0.9rem;
  /* CAMBIADO: Tono ciruela suave */
  color: rgba(136, 14, 79, 0.85);
  margin: 0;
}

/* ── Grid ── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

/* ── Card ── */
.feature-card {
  background: #fff;
  border: 1px solid #ffd6e8; /* CAMBIADO: Tono de borde suavizado */
  border-radius: 24px; /* CAMBIADO: Esquinas consistentes con el catálogo */
  padding: 2.25rem 1.75rem;
  text-align: center;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}
.feature-card:hover {
  transform: translateY(-6px);
  /* CAMBIADO: Sombra con destello rosa sutil */
  box-shadow: 0 16px 40px rgba(233, 30, 140, 0.12);
  border-color: #ff80b0;
}

/* Icono */
.icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #fff0f5;
  border: 1px solid #ffd6e8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  transition: all 0.25s ease;
}
.icon-wrap .pi {
  font-size: 1.5rem;
  /* CAMBIADO: Color por defecto del icono unificado */
  color: #e91e8c;
  transition: color 0.2s;
}
.feature-card:hover .icon-wrap {
  /* CAMBIADO: Transición al degradado dinámico oficial en hover */
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  transform: scale(1.08) rotate(-3deg);
}
.feature-card:hover .icon-wrap .pi {
  color: #fff;
}

.feature-title {
  font-size: 0.95rem;
  font-weight: 800;
  /* CAMBIADO: Titular ciruela oscuro */
  color: #880e4f;
  letter-spacing: -0.2px;
  margin: 0 0 0.5rem;
}
.feature-text {
  font-size: 0.83rem;
  /* CAMBIADO: Cuerpo del texto ciruela con opacidad controlada */
  color: rgba(136, 14, 79, 0.7);
  line-height: 1.6;
  margin: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .features-section {
    padding: 3.5rem 0 3rem;
  }
}
@media (min-width: 480px) and (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
