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

// 🟦 Obtener productos destacados
const obtenerProductosDestacados = async () => {
  cargando.value = true
  try {
    const res = await http.get('productos')
    // Limitar a los primeros 3 productos para el carousel
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
  <!-- Sección visible si se habilita en producción -->
  <section class="productos-destacados py-5">
    <div class="container">
      <div class="section-header text-center mb-5">
        <span class="section-tag">⭐ Lo más pedido</span>
        <h2 class="section-titulo">Productos destacados</h2>
      </div>

      <div v-if="cargando" class="text-center">
        <p>Cargando productos...</p>
      </div>

      <div v-else-if="productos.length === 0" class="text-center">
        <p>No hay productos disponibles</p>
      </div>

      <div v-else class="productos-grid">
        <div class="producto-card" v-for="p in productos" :key="p.id">
          <div class="producto-img-wrap">
            <img
              :src="p.imagenUrl || '/assets/images/default.jpg'"
              :alt="p.nombre"
              class="producto-img"
            />
            <div class="producto-badge">Nuevo</div>
          </div>
          <div class="producto-info text-center">
            <h5 class="producto-nombre">{{ p.nombre }}</h5>
            <p class="producto-precio">Bs. {{ p.precio }}</p>
            <button class="btn-agregar" @click="onAddToCart(p)">🛒 Añadir al carrito</button>
          </div>
        </div>
      </div>
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
.productos-destacados {
  background: linear-gradient(180deg, #fff9fb 0%, #fce4ec 100%);
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
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #c2185b;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.producto-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.producto-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(233, 30, 140, 0.2);
}

.producto-img-wrap {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.producto-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.producto-card:hover .producto-img {
  transform: scale(1.06);
}

.producto-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #e91e8c;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
}

.producto-info {
  padding: 1.25rem;
}

.producto-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}

.producto-precio {
  font-weight: 800;
  color: #e91e8c;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.btn-agregar {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f48fb1);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.65rem 1.2rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.btn-agregar:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
</style>
