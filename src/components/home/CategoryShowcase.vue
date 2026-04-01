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
  <section class="categorias-section py-5">
    <div class="container">
      <div class="section-header text-center mb-5">
        <span class="section-tag">Nuestras especialidades</span>
        <h2 class="section-titulo">Explora nuestras categorías</h2>
        <p class="section-subtitulo">Todo hecho con amor para ti 🍓</p>
      </div>

      <Swiper
        :modules="[Navigation, Autoplay]"
        :slides-per-view="1"
        :breakpoints="{
          576: { slidesPerView: 2, spaceBetween: 16 },
          992: { slidesPerView: 3, spaceBetween: 24 },
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
          @click="irACategoria(categoria.id)"
          class="tarjeta-categoria"
        >
          <div class="card-categoria">
            <div class="imagen-wrapper">
              <img :src="categoria.imagenUrl" :alt="categoria.nombre" />
              <div class="imagen-overlay"></div>
            </div>
            <div class="info-box">
              <h5>{{ categoria.nombre }}</h5>
              <p>{{ categoria.descripcion }}</p>
              <button class="btn-ver" @click.stop="irACategoria(categoria.id)">
                Ver productos
              </button>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  </section>
</template>

<style scoped>
.categorias-section {
  background: linear-gradient(180deg, #fff9fb 0%, #fff0f5 100%);
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
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 800;
  color: #c2185b;
  margin-bottom: 0.4rem;
}

.section-subtitulo {
  color: #ad1457;
  opacity: 0.75;
  font-size: 1rem;
}

.categorias-swiper {
  padding-bottom: 2rem;
}

.tarjeta-categoria {
  cursor: pointer;
}

.card-categoria {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  height: 100%;
}

.card-categoria:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(233, 30, 140, 0.2);
}

.imagen-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.imagen-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.card-categoria:hover .imagen-wrapper img {
  transform: scale(1.06);
}

.imagen-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(194, 24, 91, 0.3) 100%);
}

.info-box {
  background: white;
  padding: 1.25rem;
  text-align: center;
}

.info-box h5 {
  font-weight: 700;
  color: #880e4f;
  margin-bottom: 0.4rem;
  font-size: 1.05rem;
}

.info-box p {
  color: #888;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.btn-ver {
  background: linear-gradient(135deg, #e91e8c, #f48fb1);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.5rem 1.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  cursor: pointer;
}

.btn-ver:hover {
  opacity: 0.9;
  transform: scale(1.04);
}
</style>
