<script setup lang="ts">
const services = [
  {
    icon: '🚚',
    title: 'Envíos a domicilio',
    text: 'Recibe tus pedidos fresquecitos en la puerta de tu casa en Sucre',
  },
  {
    icon: '🎂',
    title: 'Tortas personalizadas',
    text: 'Diseñamos tu torta soñada para cada ocasión especial',
  },
  {
    icon: '💳',
    title: 'Pago seguro',
    text: 'Aceptamos transferencias, QR y tarjetas de forma segura',
  },
  {
    icon: '🔁',
    title: 'Garantía de calidad',
    text: 'Si no estás satisfecho, nos comprometemos a resolverlo',
  },
]
</script>

<template>
  <section class="services-section">
    <div class="container">

      <!-- Header -->
      <div class="section-header">
        <span class="eyebrow"><span class="eyebrow-dot"></span> ¿Por qué elegirnos?</span>
        <h2 class="section-titulo">Nuestro compromiso contigo</h2>
        <p class="section-sub">Cada detalle pensado para que tu experiencia sea perfecta</p>
      </div>

      <!-- Grid -->
      <div class="services-grid">
        <div
          v-for="(s, i) in services"
          :key="i"
          class="service-card"
        >
          <div class="icon-wrap">
            <span class="service-icon">{{ s.icon }}</span>
          </div>
          <h4 class="service-title">{{ s.title }}</h4>
          <p class="service-text">{{ s.text }}</p>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* ── Base ── */
.services-section {
  padding: 5rem 0 4rem;
  /* CAMBIADO: Ajustado al degradado suave de fondo del HeroBanner */
  background: linear-gradient(135deg, #fff0f5 0%, #ffe4ef 100%);
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
  /* CAMBIADO: Color rosa intermedio del Hero */
  color: #ff80b0;
  margin-bottom: 0.6rem;
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* CAMBIADO: Usando el rosa vibrante del badge */
  background: #ff80b0;
  display: inline-block;
}
.section-titulo {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 800;
  /* CAMBIADO: Color principal de títulos del Hero (#c2185b) */
  color: #c2185b;
  letter-spacing: -0.5px;
  margin: 0 0 0.35rem;
  line-height: 1.2;
}
.section-sub {
  font-size: 0.9rem;
  /* CAMBIADO: Tono ciruela oscuro suavizado con opacidad */
  color: rgba(136, 14, 79, 0.75);
  margin: 0;
}

/* ── Grid ── */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.25rem;
}

/* ── Card ── */
.service-card {
  background: #fff;
  border-radius: 20px;
  /* CAMBIADO: Borde adaptado al tono suave rosado */
  border: 1px solid #ffd6e8;
  padding: 2rem 1.5rem;
  text-align: center;
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}
.service-card:hover {
  transform: translateY(-6px);
  /* CAMBIADO: Sombra difuminada utilizando la tonalidad de los botones del Hero */
  box-shadow: 0 16px 40px rgba(233, 30, 140, 0.12);
  border-color: #ff80b0;
}

/* Icono */
.icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  /* CAMBIADO: Color de fondo interno sutil */
  background: #fff0f5;
  border: 1px solid #ffd6e8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.1rem;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}
.service-card:hover .icon-wrap {
  /* CAMBIADO: Degradado idéntico al botón principal en el estado hover */
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  transform: scale(1.08) rotate(-3deg);
}
/* CAMBIADO: Asegura que el emoji resalte bien cuando cambie el fondo a rosa en hover */
.service-card:hover .service-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}
.service-icon {
  font-size: 1.6rem;
  line-height: 1;
}

.service-title {
  font-size: 0.95rem;
  font-weight: 800;
  /* CAMBIADO: Color ciruela oscuro para títulos secundarios (#880e4f) */
  color: #880e4f;
  letter-spacing: -0.2px;
  margin: 0 0 0.4rem;
}
.service-text {
  font-size: 0.83rem;
  /* CAMBIADO: Color ciruela con opacidad para una lectura suave */
  color: rgba(136, 14, 79, 0.8);
  line-height: 1.6;
  margin: 0;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .services-section { padding: 3.5rem 0 3rem; }
  .services-grid { grid-template-columns: 1fr 1fr; gap: 1rem; }
}
@media (max-width: 360px) {
  .services-grid { grid-template-columns: 1fr; }
}
</style>
