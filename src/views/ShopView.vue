<template>
  <section class="py-5" style="background-color: #fff0f3; min-height: 100vh">
    <div class="container">
      <div class="d-flex align-items-center gap-3 mb-4">
        <h2 class="mb-0 fw-bold" style="color: #d63384">Nuestra Pastelería</h2>
        <span v-if="selectedCategory" class="badge rounded-pill bg-pink text-white px-3">
          {{ selectedCategory }}
        </span>
        <button
          v-if="selectedCategory"
          class="btn btn-sm btn-outline-secondary border-0"
          @click="clearCategory"
        >
          <i class="bi bi-x-circle"></i> Ver todo
        </button>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted">Cargando productos...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div v-else class="row g-4">
        <div class="col-6 col-md-4 col-xl-3" v-for="p in visibleProducts" :key="p.id">
          <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
            <div class="position-relative">
              <img
                :src="p.imagenUrl"
                class="card-img-top"
                :alt="p.nombre"
                style="height: 200px; object-fit: cover"
              />
              <div class="category-tag">{{ p.categoria?.nombre }}</div>
            </div>

            <div class="card-body text-center">
              <h5 class="fw-bold mb-1" style="color: #5c3d2e">{{ p.nombre }}</h5>
              <p class="text-muted small mb-3">{{ p.descripcion }}</p>

              <div class="d-flex justify-content-between align-items-center mt-auto">
                <span class="fs-5 fw-bold" style="color: #d63384">{{ p.precio }} Bs.</span>
                <button class="btn btn-pink rounded-pill px-3 shadow-sm">Añadir</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="visibleProducts.length === 0" class="col-12 text-center py-5">
          <h4 class="text-muted">¡Ups! Se acabaron los pasteles de esta categoría.</h4>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productoService } from '@/servicios/productoService'
import type { Producto } from '@/models/producto'

const route = useRoute()
const router = useRouter()

const products = ref<Producto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await cargarProductos()
})

async function cargarProductos() {
  loading.value = true
  error.value = null
  try {
    products.value = await productoService.obtenerProductos()
  } catch (err) {
    error.value = 'Error al cargar los productos'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const selectedCategory = computed(() => (route.query.category as string) || '')

const visibleProducts = computed(() => {
  if (!selectedCategory.value) return products.value
  return products.value.filter(
    (p) => p.categoria?.nombre?.toLowerCase() === selectedCategory.value.toLowerCase(),
  )
})

function clearCategory() {
  router.push({ name: 'shop', query: {} })
}
</script>

<style scoped>
/* Estilos personalizados para el toque dulce */
.bg-pink {
  background-color: #ff85a1;
}

.btn-pink {
  background-color: #ff85a1;
  color: white;
  transition: all 0.3s ease;
}

.btn-pink:hover {
  background-color: #f75c7e;
  color: white;
  transform: scale(1.05);
}

.category-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #ff85a1;
}

.card {
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}
</style>
