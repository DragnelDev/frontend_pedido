<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="bienvenida">
    <div class="bienvenida-deco">🍓</div>
    <h1 class="bienvenida-titulo">{{ msg }}</h1>
    <h3 class="bienvenida-sub">
      Tu tienda de pastelería artesanal en
      <span class="highlight">Sucre, Bolivia</span>
    </h3>
    <p class="bienvenida-texto">
      Desarrollado con
      <a href="https://vite.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>
    </p>
  </div>
</template>

<style scoped>
.bienvenida {
  text-align: center;
  padding: 2rem 1rem;
}

.bienvenida-deco {
  font-size: 3.5rem;
  margin-bottom: 0.5rem;
  animation: bounce 1.8s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.bienvenida-titulo {
  font-weight: 800;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  color: #c2185b;
  position: relative;
  top: -6px;
  margin-bottom: 0.5rem;
}

.bienvenida-sub {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: #880e4f;
  font-weight: 500;
  margin-bottom: 1rem;
}

.highlight {
  color: #e91e8c;
  font-weight: 700;
}

.bienvenida-texto {
  font-size: 0.9rem;
  color: #aaa;
}

.bienvenida-texto a {
  color: #e91e8c;
  text-decoration: none;
  font-weight: 600;
}

.bienvenida-texto a:hover {
  text-decoration: underline;
}

@media (min-width: 1024px) {
  .bienvenida {
    text-align: left;
  }
}
</style>
