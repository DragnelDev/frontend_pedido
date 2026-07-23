<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/plugins/axios'
import type { Producto } from '@/models/producto'
import { usarCarrito } from '@/funciones/UsarCarrito'

const route  = useRoute()
const router = useRouter()
const { agregarProducto } = usarCarrito()

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const producto    = ref<Producto | null>(null)
const relacionados = ref<Producto[]>([])
const cantidad    = ref(1)
const cargando    = ref(true)
const agregado    = ref(false)         // feedback visual al agregar
const mostrarModalLogin = ref(false)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function estaLogueado(): boolean {
  return !!localStorage.getItem('token')
}

function fmtBs(n?: number): string {
  return (Number(n) || 0).toFixed(2)
}

const stockDisponible = computed(() => (producto.value?.stock ?? 0) > 0)

const stockClase = computed(() => {
  const s = producto.value?.stock ?? 0
  if (s === 0)  return 'sin-stock'
  if (s <= 5)   return 'stock-bajo'
  return 'stock-ok'
})

// ─────────────────────────────────────────────────────────────────────────────
// Carga de datos
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerProducto() {
  cargando.value = true
  cantidad.value = 1
  agregado.value = false
  try {
    const { data } = await http.get(`productos/${route.params.id}`)
    producto.value = data

    if (data?.idCategoria) {
      const rel = await http.get(`productos/categoria/${data.idCategoria}`)
      relacionados.value = (rel.data as Producto[]).filter(p => p.id !== data.id).slice(0, 8)
    } else {
      relacionados.value = []
    }
  } catch (err) {
    console.error('Error al obtener producto:', err)
  } finally {
    cargando.value = false
  }
}

onMounted(obtenerProducto)
watch(() => route.params.id, obtenerProducto)

// ─────────────────────────────────────────────────────────────────────────────
// Acciones
// ─────────────────────────────────────────────────────────────────────────────
function aumentar() {
  const max = producto.value?.stock ?? 99
  if (cantidad.value < max) cantidad.value++
}

function disminuir() {
  if (cantidad.value > 1) cantidad.value--
}

function añadirAlCarrito() {
  if (!estaLogueado()) { mostrarModalLogin.value = true; return }
  if (!producto.value) return
  agregarProducto(producto.value, cantidad.value)
  agregado.value = true
  setTimeout(() => (agregado.value = false), 2000)
}

function irALogin() {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

function verRelacionado(id: number) {
  router.push(`/productos/${id}`)
}
</script>

<template>
  <!-- ── Cargando ─────────────────────────────────────────────────────────── -->
  <div v-if="cargando" class="loading-wrap">
    <div class="loading-spinner"></div>
    <p>Cargando producto...</p>
  </div>

  <!-- ── Detalle ──────────────────────────────────────────────────────────── -->
  <section v-else-if="producto" class="detalle-page">
    <div class="detalle-container">

      <!-- Breadcrumb -->
      <nav class="breadcrumb-nav">
        <button class="crumb-link" @click="router.push('/')">Inicio</button>
        <i class="pi pi-chevron-right crumb-sep"></i>
        <button class="crumb-link" @click="router.push('/productos')">Productos</button>
        <i class="pi pi-chevron-right crumb-sep"></i>
        <span class="crumb-actual">{{ producto.nombre }}</span>
      </nav>

      <!-- Layout principal -->
      <div class="detalle-layout">

        <!-- ── Imagen ──────────────────────────────────────────────────── -->
        <div class="imagen-col">
          <div class="imagen-card">
            <img
              :src="producto.imagenUrl || '/assets/images/default.jpg'"
              :alt="producto.nombre"
              class="producto-img"
            />
            <!-- Badge categoría -->
            <div v-if="producto.categoria?.nombre" class="categoria-badge">
              {{ producto.categoria.nombre }}
            </div>
          </div>

          <!-- Chips de info rápida -->
          <div class="info-chips">
            <div v-if="producto.porciones" class="info-chip">
              <i class="pi pi-chart-pie"></i>
              <span>{{ producto.porciones }} porciones</span>
            </div>
            <div v-if="producto.tiempoPreparacion" class="info-chip">
              <i class="pi pi-clock"></i>
              <span>{{ producto.tiempoPreparacion }} min</span>
            </div>
            <div class="info-chip" :class="stockClase">
              <i class="pi pi-box"></i>
              <span>
                {{ producto.stock === 0
                    ? 'Sin stock'
                    : producto.stock <= 5
                      ? `¡Solo ${producto.stock} disponibles!`
                      : `${producto.stock} en stock` }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Info ───────────────────────────────────────────────────── -->
        <div class="info-col">

          <!-- Código -->
          <span class="producto-codigo">PROD-{{ String(producto.id).padStart(4, '0') }}</span>

          <!-- Nombre -->
          <h1 class="producto-nombre">{{ producto.nombre }}</h1>

          <!-- Precio -->
          <div class="precio-wrap">
            <span class="precio-label">Precio</span>
            <span class="precio-monto">Bs. {{ fmtBs(producto.precio) }}</span>
          </div>

          <!-- Descripción -->
          <div class="descripcion-wrap">
            <h4 class="descripcion-titulo">Descripción</h4>
            <p class="descripcion-texto">
              {{ producto.descripcion || 'Sin descripción disponible.' }}
            </p>
          </div>

          <!-- Selector de cantidad -->
          <div class="cantidad-wrap">
            <span class="cantidad-label">Cantidad</span>
            <div class="cantidad-ctrl">
              <button
                class="qty-btn"
                @click="disminuir"
                :disabled="cantidad <= 1"
              >−</button>
              <span class="qty-valor">{{ cantidad }}</span>
              <button
                class="qty-btn"
                @click="aumentar"
                :disabled="cantidad >= (producto.stock ?? 99)"
              >+</button>
            </div>
            <span class="cantidad-sub">
              Subtotal: <strong>Bs. {{ fmtBs(producto.precio * cantidad) }}</strong>
            </span>
          </div>

          <!-- Botón agregar -->
          <button
            class="btn-agregar"
            :class="{ agregado, 'sin-stock': !stockDisponible }"
            @click="añadirAlCarrito"
            :disabled="!stockDisponible"
          >
            <Transition name="btn-swap" mode="out-in">
              <span v-if="agregado" key="ok" class="btn-inner">
                <i class="pi pi-check"></i> ¡Agregado al carrito!
              </span>
              <span v-else key="add" class="btn-inner">
                <i class="pi pi-shopping-cart"></i>
                {{ stockDisponible ? 'Agregar al carrito' : 'Sin stock disponible' }}
              </span>
            </Transition>
          </button>

          <!-- Link volver -->
          <button class="btn-volver" @click="router.push('/productos')">
            <i class="pi pi-arrow-left"></i> Ver más productos
          </button>

        </div>
      </div>

      <!-- ── Relacionados ──────────────────────────────────────────────── -->
      <div v-if="relacionados.length" class="relacionados-seccion">
        <div class="relacionados-header">
          <span class="section-tag">También te puede gustar</span>
          <h3 class="relacionados-titulo">Productos relacionados</h3>
        </div>

        <div class="relacionados-grid">
          <div
            v-for="rel in relacionados"
            :key="rel.id"
            class="rel-card"
            @click="verRelacionado(rel.id)"
          >
            <div class="rel-img-wrap">
              <img
                :src="rel.imagenUrl || '/assets/images/default.jpg'"
                :alt="rel.nombre"
                class="rel-img"
              />
            </div>
            <div class="rel-info">
              <p class="rel-nombre">{{ rel.nombre }}</p>
              <p class="rel-precio">Bs. {{ fmtBs(rel.precio) }}</p>
              <span class="rel-btn">Ver detalle →</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ── 404 ──────────────────────────────────────────────────────────────── -->
  <div v-else class="not-found">
    <span class="not-found-icon">🍰</span>
    <h3>Producto no encontrado</h3>
    <button class="btn-volver" @click="router.push('/productos')">
      Volver a productos
    </button>
  </div>

  <!-- ── Modal Login ───────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="mostrarModalLogin" class="modal-overlay" @click.self="mostrarModalLogin = false">
        <div class="modal-login">
          <div class="modal-login-icon">🔐</div>
          <h3>Inicia sesión para continuar</h3>
          <p>Debes tener una cuenta para agregar productos al carrito y realizar pedidos.</p>
          <div class="modal-login-actions">
            <button class="btn-cancel-modal" @click="mostrarModalLogin = false">
              Cancelar
            </button>
            <button class="btn-ir-login" @click="irALogin">
              <i class="pi pi-sign-in"></i> Ir al login
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Loading ────────────────────────────────────────────────────────────────── */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 5rem 1rem;
  color: #f48fb1;
  font-size: 0.9rem;
}

.loading-spinner {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 3px solid #fce4ec;
  border-top-color: #e91e8c;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Página ─────────────────────────────────────────────────────────────────── */
.detalle-page {
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 40%, #fff 100%);
  min-height: 80vh;
  padding: 2rem 1rem 4rem;
}

.detalle-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* ── Breadcrumb ─────────────────────────────────────────────────────────────── */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.75rem;
  font-size: 0.8rem;
}

.crumb-link {
  background: none;
  border: none;
  color: #f48fb1;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.crumb-link:hover { color: #e91e8c; }

.crumb-sep { color: #f8bbd0; font-size: 0.7rem; }

.crumb-actual { color: #880e4f; font-weight: 700; }

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.detalle-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  align-items: start;
  margin-bottom: 3rem;
}

/* ── Imagen col ─────────────────────────────────────────────────────────────── */
.imagen-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  border: 1.5px solid #fce4ec;
  box-shadow: 0 8px 32px rgba(233, 30, 140, 0.12);
  background: white;
}

.producto-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
}

.categoria-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.85rem;
  border-radius: 50px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 3px 10px rgba(233, 30, 140, 0.3);
}

/* Chips */
.info-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.info-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: 50px;
  background: white;
  border: 1.5px solid #fce4ec;
  font-size: 0.78rem;
  font-weight: 600;
  color: #880e4f;
}

.info-chip i { color: #f48fb1; font-size: 0.78rem; }

.info-chip.stock-ok   { border-color: #c8e6c9; color: #2e7d32; }
.info-chip.stock-ok i { color: #66bb6a; }

.info-chip.stock-bajo   { border-color: #ffe0b2; color: #e65100; }
.info-chip.stock-bajo i { color: #ffa726; }

.info-chip.sin-stock   { border-color: #ffcdd2; color: #c62828; }
.info-chip.sin-stock i { color: #ef5350; }

/* ── Info col ───────────────────────────────────────────────────────────────── */
.info-col { display: flex; flex-direction: column; gap: 1.25rem; }

.producto-codigo {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #f48fb1;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.producto-nombre {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0;
  line-height: 1.2;
}

.precio-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  background: linear-gradient(135deg, #fce4ec, #fff9fb);
  border: 1.5px solid #f8bbd0;
  border-radius: 16px;
  padding: 0.85rem 1.25rem;
}

.precio-label { font-size: 0.78rem; font-weight: 600; color: #f48fb1; }

.precio-monto {
  font-size: 2rem;
  font-weight: 800;
  color: #e91e8c;
  line-height: 1;
}

/* Descripción */
.descripcion-wrap { display: flex; flex-direction: column; gap: 0.4rem; }

.descripcion-titulo {
  font-size: 0.85rem;
  font-weight: 700;
  color: #880e4f;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.descripcion-texto {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* Cantidad */
.cantidad-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border: 1.5px solid #fce4ec;
  border-radius: 14px;
}

.cantidad-label { font-size: 0.78rem; font-weight: 700; color: #880e4f; }

.cantidad-ctrl {
  display: flex;
  align-items: center;
  gap: 0;
  width: fit-content;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  overflow: hidden;
}

.qty-btn {
  width: 38px; height: 38px;
  border: none;
  background: #fce4ec;
  color: #c2185b;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s;
  display: flex; align-items: center; justify-content: center;
}

.qty-btn:hover:not(:disabled) { background: #f8bbd0; }
.qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.qty-valor {
  min-width: 44px;
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  color: #880e4f;
  background: white;
  padding: 0 0.5rem;
  line-height: 38px;
}

.cantidad-sub { font-size: 0.8rem; color: #aaa; }
.cantidad-sub strong { color: #e91e8c; }

/* Botón agregar */
.btn-agregar {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  box-shadow: 0 6px 24px rgba(233, 30, 140, 0.35);
  transition: opacity 0.2s, transform 0.2s, background 0.3s;
  overflow: hidden;
}

.btn-agregar:hover:not(:disabled):not(.sin-stock) {
  opacity: 0.92;
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.4);
}

.btn-agregar.agregado {
  background: linear-gradient(135deg, #2e7d32, #43a047);
  box-shadow: 0 6px 20px rgba(46, 125, 50, 0.35);
}

.btn-agregar.sin-stock {
  background: #e0e0e0;
  color: #aaa;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Volver */
.btn-volver {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: #f48fb1;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.btn-volver:hover { color: #e91e8c; }

/* ── Relacionados ───────────────────────────────────────────────────────────── */
.relacionados-seccion { margin-top: 1rem; }

.relacionados-header { margin-bottom: 1.5rem; }

.section-tag {
  display: inline-block;
  background: #fce4ec;
  color: #e91e8c;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 0.28rem 0.9rem;
  border-radius: 50px;
  margin-bottom: 0.5rem;
}

.relacionados-titulo {
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0;
}

.relacionados-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.rel-card {
  background: white;
  border-radius: 18px;
  border: 1.5px solid #fce4ec;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.22s;
  box-shadow: 0 2px 10px rgba(233, 30, 140, 0.06);
}

.rel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.15);
  border-color: #f48fb1;
}

.rel-img-wrap { width: 100%; height: 130px; overflow: hidden; }

.rel-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.rel-card:hover .rel-img { transform: scale(1.06); }

.rel-info { padding: 0.75rem; }

.rel-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.82rem;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rel-precio {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.875rem;
  margin: 0 0 0.4rem;
}

.rel-btn {
  font-size: 0.72rem;
  font-weight: 700;
  color: #f48fb1;
  display: block;
}

/* ── Not found ──────────────────────────────────────────────────────────────── */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 1rem;
  text-align: center;
}

.not-found-icon { font-size: 3rem; opacity: 0.3; }
.not-found h3   { color: #880e4f; font-weight: 800; margin: 0; }

/* ── Modal Login ────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.4);
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
  padding: 2.25rem;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(136, 14, 79, 0.22);
}

.modal-login-icon { font-size: 2.75rem; margin-bottom: 0.75rem; }

.modal-login h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.65rem;
}

.modal-login p {
  font-size: 0.875rem;
  color: #888;
  line-height: 1.5;
  margin: 0 0 1.5rem;
}

.modal-login-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn-cancel-modal {
  padding: 0.65rem 1.4rem;
  border: 1.5px solid #e0e0e0;
  border-radius: 50px;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel-modal:hover { background: #f5f5f5; }

.btn-ir-login {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-ir-login:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Transiciones ───────────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.22s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.btn-swap-enter-active, .btn-swap-leave-active { transition: opacity 0.18s ease; }
.btn-swap-enter-from, .btn-swap-leave-to { opacity: 0; }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .detalle-layout  { grid-template-columns: 1fr; gap: 1.5rem; }
  .relacionados-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}

@media (max-width: 480px) {
  .detalle-page { padding: 1.25rem 0.75rem 3rem; }
  .precio-monto { font-size: 1.6rem; }
}
</style>
