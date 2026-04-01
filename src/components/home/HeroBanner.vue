<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import { ref } from 'vue'

const slides = ref([
  {
    titulo: 'Pasteles artesanales con amor',
    texto: 'Endulza cada momento especial con nuestras creaciones únicas',
    imagen: new URL('@/assets/images/p1.png', import.meta.url).href,
  },
  {
    titulo: 'Tortas personalizadas',
    texto: 'Diseñadas especialmente para ti y tus celebraciones',
    imagen: new URL('@/assets/images/p2.png', import.meta.url).href,
  },
])
</script>

<template>
  <section class="hero-banner">
    <Swiper
      :modules="[Navigation, Pagination, Autoplay]"
      navigation
      pagination
      loop
      :autoplay="{ delay: 4000, disableOnInteraction: false }"
      class="hero-swiper"
    >
      <SwiperSlide v-for="(slide, i) in slides" :key="i">
        <div class="slide-inner">
          <div class="container">
            <div class="row align-items-center">
              <div class="col-12 col-md-6 text-section">
                <span class="badge-label">🍰 Berry Sweet</span>
                <h1 class="hero-titulo">{{ slide.titulo }}</h1>
                <p class="hero-texto">{{ slide.texto }}</p>
                <RouterLink to="/shop" class="btn-hero">Pedir ahora</RouterLink>
              </div>
              <div class="col-12 col-md-6 mt-4 mt-md-0 img-section">
                <img :src="slide.imagen" alt="banner pastelería" class="hero-img" />
              </div>
            </div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  </section>
</template>

<style scoped>
.hero-banner {
  background: linear-gradient(135deg, #fff0f5 0%, #ffe4ef 50%, #ffd6e8 100%);
  position: relative;
  overflow: hidden;
}

.hero-banner::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(255, 182, 210, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.hero-swiper {
  width: 100%;
}

.slide-inner {
  padding: 4rem 1rem;
}

.badge-label {
  display: inline-block;
  background: #ff80b0;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.3rem 1rem;
  border-radius: 50px;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

.hero-titulo {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: #c2185b;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.hero-texto {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #880e4f;
  margin-bottom: 2rem;
  opacity: 0.85;
}

.btn-hero {
  display: inline-block;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.85rem 2.2rem;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.35);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-hero:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.45);
  color: white;
}

.hero-img {
  width: 100%;
  max-width: 480px;
  border-radius: 24px;
  box-shadow: 0 16px 48px rgba(233, 30, 140, 0.2);
  display: block;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .slide-inner {
    padding: 2.5rem 1rem;
    text-align: center;
  }

  .text-section {
    order: 1;
  }

  .img-section {
    order: 2;
  }

  .btn-hero {
    width: 100%;
    text-align: center;
  }
}
</style>
