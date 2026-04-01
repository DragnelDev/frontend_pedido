<script setup lang="ts">
import { ref, onMounted } from 'vue'
import http from '@/plugins/axios'

const misPedidos = ref([])

onMounted(async () => {
  try {
    const { data } = await http.get('/pedidos/mios')
    misPedidos.value = data
  } catch (error) {
    console.error('Error al cargar pedidos:', error)
  }
})
</script>
<template>
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body></body>
  </html>
</template>
<style></style>
