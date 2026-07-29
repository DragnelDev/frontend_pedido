<script lang="ts">
const misImagenes = [
  {
    id: 1,
    url: 'https://coconut.com.bo/wp-content/uploads/2024/01/torta-clasica-de-maracuya1.jpg?random=1',
    link: 'https://instagram.com/p/1',
  },
  {
    id: 2,
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDwqtbHRaPhGf2X28mz_n2yK2WKQGzJ7DGOA&s?random=2',
    link: 'https://instagram.com/p/2',
  },
  {
    id: 3,
    url: 'https://cdn.euroinnova.edu.es/img/subidasEditor/pastelero-1604585857.webp?random=3',
    link: 'https://instagram.com/p/3',
  },
]
</script>

<template>
  <section class="ig-section">
    <div class="container">
      <div class="section-header">
        <div class="header-left">
          <span class="eyebrow"><span class="eyebrow-dot"></span> Redes sociales</span>
          <h2 class="section-titulo">Síguenos en Instagram</h2>
          <p class="section-sub">Comparte tus momentos dulces con nosotros y etiquétanos</p>
        </div>
        <a href="https://instagram.com/berrysweet" target="_blank" class="handle-pill">
          <i class="pi pi-instagram"></i>
          @berrysweet
        </a>
      </div>

      <div class="gallery-grid">
        <a
          v-for="foto in misImagenes"
          :key="foto.id"
          :href="foto.link"
          target="_blank"
          class="gallery-item"
        >
          <img :src="foto.url" alt="Berry Sweet en Instagram" class="gallery-img" />
          <div class="gallery-overlay">
            <div class="overlay-inner">
              <i class="pi pi-instagram"></i>
              <span>Ver en Instagram</span>
            </div>
          </div>
        </a>
      </div>

      <div class="cta-wrap">
        <a href="https://instagram.com/berrysweet" target="_blank" class="btn-ig">
          <i class="pi pi-instagram"></i>
          Ver más en Instagram
          <i class="pi pi-arrow-right arrow"></i>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Aquí luego se puede agregar integración con la API de Instagram
</script>

<style scoped>
/* ── Base ── */
.ig-section {
  padding: 5rem 0 4rem;
  /* CAMBIADO: Fondo adaptado al degradado lineal */
  background: linear-gradient(135deg, #fff0f5 0%, #ffe4ef 50%, #ffd6e8 100%);
}
.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* ── Header ── */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
  gap: 1rem;
}
.header-left {
  max-width: 480px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  /* CAMBIADO: Rosa del badge oficial */
  color: #ff80b0;
  margin-bottom: 0.5rem;
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
  /* CAMBIADO: Título oficial corporativo */
  color: #c2185b;
  letter-spacing: -0.5px;
  margin: 0 0 0.3rem;
  line-height: 1.2;
}
.section-sub {
  font-size: 0.9rem;
  /* CAMBIADO: Color ciruela con opacidad */
  color: rgba(136, 14, 79, 0.85);
  margin: 0;
}

/* Handle pill */
.handle-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.85rem;
  font-weight: 700;
  /* CAMBIADO: Estilos sincronizados */
  color: #880e4f;
  text-decoration: none;
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  border: 1.5px solid #ffd6e8;
  background: #fff;
  flex-shrink: 0;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.handle-pill i {
  font-size: 1rem;
}
.handle-pill:hover {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: #fff;
}

/* ── Galería ── */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  max-width: 780px;
  margin: 0 auto;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 20px; /* CAMBIADO: Bordes redondeados más suaves */
  overflow: hidden;
  border: 1px solid #ffd6e8;
  display: block;
  background: #fff0f5;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.gallery-item:hover .gallery-img {
  transform: scale(1.08);
}

/* Overlay */
.gallery-overlay {
  position: absolute;
  inset: 0;
  /* CAMBIADO: Transparencia ciruela corporativa elegante al hacer hover */
  background: rgba(136, 14, 79, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 20px;
}
.gallery-item:hover .gallery-overlay {
  opacity: 1;
}
.overlay-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
}
.overlay-inner i {
  font-size: 1.6rem;
}

/* ── CTA ── */
.cta-wrap {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
.btn-ig {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  /* CAMBIADO: Botón secundario a tono con bordes */
  color: #880e4f;
  text-decoration: none;
  padding: 0.72rem 1.5rem;
  border-radius: 50px;
  border: 1.5px solid #ffd6e8;
  background: #fff;
  transition: all 0.2s ease;
}
.btn-ig .pi-instagram {
  font-size: 1rem;
}
.btn-ig .arrow {
  font-size: 0.75rem;
  transition: transform 0.18s;
}
.btn-ig:hover {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(233, 30, 140, 0.2);
}
.btn-ig:hover .arrow {
  transform: translateX(3px);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 100%;
  }
  .ig-section {
    padding: 3.5rem 0 3rem;
  }
}
</style>
