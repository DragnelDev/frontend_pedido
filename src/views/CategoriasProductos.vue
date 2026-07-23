<script setup lang="ts">
import { ref, onMounted } from 'vue'
import http from '@/plugins/axios'
import type { Producto } from '@/models/producto'
import type { Categoria } from '@/models/categoria'
import { useRoute, useRouter } from 'vue-router'
import { usarCarrito } from '@/funciones/UsarCarrito'

const route = useRoute()
const router = useRouter()
const { agregarProducto } = usarCarrito()

const categorias = ref<Categoria[]>([])
const productos = ref<Producto[]>([])
const categoriaSeleccionada = ref<number | null>(null)
const cargando = ref(false)
const mostrarModalLogin = ref(false)

function estaLogueado(): boolean {
  return !!localStorage.getItem('token')
}

const obtenerCategorias = async () => {
  try {
    const res = await http.get('categorias')
    categorias.value = res.data
  } catch (err) {
    console.error('Error al cargar categorías:', err)
  }
}

const obtenerProductosPorCategoria = async (id: number) => {
  cargando.value = true
  try {
    const res = await http.get(`productos/categoria/${id}`)
    productos.value = res.data
    categoriaSeleccionada.value = id
  } catch (err) {
    console.error('Error al obtener productos:', err)
  } finally {
    cargando.value = false
  }
}

const seleccionarCategoria = (cat: Categoria) => {
  router.push({ name: 'categoria-productos', params: { id: cat.id } })
  obtenerProductosPorCategoria(cat.id)
}

const añadirAlCarrito = (producto: Producto) => {
  if (!estaLogueado()) { mostrarModalLogin.value = true; return }
  agregarProducto(producto, 1)
}

const irADetalle = (producto: Producto) => {
  router.push({ name: 'detalle-producto', params: { id: producto.id } })
}

const irALogin = () => {
  mostrarModalLogin.value = false
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

onMounted(async () => {
  await obtenerCategorias()
  const id = Number(route.params.id)
  if (id) obtenerProductosPorCategoria(id)
})
</script>

<template>
  <div class="catalogo-container">

    <!-- Sidebar de categorías -->
    <aside class="sidebar">
      <h5 class="titulo-sidebar">
        <i class="pi pi-list"></i> Categorías
      </h5>

      <ul class="lista-categorias">
        <li
          v-for="cat in categorias"
          :key="cat.id"
          :class="{ activa: cat.id === categoriaSeleccionada }"
          @click="seleccionarCategoria(cat)"
        >
          <i class="pi pi-tag"></i>
          {{ cat.nombre }}
        </li>
      </ul>
    </aside>

    <!-- Contenido principal -->
    <main class="contenido">

      <!-- Estado inicial: ninguna categoría seleccionada -->
      <div v-if="!categoriaSeleccionada" class="estado-inicial">
        <i class="pi pi-th-large"></i>
        <p>Selecciona una categoría para ver los productos</p>
      </div>

      <template v-else>
        <!-- Cabecera de categoría -->
        <div class="cat-header">
          <h3 class="titulo-categoria">
            {{ categorias.find(c => c.id === categoriaSeleccionada)?.nombre }}
          </h3>
          <span v-if="!cargando" class="badge-count">
            {{ productos.length }} producto{{ productos.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Skeletons -->
        <div v-if="cargando" class="grid-productos">
          <div v-for="n in 6" :key="n" class="skeleton-card">
            <div class="skel skel-img"></div>
            <div class="skel skel-line" style="width: 65%"></div>
            <div class="skel skel-line" style="width: 40%"></div>
            <div class="skel skel-line" style="width: 28%"></div>
            <div class="skel skel-btn"></div>
          </div>
        </div>

        <!-- Grid de productos -->
        <div v-else-if="productos.length > 0" class="grid-productos">
          <div
            v-for="producto in productos"
            :key="producto.id"
            class="card-producto"
          >
            <div class="imagen-wrapper" @click="irADetalle(producto)">
              <img
                :src="producto.imagenUrl || '/assets/images/default.jpg'"
                :alt="producto.nombre"
              />
              <div class="overlay">
                <i class="pi pi-eye"></i>
              </div>
            </div>

            <div class="info">
              <h5>{{ producto.nombre }}</h5>
              <p class="descripcion">{{ producto.descripcion }}</p>
              <span class="precio">Bs. {{ producto.precio }}</span>
              <button class="btn-agregar" @click="añadirAlCarrito(producto)">
                <i class="pi pi-shopping-cart"></i> Añadir al carrito
              </button>
            </div>
          </div>
        </div>

        <!-- Vacío -->
        <div v-else class="estado-vacio">
          <i class="pi pi-search"></i>
          <p>No hay productos en esta categoría.</p>
        </div>
      </template>

    </main>
  </div>

  <!-- Modal login con Teleport (sin PrimeVue) -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="mostrarModalLogin"
        class="modal-backdrop"
        @click.self="mostrarModalLogin = false"
      >
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
/* ── Contenedor principal ── */
.catalogo-container {
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  background: #fff5f8;
  min-height: 80vh;
  align-items: flex-start;
}

/* ── Sidebar ── */
.sidebar {
  width: 230px;
  flex-shrink: 0;
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid #fce4ec;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.07);
  position: sticky;
  top: 80px;
}

.titulo-sidebar {
  font-size: 0.95rem;
  font-weight: 700;
  color: #880e4f;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 6px;
}
.titulo-sidebar i { color: #e91e8c; }

.lista-categorias {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lista-categorias li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 4px;
  transition: background 0.15s, color 0.15s;
}
.lista-categorias li i { color: #f48fb1; font-size: 0.85rem; }
.lista-categorias li:hover { background: #fce4ec; color: #e91e8c; }
.lista-categorias li:hover i { color: #e91e8c; }
.lista-categorias li.activa {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 600;
}
.lista-categorias li.activa i { color: white; }

/* ── Contenido ── */
.contenido { flex: 1; min-width: 0; }

.cat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.25rem;
}
.titulo-categoria {
  font-size: 1.2rem;
  font-weight: 700;
  color: #880e4f;
  margin: 0;
}
.badge-count {
  font-size: 0.75rem;
  color: #e91e8c;
  background: #fce4ec;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ── Grid ── */
.grid-productos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.1rem;
}

/* ── Card ── */
.card-producto {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #fce4ec;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card-producto:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.15);
}

/* Imagen */
.imagen-wrapper {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #fce4ec;
  cursor: pointer;
}
.imagen-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.card-producto:hover .imagen-wrapper img { transform: scale(1.05); }
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(233, 30, 140, 0.35);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.25s ease;
}
.overlay i { font-size: 1.75rem; color: white; }
.imagen-wrapper:hover .overlay { opacity: 1; }

/* Info */
.info {
  padding: 0.9rem 1rem 1.1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
}
.info h5 { font-size: 0.95rem; font-weight: 600; color: #880e4f; margin: 0; }
.descripcion {
  font-size: 0.82rem;
  color: #bbb;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.precio { display: block; font-size: 1.05rem; font-weight: 700; color: #e91e8c; }
.btn-agregar {
  margin-top: auto;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 7px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: opacity 0.2s, transform 0.2s;
}
.btn-agregar:hover { opacity: 0.88; transform: translateY(-1px); }

/* ── Skeletons ── */
.skeleton-card {
  background: white;
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
.skel-img { height: 180px; }
.skel-line { height: 12px; border-radius: 6px; margin: 10px 1rem 0; }
.skel-btn { height: 34px; border-radius: 50px; margin: 12px 1rem 0; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ── Estados ── */
.estado-inicial,
.estado-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: #e8b4d0;
  gap: 12px;
  text-align: center;
}
.estado-inicial i,
.estado-vacio i { font-size: 3rem; }
.estado-inicial p,
.estado-vacio p { font-size: 0.95rem; margin: 0; color: #ccc; }

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
  padding: 2rem;
  max-width: 360px;
  width: 90%;
  border: 1.5px solid #fce4ec;
  text-align: center;
}
.modal-icon { font-size: 2.25rem; color: #e91e8c; margin-bottom: 10px; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #880e4f; margin: 0 0 6px; }
.modal-text { font-size: 0.875rem; color: #888; margin: 0 0 1.5rem; }
.modal-actions { display: flex; gap: 10px; justify-content: center; }
.btn-outline {
  background: transparent;
  border: 1.5px solid #e91e8c;
  color: #e91e8c;
  border-radius: 50px;
  padding: 8px 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-outline:hover { background: #fce4ec; }
.btn-primary {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 8px 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.88; }

/* ── Transición modal ── */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .catalogo-container { flex-direction: column; padding: 1rem; }
  .sidebar { width: 100%; position: static; }
  .lista-categorias { display: flex; flex-wrap: wrap; gap: 6px; }
  .lista-categorias li { margin-bottom: 0; }
}
</style>
