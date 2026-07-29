<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation, Autoplay } from 'swiper/modules'

import http from '@/plugins/axios'
import type { Categoria } from '@/models/categoria'
import { useRouter } from 'vue-router'

const router = useRouter()
const ENDPOINT = 'categorias'
const categorias = ref<Categoria[]>([])

const imagenesCategorias: Record<string, string> = {
  tortas: new URL('@/assets/images/insta-item2.jpg', import.meta.url).href,
  cupcakes: new URL('@/assets/images/insta-item2.jpg', import.meta.url).href,
  postres: new URL('@/assets/images/comidas.jpg', import.meta.url).href,
}

const obtenerLista = async () => {
  try {
    const respuesta = await http.get(ENDPOINT)
    categorias.value = respuesta.data
  } catch (error) {
    console.error('Error al obtener categorías:', error)
  }
}

const categoriasConImagen = computed(() =>
  categorias.value.map((c) => {
    const slug = c.nombre.toLowerCase().replace(/\s+/g, '-')
    return {
      ...c,
      slug,
      imagen:
        imagenesCategorias[slug] || new URL('@/assets/images/default.jpg', import.meta.url).href,
    }
  }),
)

const irACategoria = (idCategoria: number) => {
  router.push(`/categorias/${idCategoria}`)
}

onMounted(() => {
  obtenerLista()
})
</script>

<template>
  <section class="categorias-section">
    <div class="container">
      <!-- Header -->
      <div class="section-header">
        <div class="header-left">
          <span class="eyebrow"><span class="eyebrow-dot"></span> Nuestras especialidades</span>
          <h2 class="section-titulo">Explora nuestras categorías</h2>
          <p class="section-sub">Todo hecho con amor, desde nuestro horno hasta tu mesa</p>
        </div>
        <div class="header-deco" aria-hidden="true">
          <span class="deco-pill">🍓</span>
          <span class="deco-pill alt">🎂</span>
        </div>
      </div>

      <!-- Swiper -->
      <Swiper
        :modules="[Navigation, Autoplay]"
        :slides-per-view="1"
        :breakpoints="{
          576: { slidesPerView: 2, spaceBetween: 20 },
          992: { slidesPerView: 3, spaceBetween: 28 },
        }"
        :space-between="16"
        navigation
        :autoplay="{ delay: 3500, disableOnInteraction: false }"
        loop
        class="categorias-swiper"
      >
        <SwiperSlide
          v-for="categoria in categoriasConImagen"
          :key="categoria.id"
          class="slide-wrapper"
          @click="irACategoria(categoria.id)"
        >
          <div class="card-categoria">
            <!-- Imagen -->
            <div class="img-wrap">
              <img
                :src="categoria.imagenUrl || categoria.imagen"
                :alt="categoria.nombre"
                class="cat-img"
              />
              <div class="img-gradient"></div>
              <span class="cat-badge">Ver productos</span>
            </div>

            <!-- Info -->
            <div class="card-body">
              <h5 class="cat-nombre">{{ categoria.nombre }}</h5>
              <p class="cat-desc">{{ categoria.descripcion }}</p>
              <button class="btn-ir" @click.stop="irACategoria(categoria.id)">
                <span>Explorar</span>
                <i class="pi pi-arrow-right"></i>
              </button>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  </section>
</template>

<style scoped>
/* ── Base ── */
.categorias-section {
  padding: 5rem 0 4rem;
  /* CAMBIADO: Adaptado al degradado de fondo oficial */
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
  /* CAMBIADO: Sincronizado con el rosa intermedio corporativo */
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
  /* CAMBIADO: Color principal de títulos */
  color: #c2185b;
  letter-spacing: -0.5px;
  margin: 0 0 0.35rem;
  line-height: 1.2;
}

.section-sub {
  font-size: 0.9rem;
  /* CAMBIADO: Tono ciruela con opacidad */
  color: rgba(136, 14, 79, 0.85);
  margin: 0;
}

.header-deco {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.deco-pill {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #fff;
  /* CAMBIADO: Borde adaptado sutilmente */
  border: 1px solid #ffd6e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}
.deco-pill.alt {
  background: #fff0f5;
  border-color: #ffd6e8;
}

/* ── Swiper ── */
.categorias-swiper {
  padding-bottom: 3rem !important;
  padding-left: 2px !important;
  padding-right: 2px !important;
}

/* Flechas de navegación */
.categorias-swiper :deep(.swiper-button-prev),
.categorias-swiper :deep(.swiper-button-next) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  /* CAMBIADO: Sincronizado con la paleta suave */
  border: 1.5px solid #ffd6e8;
  top: auto;
  bottom: 0;
  color: #e91e8c;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.1);
  transition: all 0.2s ease;
}
.categorias-swiper :deep(.swiper-button-prev) {
  left: calc(50% - 52px);
}
.categorias-swiper :deep(.swiper-button-next) {
  right: calc(50% - 52px);
  left: auto;
}
.categorias-swiper :deep(.swiper-button-prev:hover),
.categorias-swiper :deep(.swiper-button-next:hover) {
  /* CAMBIADO: Al hacer hover, adopta el degradado insignia dinámico */
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: #fff;
}
.categorias-swiper :deep(.swiper-button-prev::after),
.categorias-swiper :deep(.swiper-button-next::after) {
  font-size: 13px;
  font-weight: 800;
}

/* ── Slide wrapper ── */
.slide-wrapper {
  cursor: pointer;
  height: auto;
}

/* ── Card ── */
.card-categoria {
  background: #fff;
  border-radius: 24px; /* CAMBIADO: Bordes redondeados consistentes */
  border: 1px solid #ffd6e8;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}
.card-categoria:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(233, 30, 140, 0.15);
  border-color: #ff80b0;
}

/* Imagen */
.img-wrap {
  position: relative;
  height: 210px;
  overflow: hidden;
  flex-shrink: 0;
}
.cat-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
  display: block;
}
.card-categoria:hover .cat-img {
  transform: scale(1.07);
}
.img-gradient {
  position: absolute;
  inset: 0;
  /* CAMBIADO: Gradiente adaptado al tono ciruela profundo oscuro */
  background: linear-gradient(180deg, transparent 40%, rgba(136, 14, 79, 0.25) 100%);
}

/* Badge flotante en imagen */
.cat-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  /* CAMBIADO: Color ciruela elegante */
  color: #880e4f;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 50px;
  border: 1px solid #ffd6e8;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.card-categoria:hover .cat-badge {
  opacity: 1;
  transform: translateY(0);
}

/* Body de la card */
.card-body {
  padding: 1.25rem 1.35rem 1.4rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.cat-nombre {
  font-size: 1rem;
  font-weight: 800;
  /* CAMBIADO: Variante ciruela oscura de marca */
  color: #880e4f;
  margin: 0 0 0.35rem;
  letter-spacing: -0.2px;
}
.cat-desc {
  font-size: 0.83rem;
  /* CAMBIADO: Color de descripción suavizado */
  color: rgba(136, 14, 79, 0.7);
  line-height: 1.5;
  margin: 0 0 1.1rem;
  flex: 1;
}

/* Botón */
.btn-ir {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  align-self: flex-start;
  padding: 0.52rem 1.15rem;
  border-radius: 50px;
  /* CAMBIADO: Estilo secundario redondeado a tono */
  border: 1.5px solid #ffd6e8;
  background: #fff;
  color: #880e4f;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-ir i {
  font-size: 0.78rem;
  transition: transform 0.18s;
}
.btn-ir:hover {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: #fff;
  transform: translateY(-1px);
}
.btn-ir:hover i {
  transform: translateX(3px);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-deco {
    display: none;
  }
  .categorias-section {
    padding: 3.5rem 0 3rem;
  }
}
</style>
