<script setup lang="ts">
import { ref, watch } from 'vue'
import { Teleport } from 'vue'
import http from '@/plugins/axios'
import { useRouter, useRoute } from 'vue-router'
import { usarCarrito } from '@/funciones/UsarCarrito'
import type { Producto } from '@/models/producto'

const router = useRouter()
const route = useRoute()
const productos = ref<Producto[]>([])
const cargando = ref(false)
const mostrarModalLogin = ref(false)
const { agregarProducto } = usarCarrito()

function estaLogueado(): boolean {
  return !!localStorage.getItem('token')
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
  mostrarModalLogin.value = false
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

const cargarProductos = async (terminoBusqueda: string = '') => {
  cargando.value = true
  const url = terminoBusqueda ? `productos?q=${terminoBusqueda}` : 'productos'
  try {
    const res = await http.get(url)
    productos.value = res.data
  } catch (error) {
    console.error('Error al cargar productos:', error)
  } finally {
    cargando.value = false
  }
}

watch(
  () => route.query.q,
  (newQ) => cargarProductos((newQ as string) || ''),
  { immediate: true },
)
</script>

<template>
  <section class="shop-section">
    <div class="container">
      <h3 class="shop-title"><i class="pi pi-heart-fill"></i> Todos los productos</h3>

      <!-- Skeletons de carga -->
      <div v-if="cargando" class="productos-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card">
          <div class="skel skel-img"></div>
          <div class="skel skel-line" style="width: 65%"></div>
          <div class="skel skel-line" style="width: 45%"></div>
          <div class="skel skel-line" style="width: 30%"></div>
          <div class="skel skel-btn"></div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else-if="productos.length === 0" class="empty-state">
        <i class="pi pi-search" style="font-size: 2.5rem; color: #f48fb1"></i>
        <p>No hay productos disponibles.</p>
      </div>

      <!-- Grid de productos -->
      <div v-else class="productos-grid">
        <div v-for="producto in productos" :key="producto.id" class="product-card">
          <div class="img-wrapper">
            <img :src="producto.imagenUrl || '/assets/images/default.jpg'" :alt="producto.nombre" />
            <div class="overlay" @click="irADetalle(producto)">
              <i class="pi pi-eye"></i>
            </div>
          </div>

          <div class="info-box">
            <h5>{{ producto.nombre }}</h5>
            <p class="descripcion">{{ producto.descripcion }}</p>
            <p class="precio">Bs. {{ producto.precio }}</p>
            <button class="btn-carrito" @click="añadirAlCarrito(producto)">
              <i class="pi pi-shopping-cart"></i> Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal login con Teleport (sin PrimeVue Dialog) -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="mostrarModalLogin" class="modal-backdrop" @click.self="mostrarModalLogin = false">
        <div class="modal-box">
          <div class="modal-icon">
            <i class="pi pi-lock"></i>
          </div>
          <h4 class="modal-title">Inicia sesión para continuar</h4>
          <p class="modal-text">Debes iniciar sesión para agregar productos al carrito.</p>
          <div class="modal-actions">
            <button class="btn-outline" @click="mostrarModalLogin = false">Cerrar</button>
            <button class="btn-primary" @click="irALogin">Ir al login</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Sección principal ── */
.shop-section {
  padding: 2.5rem 0;
  background: #fff0f5;
  min-height: 100vh;
}

.shop-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #880e4f;
  margin-bottom: 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.shop-title i {
  color: #e91e8c;
}

/* ── Grid ── */
.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

/* ── Tarjeta ── */
.product-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #fce4ec;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.15);
}

/* Imagen */
.img-wrapper {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #fce4ec;
}
.img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.product-card:hover .img-wrapper img {
  transform: scale(1.04);
}
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(233, 30, 140, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  cursor: pointer;
}
.overlay i {
  font-size: 1.75rem;
  color: white;
}
.product-card:hover .overlay {
  opacity: 1;
}

/* Info */
.info-box {
  padding: 1rem 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.3rem;
}
.info-box h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #5d1049;
  margin: 0;
}
.descripcion {
  font-size: 0.85rem;
  color: #9e9e9e;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
}
.precio {
  font-size: 1.15rem;
  font-weight: 700;
  color: #e91e8c;
  margin: 0.25rem 0 0;
}

/* Botón carrito */
.btn-carrito {
  margin-top: auto;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: opacity 0.2s ease;
}
.btn-carrito:hover {
  opacity: 0.88;
}

/* ── Skeletons ── */
.skeleton-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #fce4ec;
  overflow: hidden;
  padding-bottom: 1rem;
}
.skel {
  background: linear-gradient(90deg, #fce4ec 25%, #f8bbd0 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skel-img {
  height: 180px;
}
.skel-line {
  height: 12px;
  border-radius: 6px;
  margin: 10px 1rem 0;
}
.skel-btn {
  height: 36px;
  border-radius: 50px;
  margin: 12px 1rem 0;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

/* ── Estado vacío ── */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #bdbdbd;
}
.empty-state p {
  margin-top: 0.75rem;
  font-size: 1rem;
}

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: white;
  border-radius: 20px;
  padding: 2rem 2rem 1.75rem;
  max-width: 380px;
  width: 90%;
  text-align: center;
  border: 1.5px solid #fce4ec;
}
.modal-icon {
  font-size: 2.5rem;
  color: #e91e8c;
  margin-bottom: 0.75rem;
}
.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #880e4f;
  margin: 0 0 0.5rem;
}
.modal-text {
  font-size: 0.9rem;
  color: #757575;
  margin: 0 0 1.5rem;
}
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}
.btn-outline {
  background: transparent;
  border: 1.5px solid #e91e8c;
  color: #e91e8c;
  border-radius: 50px;
  padding: 0.5rem 1.25rem;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-outline:hover {
  background: #fce4ec;
}
.btn-primary {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.5rem 1.25rem;
  font-size: 0.88rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-primary:hover {
  opacity: 0.88;
}

/* ── Transición del modal ── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
