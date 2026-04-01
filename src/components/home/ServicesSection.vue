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
  <div class="services-wrapper">
    <section class="services py-5">
      <div class="container">
        <div class="section-header text-center mb-5">
          <span class="section-tag">¿Por qué elegirnos?</span>
          <h2 class="section-titulo">Nuestro compromiso contigo</h2>
        </div>
        <div class="services-grid">
          <div class="service-box" v-for="(s, i) in services" :key="i">
            <div class="service-icon">{{ s.icon }}</div>
            <h4 class="service-title">{{ s.title }}</h4>
            <p class="service-text">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.services-wrapper {
  background: linear-gradient(135deg, #fce4ec 0%, #fff0f5 100%);
}

.section-tag {
  display: inline-block;
  background: #f8bbd0;
  color: #c2185b;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 0.3rem 1rem;
  border-radius: 50px;
  margin-bottom: 0.75rem;
}

.section-titulo {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #880e4f;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.service-box {
  background: white;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border-top: 4px solid transparent;
}

.service-box:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(233, 30, 140, 0.18);
  border-top-color: #e91e8c;
}

.service-icon {
  font-size: 2.8rem;
  margin-bottom: 1rem;
}

.service-title {
  font-weight: 700;
  color: #c2185b;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.service-text {
  color: #777;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}
</style>
