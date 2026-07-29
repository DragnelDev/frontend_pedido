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
  <section class="productos-section">
    <div class="container">
      <!-- Header -->
      <div class="section-header">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span> Recién horneado</span>
          <h2 class="section-titulo">Productos destacados</h2>
          <p class="section-sub">Los favoritos de nuestros clientes, siempre frescos</p>
        </div>
        <a class="ver-todos" href="/productos"> Ver todos <i class="pi pi-arrow-right"></i> </a>
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
        :autoplay="{ delay: 4000, disableOnInteraction: false }"
        loop
        class="ofertas-swiper"
      >
        <SwiperSlide v-for="producto in productos" :key="producto.id" class="slide-wrap">
          <div class="card-producto">
            <!-- Imagen -->
            <div class="img-wrap">
              <img
                :src="producto.imagenUrl || '/assets/images/default.jpg'"
                :alt="producto.nombre"
                class="prod-img"
              />
              <div class="img-gradient"></div>

              <!-- Overlay ver detalle -->
              <div class="overlay-detalle" @click="irADetalle(producto)">
                <i class="pi pi-eye"></i>
                <span>Ver detalle</span>
              </div>

              <!-- Precio flotante -->
              <span class="precio-badge">Bs. {{ producto.precio }}</span>
            </div>

            <!-- Info -->
            <div class="card-body">
              <h5 class="prod-nombre">{{ producto.nombre }}</h5>
              <p class="prod-desc">{{ producto.descripcion }}</p>
              <button class="btn-carrito" @click="añadirAlCarrito(producto)">
                <i class="pi pi-shopping-cart"></i>
                <span>Añadir al carrito</span>
              </button>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  </section>

  <!-- Modal login -->
  <Dialog
    v-model:visible="mostrarModalLogin"
    modal
    :style="{ width: '90vw', maxWidth: '380px' }"
    :pt="{
      root: { class: 'modal-custom' },
      header: { style: 'display:none' },
    }"
  >
    <div class="modal-body">
      <div class="modal-icon"><i class="pi pi-lock"></i></div>
      <h3 class="modal-titulo">Inicia sesión primero</h3>
      <p class="modal-sub">Para agregar productos al carrito necesitas una cuenta activa.</p>
      <div class="modal-actions">
        <button class="btn-modal-cancel" @click="mostrarModalLogin = false">Cancelar</button>
        <button class="btn-modal-ok" @click="irALogin">Ir al login</button>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
/* ── Base ── */
.productos-section {
  padding: 5rem 0 4rem;
  /* CAMBIADO: Adaptado al degradado de fondo del Hero Banner */
  background: linear-gradient(135deg, #fff0f5 0%, #ffe4ef 100%);
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
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  /* CAMBIADO: Tono rosa intermedio del Hero */
  color: #ff80b0;
  margin-bottom: 0.5rem;
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* CAMBIADO: Rosa vibrante del badge */
  background: #ff80b0;
  display: inline-block;
}
.section-titulo {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 800;
  /* CAMBIADO: Título principal en rosa oscuro insignia */
  color: #c2185b;
  letter-spacing: -0.5px;
  margin: 0 0 0.3...;
  line-height: 1.2;
}
.section-sub {
  font-size: 0.9rem;
  /* CAMBIADO: Tono ciruela suavizado */
  color: rgba(136, 14, 79, 0.75);
  margin: 0;
}
.ver-todos {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.83rem;
  font-weight: 700;
  /* CAMBIADO: Color de texto del enlace adaptado */
  color: #e91e8c;
  text-decoration: none;
  white-space: nowrap;
  padding: 0.55rem 1.1rem;
  border-radius: 50px;
  /* CAMBIADO: Borde sutil a juego con las tarjetas */
  border: 1.5px solid #ffd6e8;
  background: #fff;
  flex-shrink: 0;
  transition:
    background 0.18s,
    border-color 0.18s,
    color 0.18s;
}
.ver-todos i {
  font-size: 0.75rem;
  transition: transform 0.18s;
}
/* CAMBIADO: Al pasar por encima, adopta el fondo degradado corporativo */
.ver-todos:hover {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: #fff;
}
.ver-todos:hover i {
  transform: translateX(3px);
}

/* ── Swiper ── */
.ofertas-swiper {
  padding-bottom: 3rem !important;
  padding-left: 2px !important;
  padding-right: 2px !important;
}
.ofertas-swiper :deep(.swiper-button-prev),
.ofertas-swiper :deep(.swiper-button-next) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  /* CAMBIADO: Borde adaptado */
  border: 1.5px solid #ffd6e8;
  top: auto;
  bottom: 0;
  /* CAMBIADO: Color de las flechas a rosa del badge */
  color: #ff80b0;
  box-shadow: 0 4px 10px rgba(233, 30, 140, 0.1);
  transition:
    background 0.18s,
    border-color 0.18s,
    color 0.18s;
}
.ofertas-swiper :deep(.swiper-button-prev) {
  left: calc(50% - 52px);
}
.ofertas-swiper :deep(.swiper-button-next) {
  right: calc(50% - 52px);
  left: auto;
}
/* CAMBIADO: Botones de navegación en hover con degradado del botón del hero */
.ofertas-swiper :deep(.swiper-button-prev:hover),
.ofertas-swiper :deep(.swiper-button-next:hover) {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: #fff;
}
.ofertas-swiper :deep(.swiper-button-prev::after),
.ofertas-swiper :deep(.swiper-button-next::after) {
  font-size: 13px;
  font-weight: 800;
}

.slide-wrap {
  height: auto;
}

/* ── Card ── */
.card-producto {
  background: #fff;
  border-radius: 20px;
  /* CAMBIADO: Borde adaptado */
  border: 1px solid #ffd6e8;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}
.card-producto:hover {
  transform: translateY(-6px);
  /* CAMBIADO: Sombra con tono rosado difuminado */
  box-shadow: 0 16px 40px rgba(233, 30, 140, 0.12);
  border-color: #ff80b0;
}

/* Imagen */
.img-wrap {
  position: relative;
  height: 210px;
  overflow: hidden;
  flex-shrink: 0;
}
.prod-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.card-producto:hover .prod-img {
  transform: scale(1.07);
}
.img-gradient {
  position: absolute;
  inset: 0;
  /* CAMBIADO: El gradiente oscuro de la imagen se adaptó sutilmente al ciruela oscuro */
  background: linear-gradient(180deg, transparent 45%, rgba(136, 14, 79, 0.25) 100%);
}

/* Overlay ver detalle */
.overlay-detalle {
  position: absolute;
  inset: 0;
  /* CAMBIADO: Fondo translúcido con el tono rosa medio del Hero */
  background: rgba(233, 30, 140, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.25s ease;
}
.overlay-detalle i {
  font-size: 1.5rem;
}
.card-producto:hover .overlay-detalle {
  opacity: 1;
}

/* Precio flotante en imagen */
.precio-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  /* CAMBIADO: Color de texto del precio */
  color: #e91e8c;
  font-size: 0.9rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 50px;
  /* CAMBIADO: Borde del badge de precio */
  border: 1px solid #ffd6e8;
  letter-spacing: -0.2px;
}

/* Body */
.card-body {
  padding: 1.2rem 1.35rem 1.35rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.prod-nombre {
  font-size: 1rem;
  font-weight: 800;
  /* CAMBIADO: Color ciruela oscuro para los títulos secundarios */
  color: #880e4f;
  margin: 0 0 0.3rem;
  letter-spacing: -0.2px;
}
.prod-desc {
  font-size: 0.82rem;
  /* CAMBIADO: Color ciruela con opacidad */
  color: rgba(136, 14, 79, 0.8);
  line-height: 1.5;
  margin: 0 0 1rem;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.btn-carrito {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 0.62rem 1rem;
  border-radius: 50px;
  border: none;
  /* CAMBIADO: Botón principal con el degradado del botón del Hero */
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.2);
  transition:
    transform 0.18s,
    box-shadow 0.18s;
  margin-top: auto;
}
.btn-carrito i {
  font-size: 0.85rem;
}
.btn-carrito:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(233, 30, 140, 0.35);
}

/* ── Modal ── */
.modal-body {
  padding: 1.75rem 1.5rem 1.5rem;
  text-align: center;
}
.modal-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  /* CAMBIADO: Fondo del ícono del candado */
  background: #fff0f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  /* CAMBIADO: Color del ícono del candado */
  color: #ff80b0;
  margin: 0 auto 1rem;
}
.modal-titulo {
  font-size: 1.05rem;
  font-weight: 800;
  /* CAMBIADO: Título del modal en ciruela */
  color: #880e4f;
  margin: 0 0 0.4rem;
}
.modal-sub {
  font-size: 0.85rem;
  /* CAMBIADO: Descripción en ciruela con opacidad */
  color: rgba(136, 14, 79, 0.8);
  margin: 0 0 1.5rem;
  line-height: 1.5;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.btn-modal-cancel {
  padding: 0.62rem 1.2rem;
  border-radius: 50px;
  /* CAMBIADO: Borde adaptado */
  border: 1.5px solid #ffd6e8;
  background: transparent;
  /* CAMBIADO: Color de texto del botón cancelar */
  color: rgba(136, 14, 79, 0.7);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-modal-cancel:hover {
  background: #fff0f5;
}
.btn-modal-ok {
  padding: 0.62rem 1.4rem;
  border-radius: 50px;
  border: none;
  /* CAMBIADO: Botón de confirmación con degradado del Hero */
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.2);
  transition:
    transform 0.18s,
    box-shadow 0.18s;
}
.btn-modal-ok:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(233, 30, 140, 0.35);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .productos-section {
    padding: 3.5rem 0 3rem;
  }
}
</style>
