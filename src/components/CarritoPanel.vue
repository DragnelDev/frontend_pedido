<script setup lang="ts">
import { usarCarrito } from '@/funciones/UsarCarrito'

const { carrito, totalCarrito, eliminarProducto } = usarCarrito()

const emit = defineEmits(['cerrar'])
</script>

<template>
  <div class="drawer-overlay" @click.self="emit('cerrar')">
    <Transition name="slide">
      <div class="drawer">
        <!-- Header -->
        <div class="drawer-header">
          <div class="drawer-titulo">
            <i class="pi pi-shopping-cart"></i>
            <h5>Mi carrito</h5>
          </div>
          <button class="btn-cerrar" @click="emit('cerrar')" aria-label="Cerrar">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Vacío -->
        <div v-if="carrito.length === 0" class="carrito-vacio">
          <div class="vacio-icon">🛒</div>
          <p class="vacio-texto">Tu carrito está vacío</p>
          <p class="vacio-sub">Agrega tus pasteles favoritos</p>
        </div>

        <!-- Items -->
        <div v-else class="drawer-contenido">
          <div class="items-lista">
            <div v-for="item in carrito" :key="item.producto.id" class="carrito-item">
              <img
                :src="item.producto.imagenUrl || '/assets/images/default.jpg'"
                :alt="item.producto.nombre"
                class="item-img"
              />
              <div class="item-info">
                <h6>{{ item.producto.nombre }}</h6>
                <p class="item-precio">Bs. {{ item.producto.precio }} × {{ item.cantidad }}</p>
                <p class="item-subtotal">
                  Bs. {{ (item.producto.precio * item.cantidad).toFixed(2) }}
                </p>
              </div>
              <button
                class="btn-eliminar"
                @click="eliminarProducto(item.producto.id)"
                aria-label="Eliminar"
              >
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>

          <!-- Total y acción -->
          <div class="drawer-footer">
            <div class="total-row">
              <span class="total-label">Total</span>
              <span class="total-valor">Bs. {{ totalCarrito().toFixed(2) }}</span>
            </div>
            <RouterLink :to="{ name: 'carrito' }" class="btn-finalizar" @click="emit('cerrar')">
              🍰 Finalizar compra
            </RouterLink>
            <button class="btn-seguir" @click="emit('cerrar')">Seguir comprando</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 1100;
  backdrop-filter: blur(2px);
}

.drawer {
  background: white;
  width: 100%;
  max-width: 380px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(233, 30, 140, 0.2);
}

/* Header */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
}

.drawer-titulo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.drawer-titulo i {
  font-size: 1.2rem;
}

.drawer-titulo h5 {
  margin: 0;
  font-weight: 700;
  font-size: 1.1rem;
}

.btn-cerrar {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-cerrar:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* Vacío */
.carrito-vacio {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.vacio-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.vacio-texto {
  font-weight: 700;
  color: #880e4f;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.vacio-sub {
  color: #bbb;
  font-size: 0.9rem;
}

/* Contenido con items */
.drawer-contenido {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.items-lista {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1.25rem;
}

.carrito-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid #fce4ec;
}

.carrito-item:last-child {
  border-bottom: none;
}

.item-img {
  width: 62px;
  height: 62px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #fce4ec;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info h6 {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-precio {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 0.1rem;
}

.item-subtotal {
  font-weight: 700;
  color: #e91e8c;
  font-size: 0.9rem;
  margin: 0;
}

.btn-eliminar {
  background: none;
  border: none;
  color: #f48fb1;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.3rem;
  border-radius: 6px;
  transition:
    color 0.2s,
    background 0.2s;
  flex-shrink: 0;
}

.btn-eliminar:hover {
  color: #e53e3e;
  background: #fff5f5;
}

/* Footer */
.drawer-footer {
  padding: 1.25rem 1.5rem;
  border-top: 2px solid #fce4ec;
  background: #fff9fb;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.total-label {
  font-weight: 600;
  color: #666;
  font-size: 1rem;
}

.total-valor {
  font-weight: 800;
  color: #e91e8c;
  font-size: 1.3rem;
}

.btn-finalizar {
  display: block;
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.85rem;
  border-radius: 50px;
  text-align: center;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
  transition:
    opacity 0.2s,
    transform 0.2s;
  margin-bottom: 0.6rem;
}

.btn-finalizar:hover {
  opacity: 0.92;
  transform: scale(1.02);
  color: white;
}

.btn-seguir {
  display: block;
  width: 100%;
  background: none;
  border: 1.5px solid #f48fb1;
  color: #e91e8c;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 0.65rem;
  border-radius: 50px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-seguir:hover {
  background: #fff0f5;
}

@media (max-width: 480px) {
  .drawer {
    max-width: 100%;
  }
}
</style>
