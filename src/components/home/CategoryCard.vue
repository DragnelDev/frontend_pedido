<template>
  <RouterLink
    class="category-card d-block position-relative rounded-4 overflow-hidden"
    :to="{ name: 'shop', query: { category: slug } }"
  >
    <img :src="image" :alt="name" class="card-img" />
    <div class="category-overlay d-flex flex-column justify-content-end p-3">
      <h3 class="text-white fw-bold mb-2 card-name">{{ name }}</h3>
      <button class="btn-ver-productos align-self-start">Ver productos</button>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  slug: string
  image: string
}>()
</script>

<style scoped>
.category-card {
  aspect-ratio: 4 / 3;
  box-shadow: 0 6px 24px rgba(233, 30, 140, 0.12);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 36px rgba(233, 30, 140, 0.22);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.category-card:hover .card-img {
  transform: scale(1.06);
}

.category-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(194, 24, 91, 0) 30%, rgba(136, 14, 79, 0.75) 100%);
  transition: background 0.3s ease;
}

.category-card:hover .category-overlay {
  background: linear-gradient(180deg, rgba(194, 24, 91, 0) 10%, rgba(136, 14, 79, 0.88) 100%);
}

.card-name {
  font-size: 1.15rem;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.btn-ver-productos {
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s ease;
}

.btn-ver-productos:hover {
  background: rgba(255, 255, 255, 0.35);
}
</style>
