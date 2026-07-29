<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { usarCarrito } from '@/funciones/UsarCarrito'
import http from '@/plugins/axios'
import type { Producto } from '@/models/producto'

const router = useRouter()
const { agregarProducto } = usarCarrito()

const productos = ref<Producto[]>([])
const cargando = ref(false)
const mostrarModalLogin = ref(false)

function estaLogueado(): boolean {
  return !!localStorage.getItem('token')
}

const obtenerProductosDestacados = async () => {
  cargando.value = true
  try {
    const res = await http.get('productos')
    productos.value = res.data.slice(0, 3)
  } catch (err) {
    console.error('Error al cargar productos destacados:', err)
  } finally {
    cargando.value = false
  }
}

const onAddToCart = (producto: Producto) => {
  if (!estaLogueado()) {
    mostrarModalLogin.value = true
    return
  }
  agregarProducto(producto, 1)
}

const irALogin = () => {
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

onMounted(async () => {
  await obtenerProductosDestacados()
})
</script>

<template>
  <section class="destacados-section">
    <div class="container">
      <div class="section-header">
        <div>
          <span class="eyebrow"><span class="eyebrow-dot"></span> Lo más pedido</span>
          <h2 class="section-titulo">Productos destacados</h2>
          <p class="section-sub">Los favoritos de nuestros clientes, listos para ti</p>
        </div>
        <a class="ver-todos" href="/productos"> Ver todos <i class="pi pi-arrow-right"></i> </a>
      </div>

      <div v-if="cargando" class="estado-wrap">
        <div class="mini-spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <div v-else-if="productos.length === 0" class="estado-wrap">
        <i class="pi pi-inbox" style="font-size: 2rem; color: #ffd6e8"></i>
        <p>No hay productos disponibles por ahora</p>
      </div>

      <div v-else class="productos-grid">
        <div v-for="p in productos" :key="p.id" class="producto-card">
          <div class="img-wrap">
            <img
              :src="p.imagenUrl || '/assets/images/default.jpg'"
              :alt="p.nombre"
              class="producto-img"
            />
            <div class="img-gradient"></div>
            <span class="badge-nuevo">Destacado</span>
          </div>

          <div class="card-body">
            <h5 class="prod-nombre">{{ p.nombre }}</h5>
            <p v-if="p.descripcion" class="prod-desc">{{ p.descripcion }}</p>
            <div class="card-footer">
              <span class="prod-precio">Bs. {{ p.precio }}</span>
              <button class="btn-carrito" @click="onAddToCart(p)">
                <i class="pi pi-shopping-cart"></i>
                <span>Añadir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

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
      <p class="modal-sub">Para agregar productos al carrito necesitas tener una cuenta activa.</p>
      <div class="modal-actions">
        <button class="btn-modal-cancel" @click="mostrarModalLogin = false">Cancelar</button>
        <button class="btn-modal-ok" @click="irALogin">Ir al login</button>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
/* ── Base ── */
.destacados-section {
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
  /* CAMBIADO: Color rosa intermedio del Hero */
  color: #ff80b0;
  margin-bottom: 0.5rem;
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* CAMBIADO: Color del badge principal */
  background: #ff80b0;
  display: inline-block;
}
.section-titulo {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 800;
  /* CAMBIADO: Color principal de títulos del Hero */
  color: #c2185b;
  letter-spacing: -0.5px;
  margin: 0 0 0.3rem;
  line-height: 1.2;
}
.section-sub {
  font-size: 0.9rem;
  /* CAMBIADO: Tono ciruela oscuro adaptado con opacidad */
  color: rgba(136, 14, 79, 0.75);
  margin: 0;
}
.ver-todos {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.83rem;
  font-weight: 700;
  /* CAMBIADO: Color del enlace a juego con la marca */
  color: #e91e8c;
  text-decoration: none;
  white-space: nowrap;
  padding: 0.55rem 1.1rem;
  border-radius: 50px;
  /* CAMBIADO: Borde adaptado sutilmente */
  border: 1.5px solid #ffd6e8;
  background: #fff;
  transition:
    background 0.18s,
    border-color 0.18s,
    color 0.18s;
  flex-shrink: 0;
}
.ver-todos i {
  font-size: 0.75rem;
  transition: transform 0.18s;
}
/* CAMBIADO: Hover del botón con el degradado insignia */
.ver-todos:hover {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: #fff;
}
.ver-todos:hover i {
  transform: translateX(3px);
}

/* ── Estados ── */
.estado-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
  /* CAMBIADO: Tono ciruela suave para el texto de carga */
  color: rgba(136, 14, 79, 0.5);
  font-size: 0.9rem;
}
.mini-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  /* CAMBIADO: Sincronizado con tonos rosa */
  border: 3px solid #fff0f5;
  border-top-color: #e91e8c;
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Grid ── */
.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1.5rem;
}

/* ── Card ── */
.producto-card {
  background: #fff;
  border-radius: 20px;
  /* CAMBIADO: Borde adaptado */
  border: 1px solid #ffd6e8;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}
.producto-card:hover {
  transform: translateY(-6px);
  /* CAMBIADO: Sombra sutil con el tono del Hero */
  box-shadow: 0 16px 40px rgba(233, 30, 140, 0.12);
  border-color: #ff80b0;
}

/* Imagen */
.img-wrap {
  position: relative;
  height: 220px;
  overflow: hidden;
  flex-shrink: 0;
}
.producto-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.producto-card:hover .producto-img {
  transform: scale(1.07);
}
.img-gradient {
  position: absolute;
  inset: 0;
  /* CAMBIADO: Degradado oscuro adaptado al ciruela oscuro de base */
  background: linear-gradient(180deg, transparent 45%, rgba(136, 14, 79, 0.25) 100%);
}
.badge-nuevo {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.92);
  /* CAMBIADO: Color corporativo para el texto del badge */
  color: #e91e8c;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 50px;
  /* CAMBIADO: Borde sutil del badge */
  border: 1px solid #ffd6e8;
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
  /* CAMBIADO: Color de títulos secundarios (ciruela oscuro) */
  color: #880e4f;
  margin: 0 0 0.3rem;
  letter-spacing: -0.2px;
}
.prod-desc {
  font-size: 0.82rem;
  /* CAMBIADO: Texto descriptivo en ciruela con opacidad */
  color: rgba(136, 14, 79, 0.8);
  line-height: 1.5;
  margin: 0 0 1rem;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
}
.prod-precio {
  font-size: 1.15rem;
  font-weight: 800;
  /* CAMBIADO: El precio adopta el rosa oscuro de los títulos destacados */
  color: #c2185b;
  letter-spacing: -0.3px;
}
.btn-carrito {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.55rem 1.1rem;
  border-radius: 50px;
  border: none;
  /* CAMBIADO: Botón con el degradado lineal exacto del botón del Hero */
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.2);
  transition:
    transform 0.18s,
    box-shadow 0.18s;
  white-space: nowrap;
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
  /* CAMBIADO: Fondo sutil a tono */
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
  /* CAMBIADO: Subtítulo en ciruela con opacidad */
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
  .destacados-section {
    padding: 3.5rem 0 3rem;
  }
}
</style>
