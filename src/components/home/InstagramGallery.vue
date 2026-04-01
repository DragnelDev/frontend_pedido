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
  <section class="instagram-gallery py-5 text-center">
    <div class="container">
      <div class="section-header mb-4">
        <span class="section-tag">📸 Redes sociales</span>
        <h2 class="section-titulo">Síguenos en Instagram</h2>
        <p class="section-subtitulo">
          <a href="https://instagram.com/berrysweet" target="_blank" class="ig-handle">
            @berrysweet
          </a>
          — Comparte tus momentos dulces con nosotros
        </p>
      </div>

      <!-- Galería placeholder responsiva -->
      <div class="gallery-grid">
        <div class="gallery-item" v-for="foto in misImagenes" :key="foto.id">
          <div class="gallery-image-container">
            <img :src="foto.url" alt="Galería" class="img-fluid" />
          </div>

          <a :href="foto.link" target="_blank" class="gallery-hover">
            <i class="pi pi-instagram"></i>
            <span>Ver en Instagram</span>
          </a>
        </div>
      </div>

      <a
        href="https://instagram.com/berrysweet"
        target="_blank"
        class="btn-instagram mt-4 d-inline-block"
      >
        <i class="pi pi-instagram me-2"></i>Ver más en Instagram
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
// Aquí luego agregaremos integración con API de Instagram
</script>

<style scoped>
.instagram-gallery {
  background: linear-gradient(135deg, #fff0f5 0%, #fce4ec 100%);
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
  color: #c2185b;
  margin-bottom: 0.4rem;
}

.section-subtitulo {
  color: #888;
  font-size: 0.95rem;
}

.ig-handle {
  color: #e91e8c;
  font-weight: 600;
  text-decoration: none;
}

.ig-handle:hover {
  text-decoration: underline;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  max-width: 720px;
  margin: 0 auto;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #fce4ec;
  cursor: pointer;
}

.gallery-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f48fb1;
  font-size: 2rem;
  background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  transition: transform 0.3s ease;
}

.gallery-item:hover .gallery-placeholder {
  transform: scale(1.05);
}

.gallery-hover {
  position: absolute;
  inset: 0;
  background: rgba(194, 24, 91, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
}

.gallery-item:hover .gallery-hover {
  opacity: 1;
}

.btn-instagram {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-size: 0.95rem;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-instagram:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.45);
  color: white;
}

@media (max-width: 576px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
