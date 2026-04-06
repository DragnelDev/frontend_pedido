<script setup lang="ts">
import { usarCarrito } from '@/funciones/UsarCarrito'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const {
  carrito, eliminarProducto, vaciarCarrito, totalCarrito,
  incrementarCantidad, disminuirCantidad,
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
  if (carrito.value.length === 0) { alert('Tu carrito está vacío.'); return }
  const stockOk = await verificarStockCarrito()
  if (!stockOk) { mostrarModalStock.value = true; return }
  router.push('/checkout')
}
</script>

<template>
  <section class="carrito-page">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <span class="section-tag">🛒 Mi carrito</span>
        <h2 class="page-titulo">Tu carrito de compras</h2>
      </div>

      <div class="carrito-layout">
        <!-- Lista de productos -->
        <div class="col-productos">
          <!-- Vacío -->
          <div v-if="carrito.length === 0" class="carrito-vacio">
            <div class="vacio-icon">🛒</div>
            <h4>Tu carrito está vacío</h4>
            <p>Agrega tus pasteles favoritos y endulza tu día</p>
            <RouterLink to="/productos" class="btn-explorar">🍰 Explorar productos</RouterLink>
          </div>

          <template v-else>
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
                <span class="item-precio">
                  Bs. {{ Number(item.producto.precio ?? 0).toFixed(2) }}
                </span>
                <p v-if="erroresStock[item.producto.id]" class="stock-error-msg">
                  ⚠️ Stock insuficiente: pediste {{ erroresStock[item.producto.id]?.solicitado }},
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

              <button class="btn-eliminar" @click="eliminarProducto(item.producto.id)" title="Eliminar">
                <i class="pi pi-trash"></i>
              </button>
            </div>

            <button class="btn-vaciar" @click="vaciarCarrito">
              <i class="pi pi-times"></i> Vaciar carrito
            </button>
          </template>
        </div>

        <!-- Resumen -->
        <aside class="resumen-card" v-if="carrito.length > 0">
          <h5 class="resumen-titulo">Resumen del pedido</h5>

          <div class="resumen-linea">
            <span>Subtotal</span>
            <span>Bs. {{ subtotal }}</span>
          </div>
          <div class="resumen-linea">
            <span>Envío</span>
            <span class="gratis">🎁 Gratis</span>
          </div>

          <div class="resumen-divider"></div>

          <div class="resumen-total">
            <span>Total</span>
            <span>Bs. {{ subtotal }}</span>
          </div>

          <button
            class="btn-pago"
            :disabled="cargandoStock"
            @click="procederAlPago"
          >
            <span v-if="cargandoStock">
              <i class="pi pi-spin pi-spinner"></i> Verificando...
            </span>
            <span v-else>🍰 Proceder al pago</span>
          </button>

          <button class="btn-seguir" @click="router.push('/')">
            Seguir comprando
          </button>
        </aside>
      </div>
    </div>
  </section>

  <!-- Modal stock insuficiente -->
  <Dialog
    v-model:visible="mostrarModalStock"
    modal
    header="Stock insuficiente"
    :style="{ width: '90vw', maxWidth: '460px' }"
  >
    <div class="modal-stock-body">
      <div class="modal-stock-icon">⚠️</div>
      <p class="mb-3">Algunos productos no tienen stock suficiente. Ajusta las cantidades:</p>
      <ul class="stock-lista">
        <li v-for="(info, id) in erroresStock" :key="id">
          <strong>{{ carrito.find(c => c.producto.id === Number(id))?.producto.nombre || `Producto #${id}` }}</strong>:
          pediste {{ info.solicitado }}, disponibles {{ info.disponible }}
        </li>
      </ul>
    </div>
    <div class="text-end mt-3">
      <Button label="Entendido" @click="mostrarModalStock = false" />
    </div>
  </Dialog>
</template>

<style scoped>
.carrito-page {
  background: linear-gradient(180deg, #fff9fb 0%, #fce4ec 100%);
  padding: 3rem 1rem;
  min-height: 80vh;
}

.page-header {
  margin-bottom: 2rem;
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
  margin-bottom: 0.5rem;
}

.page-titulo {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0;
}

/* Layout */
.carrito-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.75rem;
  align-items: start;
}

/* Vacío */
.carrito-vacio {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 1px solid #fce4ec;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.07);
}

.vacio-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.carrito-vacio h4 {
  font-weight: 700;
  color: #880e4f;
  margin-bottom: 0.4rem;
}

.carrito-vacio p {
  color: #aaa;
  margin-bottom: 1.5rem;
}

.btn-explorar {
  display: inline-block;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-explorar:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  color: white;
}

/* Item card */
.item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 14px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.85rem;
  box-shadow: 0 2px 12px rgba(233, 30, 140, 0.07);
  border: 1px solid #fce4ec;
  transition: box-shadow 0.2s;
}

.item-card:hover {
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.14);
}

.item-card.item-error {
  border-color: #ffcdd2;
  background: #fff5f5;
}

.item-img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid #fce4ec;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-info h6 {
  font-weight: 700;
  color: #880e4f;
  margin-bottom: 0.2rem;
  font-size: 0.95rem;
}

.item-desc {
  font-size: 0.8rem;
  color: #bbb;
  margin-bottom: 0.2rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-precio {
  font-weight: 700;
  color: #e91e8c;
  font-size: 0.95rem;
}

.stock-error-msg {
  font-size: 0.78rem;
  color: #c62828;
  margin: 0.3rem 0 0;
  font-weight: 600;
}

/* Cantidad */
.cantidad-ctrl {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-qty {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #c2185b;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  line-height: 1;
}

.btn-qty:hover {
  background: #fce4ec;
}

.qty-val {
  font-weight: 700;
  color: #880e4f;
  min-width: 24px;
  text-align: center;
}

/* Subtotal y eliminar */
.item-subtotal {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.95rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-eliminar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: #fce4ec;
  color: #c62828;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, transform 0.15s;
}

.btn-eliminar:hover {
  background: #f8bbd0;
  transform: scale(1.1);
}

.btn-vaciar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1.5px solid #ffcdd2;
  background: white;
  color: #e53e3e;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}

.btn-vaciar:hover {
  background: #fff5f5;
}

/* Resumen */
.resumen-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  border: 1px solid #fce4ec;
  position: sticky;
  top: 1.5rem;
}

.resumen-titulo {
  font-weight: 800;
  color: #880e4f;
  font-size: 1.05rem;
  margin-bottom: 1.25rem;
}

.resumen-linea {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.65rem;
}

.gratis {
  color: #2e7d32;
  font-weight: 600;
}

.resumen-divider {
  height: 1px;
  background: #fce4ec;
  margin: 1rem 0;
}

.resumen-total {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  font-size: 1.15rem;
  color: #880e4f;
  margin-bottom: 1.25rem;
}

.resumen-total span:last-child {
  color: #e91e8c;
}

.btn-pago {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.85rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
  margin-bottom: 0.6rem;
}

.btn-pago:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
}

.btn-pago:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-seguir {
  width: 100%;
  background: none;
  border: 1.5px solid #f8bbd0;
  color: #e91e8c;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.65rem;
  border-radius: 50px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-seguir:hover {
  background: #fff0f5;
}

/* Modal stock */
.modal-stock-body {
  text-align: center;
}

.modal-stock-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.stock-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.stock-lista li {
  padding: 0.5rem 0.75rem;
  background: #fff5f5;
  border-radius: 8px;
  margin-bottom: 0.4rem;
  font-size: 0.875rem;
  color: #555;
  border-left: 3px solid #e53e3e;
}

/* Responsive */
@media (max-width: 900px) {
  .carrito-layout {
    grid-template-columns: 1fr;
  }

  .resumen-card {
    position: static;
  }
}

@media (max-width: 576px) {
  .item-card {
    flex-wrap: wrap;
  }

  .item-subtotal {
    margin-left: auto;
  }
}
</style>
