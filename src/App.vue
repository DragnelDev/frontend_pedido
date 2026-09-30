<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import MainFooter from './components/MainFooter.vue'
import MainHeader from './components/MainHeader.vue'
import { usarCarrito } from './funciones/UsarCarrito'

const route = useRoute()
const { mostrarAvisoLogin, irAInicioSesion } = usarCarrito()
const hideLayout = computed(() => {
  const noLayoutNames = ['login', 'register'] // 👈 aquí añadimos register
  return route.path.startsWith('/admin') || noLayoutNames.includes(route.name as string)
})
</script>

<template>
  <MainHeader v-if="!hideLayout" />
  <RouterView />
  <MainFooter v-if="!hideLayout" />
  <Dialog
    v-model:visible="mostrarAvisoLogin"
    modal
    :closable="false"
    :draggable="false"
    :style="{ width: 'min(90vw, 400px)' }"
    :pt="{ root: { class: 'aviso-login-dialog' }, header: { style: 'display:none' } }"
  >
    <div class="aviso-login-contenido">
      <div class="aviso-login-icono"><i class="pi pi-lock"></i></div>
      <h2>Inicia sesión primero</h2>
      <p>Para agregar productos al carrito necesitas iniciar sesión.</p>
      <div class="aviso-login-acciones">
        <button class="aviso-login-cancelar" @click="mostrarAvisoLogin = false">Cancelar</button>
        <button class="aviso-login-confirmar" @click="irAInicioSesion">
          Ir al inicio de sesión
        </button>
      </div>
    </div>
  </Dialog>
</template>

<!-- <style>
/* @import '@/assets/css/bootstrap.min.css';
@import '@/assets/css/style.css';
/* @import '@/assets/css/vendor.css'; */ -->
<style>
/* Que el header quede fijo arriba y el contenido no se esconda detrás */
header {
  position: sticky;
  top: 0;
  z-index: 1000;
}
.aviso-login-contenido {
  padding: 1rem 0.5rem 0.5rem;
  text-align: center;
}
.aviso-login-icono {
  display: grid;
  width: 3.5rem;
  aspect-ratio: 1;
  margin: 0 auto 1rem;
  place-items: center;
  border-radius: 50%;
  background: #fff0f5;
  color: #a52b5e;
  font-size: 1.4rem;
}
.aviso-login-contenido h2 {
  margin: 0 0 0.5rem;
  color: #30232a;
  font-size: 1.25rem;
}
.aviso-login-contenido p {
  margin: 0;
  color: #62565c;
  line-height: 1.5;
}
.aviso-login-acciones {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.aviso-login-acciones button {
  min-height: 2.75rem;
  padding: 0.65rem 1rem;
  border: 1px solid #a52b5e;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
}
.aviso-login-cancelar {
  background: #fff;
  color: #a52b5e;
}
.aviso-login-confirmar {
  background: #a52b5e;
  color: #fff;
}
</style>
