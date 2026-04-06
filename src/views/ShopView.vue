<template>
  <section class="py-5" style="background-color: #fff0f3; min-height: 100vh;">
    <div class="container">

      <div class="d-flex align-items-center gap-3 mb-4">
        <h2 class="mb-0 fw-bold" style="color: #d63384;">Nuestra Pastelería</h2>
        <span v-if="selectedCategory" class="badge rounded-pill bg-pink text-white px-3">
          {{ selectedCategory }}
        </span>
        <button v-if="selectedCategory" class="btn btn-sm btn-outline-secondary border-0" @click="clearCategory">
          <i class="bi bi-x-circle"></i> Ver todo
        </button>
      </div>

      <div class="row g-4">
        <div class="col-6 col-md-4 col-xl-3" v-for="p in visibleProducts" :key="p.id">
          <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
            <div class="position-relative">
              <img :src="p.image" class="card-img-top" :alt="p.name" style="height: 200px; object-fit: cover;" />
              <div class="category-tag">{{ p.category }}</div>
            </div>

            <div class="card-body text-center">
              <h5 class="fw-bold mb-1" style="color: #5c3d2e;">{{ p.name }}</h5>
              <p class="text-muted small mb-3">{{ p.description }}</p>

              <div class="d-flex justify-content-between align-items-center mt-auto">
                <span class="fs-5 fw-bold" style="color: #d63384;">{{ p.price }} Bs.</span>
                <button class="btn btn-pink rounded-pill px-3 shadow-sm">
                  Añadir
                </button>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Datos actualizados para una pastelería
const products = [
  {
    id: 1,
    name: 'Pastel de Fresas',
    category: 'Tortas',
    description: 'Bizcocho de vainilla con crema natural.',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=500',
    price: 150
  },
  {
    id: 2,
    name: 'Macarons Mix',
    category: 'Galletas',
    description: 'Caja de 12 unidades sabores surtidos.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoLSGa1DDYtCdiB9fjV3NaYMspffc4taXfTQ&s',
    price: 65
  },
  {
    id: 3,
    name: 'Cupcake Velvet',
    category: 'Cupcakes',
    description: 'Suave masa roja con frosting de queso.',
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=500',
    price: 15
  },
  {
    id: 4,
    name: 'Cheesecake Frutos Rojos',
    category: 'Tortas',
    description: 'Base crujiente y mermelada artesanal.',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=500',
    price: 120
  }
]

const selectedCategory = computed(() => (route.query.category as string) || '')

const visibleProducts = computed(() => {
  if (!selectedCategory.value) return products
  return products.filter((p) => p.category.toLowerCase() === selectedCategory.value.toLowerCase())
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
