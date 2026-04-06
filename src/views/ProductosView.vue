<script setup lang="ts">
import { ref, watch } from 'vue'
import http from '@/plugins/axios'
import { useRouter, useRoute } from 'vue-router'
import { usarCarrito } from '@/funciones/UsarCarrito'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import type { Producto } from '@/models/producto'

const router = useRouter()
const route = useRoute()
const productos = ref<Producto[]>([])
const cargando = ref(false)
const { agregarProducto } = usarCarrito()

const mostrarModalLogin = ref(false)

function estaLogueado(): boolean {
  return !!localStorage.getItem('token')
}

const añadirAlCarrito = (producto: Producto) => {
  if (!estaLogueado()) { mostrarModalLogin.value = true; return }
  agregarProducto(producto, 1)
}

const irADetalle = (producto: Producto) => {
  router.push({ name: 'detalle-producto', params: { id: producto.id } })
}

const irALogin = () => {
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
  (newQ) => { cargarProductos((newQ as string) || '') },
  { immediate: true },
)
</script>

<template>
  <section class="productos-page">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <span class="section-tag">🍰 Catálogo</span>
          <h2 class="page-titulo">Todos los productos</h2>
        </div>
        <p class="page-sub" v-if="!cargando && productos.length > 0">
          {{ productos.length }} productos disponibles
        </p>
      </div>

      <!-- Cargando -->
      <div v-if="cargando" class="estado-mensaje">
        <div class="spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <p>Cargando productos...</p>
      </div>

      <!-- Vacío -->
      <div v-else-if="productos.length === 0" class="estado-mensaje">
        <div class="empty-icon">🍩</div>
        <p>No hay productos disponibles.</p>
        <small>Vuelve pronto, ¡estamos horneando algo delicioso!</small>
      </div>

      <!-- Grid de productos -->
      <div v-else class="productos-grid">
        <div
          v-for="producto in productos"
          :key="producto.id"
          class="producto-card"
        >
          <div class="imagen-wrapper">
            <img
              :src="producto.imagenUrl || '/assets/images/default.jpg'"
              :alt="producto.nombre"
            />
            <div class="overlay" @click="irADetalle(producto)">
              <i class="bi bi-eye-fill"></i>
              <span>Ver detalle</span>
            </div>
          </div>

          <div class="info-box">
            <h5 class="producto-nombre">{{ producto.nombre }}</h5>
            <p class="descripcion">{{ producto.descripcion }}</p>
            <div class="precio-row">
              <span class="precio">Bs. {{ producto.precio }}</span>
            </div>
            <button class="btn-carrito" @click="añadirAlCarrito(producto)">
              🛒 Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal login -->
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
.productos-page {
  background: linear-gradient(180deg, #fff9fb 0%, #fce4ec 100%);
  padding: 3rem 1rem;
  min-height: 80vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 0.5rem;
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
  margin-bottom: 0.5rem;
}

.page-titulo {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0;
}

.page-sub {
  font-size: 0.875rem;
  color: #f48fb1;
  font-weight: 600;
  margin: 0;
}

/* Estados */
.estado-mensaje {
  text-align: center;
  padding: 4rem 1rem;
  color: #c2185b;
}

.spinner {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #f48fb1;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.estado-mensaje p {
  font-weight: 600;
  font-size: 1.05rem;
  margin-bottom: 0.3rem;
}

.estado-mensaje small {
  color: #f48fb1;
  font-size: 0.875rem;
}

/* Grid */
.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

/* Tarjeta */
.producto-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #fce4ec;
}

.producto-card:hover {
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

.producto-card:hover .imagen-wrapper img {
  transform: scale(1.06);
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(194, 24, 91, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.overlay i {
  font-size: 1.8rem;
}

.producto-card:hover .overlay {
  opacity: 1;
}

.info-box {
  padding: 1.25rem;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.producto-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 1rem;
  margin-bottom: 0.4rem;
}

.descripcion {
  font-size: 0.85rem;
  color: #999;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.precio-row {
  margin-bottom: 0.85rem;
}

.precio {
  font-weight: 800;
  color: #e91e8c;
  font-size: 1.15rem;
}

.btn-carrito {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f48fb1);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.65rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}

.btn-carrito:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
</style>
