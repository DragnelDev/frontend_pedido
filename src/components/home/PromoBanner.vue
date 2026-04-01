<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation, Autoplay } from 'swiper/modules'

import http from '@/plugins/axios'
import type { Producto } from '@/models/producto'
import { useRouter } from 'vue-router'
import { usarCarrito } from '@/funciones/UsarCarrito'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const router = useRouter()

const ID_CATEGORIA = 3
const productos = ref<Producto[]>([])

const { agregarProducto } = usarCarrito()

const mostrarModalLogin = ref(false)

function estaLogueado(): boolean {
  return !!localStorage.getItem('token')
}

const obtenerProductosPorCategoria = async () => {
  try {
    const respuesta = await http.get(`productos/categoria/${ID_CATEGORIA}`)
    productos.value = respuesta.data
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error)
  }
}

const añadirAlCarrito = (producto: Producto) => {
  if (!estaLogueado()) {
    mostrarModalLogin.value = true
    return
  }
  agregarProducto(producto, 1)
}

const irADetalle = (producto: Producto) => {
  router.push({ name: 'detalle-producto', params: { id: producto.id } })
}

const irALogin = () => {
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

onMounted(() => {
  obtenerProductosPorCategoria()
})
</script>

<template>
  <section class="productos-section py-5">
    <div class="container">
      <div class="section-header text-center mb-5">
        <span class="section-tag">🍰 Recién horneado</span>
        <h2 class="section-titulo">Productos Destacados</h2>
        <p class="section-subtitulo">Los favoritos de nuestros clientes</p>
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
        :autoplay="{ delay: 4000, disableOnInteraction: false }"
        loop
        class="ofertas-swiper"
      >
        <SwiperSlide v-for="producto in productos" :key="producto.id" class="tarjeta-producto">
          <div class="card-oferta">
            <div class="imagen-wrapper">
              <img
                :src="producto.imagenUrl || '/assets/images/default.jpg'"
                :alt="producto.nombre"
              />
              <div class="overlay-btn" @click="irADetalle(producto)">
                <i class="bi bi-eye-fill"></i>
                <span>Ver detalle</span>
              </div>
            </div>

            <div class="info-box">
              <h5>{{ producto.nombre }}</h5>
              <p class="descripcion">{{ producto.descripcion }}</p>
              <div class="precio-row">
                <span class="precio">Bs. {{ producto.precio }}</span>
              </div>
              <button class="btn-comprar" @click="añadirAlCarrito(producto)">
                🛒 Añadir al carrito
              </button>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  </section>

  <!-- Modal de login -->
  <Dialog
    v-model:visible="mostrarModalLogin"
    modal
    header="Inicia sesión para continuar"
    :style="{ width: '90vw', maxWidth: '400px' }"
  >
    <p class="mb-4">Debes iniciar sesión para agregar productos al carrito.</p>
    <div class="d-flex justify-content-end gap-2">
      <Button label="Cerrar" class="p-button-text" @click="mostrarModalLogin = false" />
      <Button label="Ir al login" @click="irALogin" />
    </div>
  </Dialog>
</template>

<style scoped>
.productos-section {
  background: linear-gradient(180deg, #fff0f5 0%, #fce4ec 100%);
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
}

.ofertas-swiper {
  padding-bottom: 2rem;
}

.tarjeta-producto {
  height: auto;
}

.card-oferta {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.card-oferta:hover {
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

.card-oferta:hover .imagen-wrapper img {
  transform: scale(1.06);
}

.overlay-btn {
  position: absolute;
  inset: 0;
  background: rgba(194, 24, 91, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.overlay-btn i {
  font-size: 1.6rem;
}

.card-oferta:hover .overlay-btn {
  opacity: 1;
}

.info-box {
  padding: 1.25rem;
  text-align: center;
}

.info-box h5 {
  font-weight: 700;
  color: #880e4f;
  margin-bottom: 0.4rem;
  font-size: 1rem;
}

.descripcion {
  color: #999;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.precio-row {
  margin-bottom: 1rem;
}

.precio {
  font-weight: 800;
  color: #e91e8c;
  font-size: 1.15rem;
}

.btn-comprar {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f48fb1);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.6rem 1.2rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  cursor: pointer;
}

.btn-comprar:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
</style>
