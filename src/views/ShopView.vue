<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productoService } from '@/servicios/productoService'
import { usarCarrito } from '@/funciones/UsarCarrito'
import type { Producto } from '@/models/producto'

const route  = useRoute()
const router = useRouter()
const { agregarProducto } = usarCarrito()

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const productos  = ref<Producto[]>([])
const loading    = ref(false)
const error      = ref<string | null>(null)
const busqueda   = ref('')
const agregados  = ref<Set<number>>(new Set())   // feedback visual por producto

// ─────────────────────────────────────────────────────────────────────────────
// Carga
// ─────────────────────────────────────────────────────────────────────────────
onMounted(cargarProductos)

async function cargarProductos() {
  loading.value = true
  error.value   = null
  try {
    productos.value = await productoService.obtenerProductos()
  } catch (err) {
    error.value = 'No se pudieron cargar los productos. Intenta de nuevo.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Categorías
// ─────────────────────────────────────────────────────────────────────────────
const categorias = computed(() => {
  const set = new Set<string>()
  for (const p of productos.value) {
    if (p.categoria?.nombre) set.add(p.categoria.nombre)
  }
  return Array.from(set).sort()
})

const categoriaActiva = computed(() => (route.query.category as string) || '')

function seleccionarCategoria(nombre: string) {
  router.push({ name: 'shop', query: { category: nombre } })
  busqueda.value = ''
}

function limpiarCategoria() {
  router.push({ name: 'shop', query: {} })
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtrado
// ─────────────────────────────────────────────────────────────────────────────
const visibleProductos = computed(() => {
  let arr = [...productos.value]

  if (categoriaActiva.value) {
    arr = arr.filter(
      p => p.categoria?.nombre?.toLowerCase() === categoriaActiva.value.toLowerCase()
    )
  }

  const q = busqueda.value.trim().toLowerCase()
  if (q) {
    arr = arr.filter(
      p => p.nombre.toLowerCase().includes(q) ||
           p.descripcion?.toLowerCase().includes(q) ||
           p.categoria?.nombre?.toLowerCase().includes(q)
    )
  }

  return arr
})

// ─────────────────────────────────────────────────────────────────────────────
// Carrito
// ─────────────────────────────────────────────────────────────────────────────
function estaLogueado(): boolean {
  return !!localStorage.getItem('token')
}

const mostrarLoginModal = ref(false)

function añadirAlCarrito(p: Producto) {
  if (!estaLogueado()) {
    mostrarLoginModal.value = true
    return
  }
  agregarProducto(p, 1)
  agregados.value = new Set(agregados.value).add(p.id)
  setTimeout(() => {
    const s = new Set(agregados.value)
    s.delete(p.id)
    agregados.value = s
  }, 1800)
}

function irALogin() {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

function fmtBs(n?: number): string {
  return (Number(n) || 0).toFixed(2)
}
</script>

<template>
  <section class="shop-page">

    <!-- ── Hero strip ────────────────────────────────────────────────────── -->
    <div class="shop-hero">
      <span class="section-tag">Nuestra pastelería</span>
      <h1 class="shop-titulo">Dulces para cada momento</h1>
      <p class="shop-sub">Hecho con amor, entregado con cariño 🍓</p>
    </div>

    <div class="shop-container">

      <!-- ── Buscador ──────────────────────────────────────────────────── -->
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          v-model="busqueda"
          type="search"
          class="search-input"
          placeholder="Buscar tortas, cupcakes, macarons..."
        />
        <button v-if="busqueda" class="btn-clear-search" @click="busqueda = ''">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- ── Filtros de categoría ──────────────────────────────────────── -->
      <div v-if="categorias.length" class="categorias-strip">
        <button
          class="cat-chip"
          :class="{ activo: !categoriaActiva }"
          @click="limpiarCategoria"
        >
          Todos
          <span class="cat-count">{{ productos.length }}</span>
        </button>
        <button
          v-for="cat in categorias"
          :key="cat"
          class="cat-chip"
          :class="{ activo: categoriaActiva === cat }"
          @click="seleccionarCategoria(cat)"
        >
          {{ cat }}
          <span class="cat-count">
            {{ productos.filter(p => p.categoria?.nombre === cat).length }}
          </span>
        </button>
      </div>

      <!-- ── Cabecera de resultados ────────────────────────────────────── -->
      <div class="resultados-bar">
        <span class="resultados-count">
          {{ visibleProductos.length }}
          {{ visibleProductos.length === 1 ? 'producto' : 'productos' }}
          <template v-if="categoriaActiva"> en <strong>{{ categoriaActiva }}</strong></template>
          <template v-else-if="busqueda"> para "<strong>{{ busqueda }}</strong>"</template>
        </span>
        <button
          v-if="categoriaActiva || busqueda"
          class="btn-limpiar"
          @click="limpiarCategoria(); busqueda = ''"
        >
          <i class="pi pi-times"></i> Limpiar filtros
        </button>
      </div>

      <!-- ── Loading ──────────────────────────────────────────────────── -->
      <div v-if="loading" class="loading-grid">
        <div v-for="n in 8" :key="n" class="skeleton-card">
          <div class="sk-img"></div>
          <div class="sk-body">
            <div class="sk-line sk-lg"></div>
            <div class="sk-line sk-sm"></div>
            <div class="sk-line sk-md"></div>
          </div>
        </div>
      </div>

      <!-- ── Error ────────────────────────────────────────────────────── -->
      <div v-else-if="error" class="error-banner">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button class="btn-retry" @click="cargarProductos">
          <i class="pi pi-refresh"></i> Reintentar
        </button>
      </div>

      <!-- ── Grid de productos ─────────────────────────────────────────── -->
      <div v-else-if="visibleProductos.length" class="productos-grid">
        <div
          v-for="p in visibleProductos"
          :key="p.id"
          class="producto-card"
          @click="$router.push(`/productos/${p.id}`)"
        >
          <!-- Imagen -->
          <div class="card-img-wrap">
            <img
              :src="p.imagenUrl || '/assets/images/default.jpg'"
              :alt="p.nombre"
              class="card-img"
            />
            <!-- Badge categoría -->
            <span v-if="p.categoria?.nombre" class="cat-badge">
              {{ p.categoria.nombre }}
            </span>
            <!-- Badge sin stock -->
            <span v-if="(p.stock ?? 0) === 0" class="sin-stock-badge">Sin stock</span>
          </div>

          <!-- Info -->
          <div class="card-body">
            <h3 class="card-nombre">{{ p.nombre }}</h3>
            <p v-if="p.descripcion" class="card-desc">{{ p.descripcion }}</p>

            <!-- Chips de detalle -->
            <div class="card-chips">
              <span v-if="p.porciones" class="chip">
                <i class="pi pi-chart-pie"></i> {{ p.porciones }} porc.
              </span>
              <span v-if="p.tiempoPreparacion" class="chip">
                <i class="pi pi-clock"></i> {{ p.tiempoPreparacion }}min
              </span>
            </div>
          </div>

          <!-- Footer -->
          <div class="card-footer" @click.stop>
            <span class="card-precio">Bs. {{ fmtBs(p.precio) }}</span>
            <button
              class="btn-agregar"
              :class="{
                agregado:   agregados.has(p.id),
                'sin-stock': (p.stock ?? 0) === 0
              }"
              :disabled="(p.stock ?? 0) === 0"
              @click.stop="añadirAlCarrito(p)"
            >
              <Transition name="icon-swap" mode="out-in">
                <i v-if="agregados.has(p.id)" key="ok"  class="pi pi-check"></i>
                <i v-else                     key="add" class="pi pi-shopping-cart"></i>
              </Transition>
              <span>{{ agregados.has(p.id) ? '¡Listo!' : (p.stock ?? 0) === 0 ? 'Agotado' : 'Añadir' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Sin resultados ────────────────────────────────────────────── -->
      <div v-else class="vacio">
        <span class="vacio-icon">🧁</span>
        <h4>No hay productos aquí</h4>
        <p>
          <template v-if="categoriaActiva || busqueda">
            Prueba con otro filtro o búsqueda.
          </template>
          <template v-else>
            Pronto tendremos nuevas delicias disponibles.
          </template>
        </p>
        <button
          v-if="categoriaActiva || busqueda"
          class="btn-reset"
          @click="limpiarCategoria(); busqueda = ''"
        >
          Ver todos los productos
        </button>
      </div>

    </div>

    <!-- ── Modal login ────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="mostrarLoginModal" class="modal-overlay" @click.self="mostrarLoginModal = false">
          <div class="modal-login">
            <div class="modal-icon">🔐</div>
            <h3>Inicia sesión para continuar</h3>
            <p>Necesitas una cuenta para agregar productos al carrito y realizar pedidos.</p>
            <div class="modal-acciones">
              <button class="btn-cancelar" @click="mostrarLoginModal = false">Cancelar</button>
              <button class="btn-ir-login" @click="irALogin">
                <i class="pi pi-sign-in"></i> Ir al login
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </section>
</template>

<style scoped>
/* ── Base ───────────────────────────────────────────────────────────────────── */
.shop-page {
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 45%, #fff 100%);
  min-height: 100vh;
  padding-bottom: 4rem;
}

/* ── Hero ───────────────────────────────────────────────────────────────────── */
.shop-hero {
  text-align: center;
  padding: 3rem 1rem 1.75rem;
  background: linear-gradient(135deg, #fff0f7, #fce4ec);
  border-bottom: 1px solid #f8bbd0;
}

.section-tag {
  display: inline-block;
  background: white;
  color: #e91e8c;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 0.28rem 0.9rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  margin-bottom: 0.6rem;
}

.shop-titulo {
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.4rem;
  line-height: 1.15;
}

.shop-sub { font-size: 0.95rem; color: #f48fb1; margin: 0; }

/* ── Contenedor ─────────────────────────────────────────────────────────────── */
.shop-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.75rem 1rem 0;
}

/* ── Buscador ───────────────────────────────────────────────────────────────── */
.search-wrap {
  position: relative;
  max-width: 560px;
  margin: 0 auto 1.5rem;
}

.search-icon {
  position: absolute;
  left: 1.1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.8rem 3rem 0.8rem 2.75rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  box-shadow: 0 2px 12px rgba(233,30,140,0.07);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.search-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233,30,140,0.09), 0 2px 12px rgba(233,30,140,0.07);
}

.btn-clear-search {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  background: #fce4ec;
  border: none;
  border-radius: 50%;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  color: #c2185b;
  font-size: 0.72rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-clear-search:hover { background: #f8bbd0; }

/* ── Filtros de categoría ───────────────────────────────────────────────────── */
.categorias-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
  scrollbar-width: none;
}

.categorias-strip::-webkit-scrollbar { display: none; }

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #888;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
  flex-shrink: 0;
}

.cat-chip:hover { border-color: #f48fb1; color: #c2185b; background: #fff9fb; }

.cat-chip.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: white;
  box-shadow: 0 4px 12px rgba(233,30,140,0.25);
}

.cat-count {
  font-size: 0.66rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 50px;
}

.cat-chip:not(.activo) .cat-count { background: #fce4ec; color: #e91e8c; }
.cat-chip.activo .cat-count        { background: rgba(255,255,255,0.25); color: white; }

/* ── Resultados bar ─────────────────────────────────────────────────────────── */
.resultados-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resultados-count { font-size: 0.82rem; color: #bbb; }
.resultados-count strong { color: #c2185b; }

.btn-limpiar {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.85rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-limpiar:hover { background: #f8bbd0; }

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.skeleton-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #fce4ec;
}

.sk-img {
  height: 190px;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.sk-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }

.sk-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #fce4ec 25%, #fff9fb 50%, #fce4ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.sk-lg { width: 75%; }
.sk-md { width: 55%; }
.sk-sm { width: 40%; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Error ──────────────────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffebee;
  color: #c62828;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border-left: 4px solid #e53935;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-retry {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.85rem;
  background: white;
  border: 1.5px solid #ef9a9a;
  border-radius: 50px;
  color: #c62828;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover { background: #ffcdd2; }

/* ── Grid ───────────────────────────────────────────────────────────────────── */
.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

/* ── Producto card ──────────────────────────────────────────────────────────── */
.producto-card {
  background: white;
  border-radius: 20px;
  border: 1.5px solid #fce4ec;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(233,30,140,0.06);
}

.producto-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(233,30,140,0.15);
  border-color: #f48fb1;
}

/* Imagen */
.card-img-wrap {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.card-img {
  width: 100%;
  height: 190px;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}

.producto-card:hover .card-img { transform: scale(1.05); }

.cat-badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  background: rgba(255,255,255,0.9);
  color: #e91e8c;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 50px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(233,30,140,0.15);
}

.sin-stock-badge {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: rgba(198,40,40,0.85);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 50px;
}

/* Body */
.card-body {
  padding: 0.9rem 1rem 0.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.card-nombre {
  font-size: 0.95rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: 0.78rem;
  color: #aaa;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.card-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.1rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #fff9fb;
  border: 1px solid #fce4ec;
  color: #c2185b;
  font-size: 0.66rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 50px;
}

.chip i { font-size: 0.62rem; }

/* Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-top: 1px solid #fce4ec;
  margin-top: auto;
}

.card-precio {
  font-size: 1rem;
  font-weight: 800;
  color: #e91e8c;
}

.btn-agregar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  box-shadow: 0 3px 10px rgba(233,30,140,0.25);
  white-space: nowrap;
}

.btn-agregar:hover:not(:disabled):not(.sin-stock) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(233,30,140,0.35);
}

.btn-agregar.agregado {
  background: linear-gradient(135deg, #2e7d32, #43a047);
  box-shadow: 0 3px 10px rgba(46,125,50,0.25);
}

.btn-agregar.sin-stock {
  background: #e0e0e0;
  color: #aaa;
  box-shadow: none;
  cursor: not-allowed;
}

/* ── Vacío ──────────────────────────────────────────────────────────────────── */
.vacio {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #fce4ec;
  box-shadow: 0 4px 16px rgba(233,30,140,0.07);
}

.vacio-icon { font-size: 3.5rem; opacity: 0.3; display: block; margin-bottom: 1rem; }
.vacio h4   { font-weight: 800; color: #880e4f; margin-bottom: 0.4rem; }
.vacio p    { color: #aaa; margin-bottom: 1.25rem; font-size: 0.875rem; }

.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233,30,140,0.3);
  transition: opacity 0.2s;
}

.btn-reset:hover { opacity: 0.9; }

/* ── Modal Login ────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136,14,79,0.4);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-login {
  background: white;
  border-radius: 24px;
  padding: 2.25rem 2rem;
  width: 100%;
  max-width: 370px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(136,14,79,0.22);
}

.modal-icon { font-size: 2.75rem; margin-bottom: 0.75rem; display: block; }

.modal-login h3 { font-size: 1.1rem; font-weight: 800; color: #880e4f; margin: 0 0 0.6rem; }
.modal-login p  { font-size: 0.875rem; color: #888; line-height: 1.5; margin: 0 0 1.5rem; }

.modal-acciones { display: flex; justify-content: center; gap: 0.75rem; }

.btn-cancelar {
  padding: 0.65rem 1.3rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancelar:hover { background: #f5f5f5; }

.btn-ir-login {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.4rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233,30,140,0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-ir-login:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Transiciones ───────────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.22s ease; }
.modal-fade-enter-from,  .modal-fade-leave-to      { opacity: 0; }

.icon-swap-enter-active, .icon-swap-leave-active { transition: opacity 0.15s ease; }
.icon-swap-enter-from,  .icon-swap-leave-to      { opacity: 0; }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .productos-grid { grid-template-columns: repeat(2, 1fr); gap: 0.85rem; }
  .card-img       { height: 150px; }
  .shop-hero      { padding: 2rem 1rem 1.25rem; }
}

@media (max-width: 380px) {
  .productos-grid { grid-template-columns: 1fr; }
}
</style>
