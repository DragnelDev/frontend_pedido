<template>
  <section class="easy-buy-features py-5">
    <div class="container text-center">
      <div class="section-header mb-5">
        <span class="section-tag">Así de fácil</span>
        <h2 class="section-titulo">Compra online fácilmente</h2>
        <p class="section-subtitulo">Tus pasteles favoritos, a un clic de distancia</p>
      </div>

      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon-wrap">
            <i class="pi pi-truck"></i>
          </div>
          <h3 class="feature-title">Envíos a domicilio</h3>
          <p class="feature-description">Recibe tu pedido fresco y listo en la puerta de tu casa</p>
        </div>

        <div class="feature-item">
          <div class="feature-icon-wrap">
            <i class="pi pi-shield"></i>
          </div>
          <h3 class="feature-title">Compra segura</h3>
          <p class="feature-description">
            Resguardamos tu información y te brindamos seguimiento a tu pedido
          </p>
        </div>

        <div class="feature-item">
          <div class="feature-icon-wrap">
            <i class="pi pi-whatsapp"></i>
          </div>
          <h3 class="feature-title">Atención al cliente</h3>
          <p class="feature-description">
            ¡Contáctanos ante cualquier duda! Nos encantaría ayudarte
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Aquí luego agregaremos funcionalidad real
</script>

<style scoped>
.easy-buy-features {
  background: white;
}

.section-tag {
  display: inline-block;
  background: #fce4ec;
  color: #e91e8c;
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
  color: #c2185b;
  margin-bottom: 0.4rem;
}

.section-subtitulo {
  color: #ad1457;
  opacity: 0.7;
  font-size: 1rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
}

.feature-icon-wrap {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.18);
}

.feature-icon-wrap .pi {
  font-size: 2rem;
  color: #e91e8c;
}

.feature-title {
  font-size: 1rem;
  font-weight: 700;
  color: #880e4f;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.feature-description {
  font-size: 0.9rem;
  color: #777;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 576px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
