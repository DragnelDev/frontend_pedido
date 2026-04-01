<script lang="ts" setup>
const props = defineProps<{
  color: { clave: string; valor: string }
}>()
</script>

<template>
  <li class="color-item">
    <span class="color-swatch" :style="{ backgroundColor: props.color.clave }"></span>
    <span class="color-valor" :style="{ color: props.color.clave }">
      {{ props.color.valor }}
    </span>
  </li>
</template>

<style scoped>
.color-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.75rem;
  border-radius: 50px;
  background: #fff0f5;
  border: 1px solid #fce4ec;
  list-style: none;
  transition: transform 0.2s;
}

.color-item:hover {
  transform: scale(1.04);
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.color-valor {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
