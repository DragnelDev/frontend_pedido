<script setup lang="ts">
import { usarCarrito } from '@/funciones/UsarCarrito'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'

const {
  carrito,
  eliminarProducto,
  vaciarCarrito,
  totalCarrito,
  incrementarCantidad,
  disminuirCantidad,
} = usarCarrito()
const router = useRouter()

const subtotal = computed(() => totalCarrito().toFixed(2))

const erroresStock = ref<Record<number, { solicitado: number; disponible: number }>>({})
const cargandoStock = ref(false)
const mostrarModalStock = ref(false)

async function verificarStockCarrito(): Promise<boolean> {
  erroresStock.value = {}
  if (carrito.value.length === 0) return true
  cargandoStock.value = true
  try {
    const resultados = await Promise.all(
      carrito.value.map(async (item) => {
        const { data } = await http.get(`/productos/${item.producto.id}`)
        return { item, stock: data.stock as number }
      }),
    )
    for (const { item, stock } of resultados) {
      if (item.cantidad > stock) {
        erroresStock.value[item.producto.id] = { solicitado: item.cantidad, disponible: stock }
      }
    }
    return Object.keys(erroresStock.value).length === 0
  } finally {
    cargandoStock.value = false
  }
}

async function procederAlPago() {
  if (carrito.value.length === 0) {
    alert('Tu carrito está vacío.')
    return
  }
  const stockOk = await verificarStockCarrito()
  if (!stockOk) {
    mostrarModalStock.value = true
    return
  }
  router.push('/checkout')
}
</script>

<template>
  <section class="carrito-page">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <span class="eyebrow"><span class="eyebrow-dot"></span> Mi carrito</span>
        <h2 class="page-titulo">Tu carrito de compras</h2>
      </div>

      <!-- Vacío -->
      <div v-if="carrito.length === 0" class="carrito-vacio">
        <div class="vacio-icon">🛒</div>
        <h4>Tu carrito está vacío</h4>
        <p>Agrega tus pasteles favoritos y endulza tu día</p>
        <RouterLink to="/productos" class="btn-explorar">
          <i class="pi pi-shopping-bag"></i> Explorar productos
        </RouterLink>
      </div>

      <!-- Layout con productos -->
      <div v-else class="carrito-layout">
        <!-- Lista -->
        <div class="col-productos">
          <div
            v-for="item in carrito"
            :key="item.producto.id"
            class="item-card"
            :class="{ 'item-error': erroresStock[item.producto.id] }"
          >
            <img
              :src="item.producto.imagenUrl || '/assets/images/default.jpg'"
              :alt="item.producto.nombre"
              class="item-img"
            />
            <div class="item-info">
              <h6>{{ item.producto.nombre }}</h6>
              <p class="item-desc">{{ item.producto.descripcion }}</p>
              <span class="item-precio"
                >Bs. {{ Number(item.producto.precio ?? 0).toFixed(2) }}</span
              >
              <p v-if="erroresStock[item.producto.id]" class="stock-error-msg">
                <i class="pi pi-exclamation-triangle"></i>
                Stock insuficiente: pediste {{ erroresStock[item.producto.id]?.solicitado }},
                disponibles {{ erroresStock[item.producto.id]?.disponible }}
              </p>
            </div>

            <div class="cantidad-ctrl">
              <button class="btn-qty" @click="disminuirCantidad(item.producto.id)">−</button>
              <span class="qty-val">{{ item.cantidad }}</span>
              <button class="btn-qty" @click="incrementarCantidad(item.producto.id)">+</button>
            </div>

            <span class="item-subtotal">
              Bs. {{ (Number(item.producto.precio ?? 0) * item.cantidad).toFixed(2) }}
            </span>

            <button
              class="btn-eliminar"
              @click="eliminarProducto(item.producto.id)"
              aria-label="Eliminar"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>

          <button class="btn-vaciar" @click="vaciarCarrito">
            <i class="pi pi-times"></i> Vaciar carrito
          </button>
        </div>

        <!-- Resumen -->
        <aside class="resumen-card">
          <h5 class="resumen-titulo">Resumen del pedido</h5>

          <div class="resumen-linea">
            <span>Subtotal</span>
            <span>Bs. {{ subtotal }}</span>
          </div>
          <div class="resumen-linea">
            <span>Envío</span>
            <span class="gratis"><i class="pi pi-gift"></i> Gratis</span>
          </div>

          <div class="resumen-divider"></div>

          <div class="resumen-total">
            <span>Total</span>
            <span>Bs. {{ subtotal }}</span>
          </div>

          <button class="btn-pago" :disabled="cargandoStock" @click="procederAlPago">
            <i v-if="cargandoStock" class="pi pi-spin pi-spinner"></i>
            <template v-else> <i class="pi pi-credit-card"></i> Proceder al pago </template>
          </button>

          <button class="btn-seguir" @click="router.push('/')">
            <i class="pi pi-arrow-left"></i> Seguir comprando
          </button>
        </aside>
      </div>
    </div>
  </section>

  <!-- Modal stock -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="mostrarModalStock" class="modal-backdrop" @click.self="mostrarModalStock = false">
        <div class="modal-box">
          <div class="modal-icon-wrap">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <h4 class="modal-title">Stock insuficiente</h4>
          <p class="modal-text">
            Algunos productos no tienen stock suficiente. Ajusta las cantidades:
          </p>
          <ul class="stock-lista">
            <li v-for="(info, id) in erroresStock" :key="id">
              <strong>{{
                carrito.find((c) => c.producto.id === Number(id))?.producto.nombre ||
                `Producto #${id}`
              }}</strong
              >: pediste {{ info.solicitado }}, disponibles {{ info.disponible }}
            </li>
          </ul>
          <button class="btn-ok" @click="mostrarModalStock = false">Entendido</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Base ── */
.carrito-page {
  background: #fdf4f8;
  padding: 2.5rem 1.5rem 4rem;
  min-height: 80vh;
}
.container {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1rem; /* evita que el contenido se pegue al borde y ayuda a centrar */
}

/* ── Header ── */
.page-header {
  margin-bottom: 1.75rem;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: #b5385e;
  margin-bottom: 0.4rem;
}
.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e8517a;
  display: inline-block;
}
.page-titulo {
  font-size: clamp(1.3rem, 3vw, 1.75rem);
  font-weight: 800;
  color: #1a0810;
  letter-spacing: -0.4px;
  margin: 0;
}

/* ── Vacío ── */
.carrito-vacio {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #f0d0db;
}
.vacio-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.35;
}
.carrito-vacio h4 {
  font-weight: 800;
  color: #1a0810;
  margin-bottom: 0.4rem;
}
.carrito-vacio p {
  color: #a07080;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.btn-explorar {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #e8517a;
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  padding: 0.72rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.btn-explorar:hover {
  opacity: 0.88;
  transform: translateY(-1px);
  color: #fff;
}

/* ── Layout ── */
.carrito-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px; /* evita que la columna principal desborde */
  gap: 1.25rem;
  align-items: start;
  justify-content: center; /* centra la grid dentro del contenedor si hay espacio */
}

/* ── Item card ── */
.item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid #f0d0db;
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}
.item-card:hover {
  box-shadow: 0 6px 20px rgba(232, 81, 122, 0.1);
  border-color: #f5a8c0;
}
.item-card.item-error {
  border-color: #ffcdd2;
  background: #fff8f8;
}

.item-img {
  width: 68px;
  height: 68px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #f0d0db;
  flex-shrink: 0;
}
.item-info {
  flex: 1;
  min-width: 0;
}
.item-info h6 {
  font-weight: 700;
  color: #1a0810;
  margin-bottom: 0.15rem;
  font-size: 0.92rem;
}
.item-desc {
  font-size: 0.78rem;
  color: #c0a0b0;
  margin-bottom: 0.2rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.item-precio {
  font-weight: 700;
  color: #e8517a;
  font-size: 0.9rem;
}
.stock-error-msg {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #c62828;
  font-weight: 600;
  margin: 0.3rem 0 0;
}

/* ── Cantidad ── */
.cantidad-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.btn-qty {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid #f0d0db;
  background: #fff8fb;
  color: #c04070;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.btn-qty:hover {
  background: #fce8f0;
  border-color: #e8517a;
}
.qty-val {
  font-weight: 700;
  color: #1a0810;
  min-width: 22px;
  text-align: center;
  font-size: 0.9rem;
}

.item-subtotal {
  font-weight: 800;
  color: #e8517a;
  font-size: 0.9rem;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 70px;
  text-align: right;
}

.btn-eliminar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #fff0f0;
  color: #c62828;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.85rem;
  transition:
    background 0.15s,
    transform 0.15s;
}
.btn-eliminar:hover {
  background: #ffcdd2;
  transform: scale(1.1);
}

.btn-vaciar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #ffcdd2;
  background: transparent;
  color: #c62828;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.48rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: background 0.15s;
}
.btn-vaciar:hover {
  background: #fff0f0;
}

/* ── Resumen ── */
.resumen-card {
  background: #fff;
  border-radius: 20px;
  padding: 1.25rem;
  border: 1px solid #f0d0db;
  position: sticky;
  top: 1rem;
}
.resumen-titulo {
  font-weight: 800;
  color: #1a0810;
  font-size: 1rem;
  margin-bottom: 1rem;
  letter-spacing: -0.2px;
}
.resumen-linea {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #80606e;
  margin-bottom: 0.55rem;
}
.gratis {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2e7d32;
  font-weight: 600;
  font-size: 0.82rem;
}
.resumen-divider {
  height: 1px;
  background: #f5e8ee;
  margin: 0.9rem 0;
}
.resumen-total {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  font-size: 1rem;
  color: #1a0810;
  margin-bottom: 1.1rem;
}
.resumen-total span:last-child {
  color: #e8517a;
}

.btn-pago {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: #e8517a;
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  padding: 0.78rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.2s;
  margin-bottom: 0.6rem;
}
.btn-pago:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}
.btn-pago:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-seguir {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: 1.5px solid #f0d0db;
  color: #c04070;
  font-weight: 600;
  font-size: 0.83rem;
  padding: 0.65rem;
  border-radius: 50px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.btn-seguir:hover {
  background: #fff4f8;
  border-color: #f5a8c0;
}

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 8, 16, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-box {
  background: #fff;
  border-radius: 20px;
  padding: 2rem 1.75rem;
  max-width: 400px;
  width: 100%;
  border: 1px solid #f0d0db;
  text-align: center;
}
.modal-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #fff3f0;
  border: 1px solid #ffcdd2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #c62828;
  margin: 0 auto 1rem;
}
.modal-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #1a0810;
  margin: 0 0 0.4rem;
}
.modal-text {
  font-size: 0.85rem;
  color: #a07080;
  margin: 0 0 1rem;
}
.stock-lista {
  list-style: none;
  padding: 0;
  margin: 0 0 1.25rem;
  text-align: left;
}
.stock-lista li {
  padding: 0.5rem 0.75rem;
  background: #fff8f8;
  border-radius: 10px;
  margin-bottom: 0.4rem;
  font-size: 0.83rem;
  color: #555;
  border-left: 3px solid #e53e3e;
}
.btn-ok {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e8517a;
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 0.62rem 2rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.18s;
}
.btn-ok:hover {
  opacity: 0.88;
}

/* ── Transición ── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 720px) {
  .carrito-layout {
    grid-template-columns: 1fr;
  }
  .resumen-card {
    position: static;
  }
}
@media (max-width: 480px) {
  .item-card {
    flex-wrap: wrap;
  }
  .item-subtotal {
    margin-left: auto;
  }
  .carrito-page {
    padding: 1.5rem 1rem 3rem;
  }
}
</style>
