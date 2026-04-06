<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { usarCarrito } from '@/funciones/UsarCarrito'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'
import qrImage from '@/assets/images/qr-sansa.png'

const router = useRouter()
const { carrito, totalCarrito, vaciarCarrito } = usarCarrito()

const EP_PEDIDOS = '/pedidos'
const EP_DETALLES = '/detalle-pedidos'
const EP_PAGOS = '/pagos'
const EP_UPLOADS = '/uploads'

const subtotal = computed(() => totalCarrito().toFixed(2))
const usuarioId = ref<number | null>(null)
const enviandoPedido = ref(false)

const envio = ref({
  direccion: '',
  referencia: '',
  tipoEnvio: 'domicilio',
  fechaEntrega: '',
})

const pago = ref({
  metodo: 'transferencia',
  comprobanteFile: null as File | null,
  cardNumber: '',
  cardHolder: '',
  cardExp: '',
  cardCvv: '',
})

onMounted(() => {
  const token = getTokenFromLocalStorage()
  if (!token) { router.replace('/checkout'); return }
  const payload = parseJwt(token)
  usuarioId.value = payload?.sub ?? null
  if (!usuarioId.value) { router.replace('/checkout'); return }

  const fechaMinima = new Date()
  fechaMinima.setDate(fechaMinima.getDate() + 2)
  envio.value.fechaEntrega = fechaMinima.toISOString().slice(0, 10)
})

function last4(num: string) {
  return (num || '').replace(/\D/g, '').slice(-4) || ''
}

async function uploadComprobante(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await http.post(EP_UPLOADS, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return data?.url || data?.path || ''
}

async function confirmarPedido() {
  if (!usuarioId.value) { router.replace('/checkout'); return }
  if (!envio.value.direccion) { alert('Completa la dirección.'); return }
  if (carrito.value.length === 0) { alert('Tu carrito está vacío.'); router.push('/carrito'); return }
  if ((pago.value.metodo === 'transferencia' || pago.value.metodo === 'qr') && !pago.value.comprobanteFile) {
    alert('Debes subir el comprobante de pago.')
    return
  }

  enviandoPedido.value = true
  try {
    const { data: pedido } = await http.post(EP_PEDIDOS, {
      idUsuario: usuarioId.value,
      fechaEntrega: envio.value.fechaEntrega,
      total: Number(totalCarrito()),
      estado: 'pendiente',
      direccionEnvio: envio.value.direccion,
      referencia: envio.value.referencia,
      tipoEnvio: envio.value.tipoEnvio,
      metodoPago: pago.value.metodo,
    })

    for (const item of carrito.value) {
      await http.post(EP_DETALLES, {
        idPedido: pedido.id,
        idProducto: item.producto.id,
        cantidad: item.cantidad,
        precioUnitario: Number(item.producto.precio),
      })
    }

    let comprobanteUrl = ''
    if ((pago.value.metodo === 'transferencia' || pago.value.metodo === 'qr') && pago.value.comprobanteFile) {
      comprobanteUrl = await uploadComprobante(pago.value.comprobanteFile)
    }

    const pagoPayload: any = {
      idPedido: pedido.id,
      metodo: pago.value.metodo,
      monto: Number(totalCarrito()),
      estado: 'pendiente',
    }

    if (pago.value.metodo === 'tarjeta') {
      pagoPayload.maskedCard = `**** **** **** ${last4(pago.value.cardNumber)}`
      pagoPayload.comprobante = ''
    } else {
      pagoPayload.comprobante = comprobanteUrl
    }

    await http.post(EP_PAGOS, pagoPayload)

    localStorage.setItem('ultimoPedido', JSON.stringify({
      id: pedido.id, total: Number(totalCarrito()),
      metodoPago: pago.value.metodo, estado: 'pendiente', fecha: new Date().toISOString(),
    }))

    vaciarCarrito()
    router.push('/checkout/gracias')
  } catch (e: any) {
    alert(e?.response?.data?.message || 'No se pudo registrar el pedido.')
  } finally {
    enviandoPedido.value = false
  }
}
</script>

<template>
  <section class="checkout-page">
    <div class="container">
      <div class="page-header">
        <span class="section-tag">💳 Finalizar compra</span>
        <h2 class="page-titulo">Datos de envío y pago</h2>
      </div>

      <div class="checkout-layout">
        <!-- Formulario -->
        <div class="formulario-card">
          <form @submit.prevent="confirmarPedido" novalidate>

            <!-- Sección: Entrega -->
            <div class="form-seccion">
              <h4 class="seccion-titulo"><i class="pi pi-truck"></i> Datos de entrega</h4>

              <div class="field">
                <label class="field-label" for="fecha">Fecha de entrega <span class="req">*</span></label>
                <input id="fecha" v-model="envio.fechaEntrega" type="date"
                  :min="new Date().toISOString().slice(0, 10)" class="field-input" required />
              </div>

              <div class="field-row">
                <div class="field">
                  <label class="field-label" for="dir">Dirección <span class="req">*</span></label>
                  <input id="dir" v-model="envio.direccion" type="text"
                    class="field-input" placeholder="Calle, número, zona..." required />
                </div>
                <div class="field">
                  <label class="field-label" for="ref">Referencia</label>
                  <input id="ref" v-model="envio.referencia" type="text"
                    class="field-input" placeholder="Casa verde, 2do piso..." />
                </div>
              </div>

              <div class="field">
                <label class="field-label" for="tipoEnvio">Tipo de entrega <span class="req">*</span></label>
                <select id="tipoEnvio" v-model="envio.tipoEnvio" class="field-input" required>
                  <option value="domicilio">🚚 A domicilio</option>
                  <option value="local">🏪 Recoger en el local</option>
                </select>
              </div>
            </div>

            <div class="seccion-divider"></div>

            <!-- Sección: Pago -->
            <div class="form-seccion">
              <h4 class="seccion-titulo"><i class="pi pi-credit-card"></i> Método de pago</h4>

              <div class="field">
                <label class="field-label">Selecciona tu método</label>
                <div class="metodo-opciones">
                  <label v-for="m in [
                    { val: 'transferencia', label: '🏦 Transferencia', },
                    { val: 'qr', label: '📱 QR', },
                    { val: 'tarjeta', label: '💳 Tarjeta', },
                  ]" :key="m.val" class="metodo-option" :class="{ activo: pago.metodo === m.val }">
                    <input type="radio" v-model="pago.metodo" :value="m.val" hidden />
                    {{ m.label }}
                  </label>
                </div>
              </div>

              <!-- Transferencia -->
              <div v-if="pago.metodo === 'transferencia'" class="box-pago">
                <p><strong>Propietario:</strong> Carmen Bautista</p>
                <p><strong>Cuenta:</strong> 123-456789-00 (Banco Unión)</p>
                <p class="box-label">Sube tu comprobante de pago:</p>
                <label class="upload-label">
                  <i class="pi pi-upload"></i>
                  <span>{{ pago.comprobanteFile?.name || 'Seleccionar archivo' }}</span>
                  <input type="file" accept="image/*,.pdf" class="file-hidden" required
                    @change="(e) => (pago.comprobanteFile = (e.target as HTMLInputElement).files?.[0] || null)" />
                </label>
              </div>

              <!-- QR -->
              <div v-if="pago.metodo === 'qr'" class="box-pago text-center">
                <div class="qr-wrap">
                  <img :src="qrImage" alt="QR Berry Sweet" class="qr-img" />
                </div>
                <p class="box-label">Escanea el QR y sube tu comprobante:</p>
                <label class="upload-label">
                  <i class="pi pi-upload"></i>
                  <span>{{ pago.comprobanteFile?.name || 'Seleccionar comprobante' }}</span>
                  <input type="file" accept="image/*,.pdf" class="file-hidden" required
                    @change="(e) => (pago.comprobanteFile = (e.target as HTMLInputElement).files?.[0] || null)" />
                </label>
              </div>

              <!-- Tarjeta -->
              <div v-if="pago.metodo === 'tarjeta'" class="box-pago">
                <div class="field-row">
                  <div class="field" style="grid-column: 1/-1">
                    <label class="field-label">Número de tarjeta</label>
                    <input v-model="pago.cardNumber" inputmode="numeric" maxlength="19"
                      class="field-input" placeholder="XXXX XXXX XXXX XXXX" required />
                  </div>
                  <div class="field" style="grid-column: 1/-1">
                    <label class="field-label">Nombre en la tarjeta</label>
                    <input v-model="pago.cardHolder" type="text" class="field-input" required />
                  </div>
                  <div class="field">
                    <label class="field-label">Expiración</label>
                    <input v-model="pago.cardExp" class="field-input" placeholder="MM/AA" required />
                  </div>
                  <div class="field">
                    <label class="field-label">CVV</label>
                    <input v-model="pago.cardCvv" inputmode="numeric" maxlength="4"
                      class="field-input" placeholder="•••" required />
                  </div>
                </div>
                <small class="nota-tarjeta">⚠️ Pago simulado. Estado quedará pendiente hasta verificación.</small>
              </div>
            </div>

            <button class="btn-confirmar" type="submit" :disabled="enviandoPedido">
              <span v-if="enviandoPedido"><i class="pi pi-spin pi-spinner"></i> Procesando...</span>
              <span v-else">🍰 Confirmar pedido</span>
            </button>
          </form>
        </div>

        <!-- Resumen -->
        <aside class="resumen-card">
          <h5 class="resumen-titulo">Resumen del pedido</h5>

          <div class="resumen-lista">
            <div v-for="item in carrito" :key="item.producto.id" class="resumen-item">
              <img :src="item.producto.imagenUrl" alt="Producto" class="resumen-img" />
              <div class="resumen-info">
                <p class="resumen-nombre">{{ item.producto.nombre }}</p>
                <span class="resumen-qty">×{{ item.cantidad }}</span>
              </div>
              <span class="resumen-precio">
                Bs. {{ (item.producto.precio * item.cantidad).toFixed(2) }}
              </span>
            </div>
          </div>

          <div class="totales">
            <div class="total-linea">
              <span>Subtotal</span><span>Bs. {{ subtotal }}</span>
            </div>
            <div class="total-linea">
              <span>Envío</span><span class="gratis">🎁 Gratis</span>
            </div>
            <div class="total-linea total-final">
              <strong>Total</strong><strong>Bs. {{ subtotal }}</strong>
            </div>
          </div>

          <RouterLink to="/carrito" class="volver-link">
            <i class="pi pi-arrow-left"></i> Volver al carrito
          </RouterLink>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.checkout-page {
  background: linear-gradient(180deg, #fff9fb 0%, #fce4ec 100%);
  padding: 2.5rem 1rem;
  min-height: 80vh;
}

.page-header { margin-bottom: 1.75rem; }

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
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0;
}

/* Layout */
.checkout-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.75rem;
  align-items: start;
}

/* Formulario */
.formulario-card {
  background: white;
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
  border: 1px solid #fce4ec;
}

.form-seccion { display: flex; flex-direction: column; gap: 1rem; }

.seccion-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #c2185b;
  margin: 0 0 0.25rem;
}

.seccion-divider {
  height: 1px;
  background: #fce4ec;
  margin: 1.25rem 0;
}

.field { display: flex; flex-direction: column; gap: 0.35rem; }

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #880e4f;
}

.req { color: #e91e8c; }

.field-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
  background: white;
}

/* Métodos de pago */
.metodo-opciones {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.metodo-option {
  padding: 0.5rem 1rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #c2185b;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.metodo-option.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-color: #e91e8c;
}

/* Box de métodos */
.box-pago {
  background: #fff9fb;
  border: 1.5px solid #fce4ec;
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 0.25rem;
}

.box-pago p {
  font-size: 0.875rem;
  margin-bottom: 0.4rem;
  color: #555;
}

.box-label {
  font-weight: 600;
  color: #880e4f;
  margin-top: 0.75rem;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  background: #fce4ec;
  color: #c2185b;
  border-radius: 50px;
  border: 1.5px dashed #f48fb1;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
  margin-top: 0.5rem;
}

.upload-label:hover { background: #f8bbd0; }

.file-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
}

.qr-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.qr-img {
  max-width: 160px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.15);
}

.nota-tarjeta {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.78rem;
  color: #aaa;
}

/* Botón confirmar */
.btn-confirmar {
  width: 100%;
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.9rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-confirmar:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
}

.btn-confirmar:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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
  height: fit-content;
}

.resumen-titulo {
  font-weight: 800;
  color: #880e4f;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.resumen-lista {
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.resumen-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem;
  background: #fff9fb;
  border-radius: 10px;
  border: 1px solid #fce4ec;
}

.resumen-img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid #fce4ec;
}

.resumen-info { flex: 1; min-width: 0; }

.resumen-nombre {
  font-weight: 600;
  color: #880e4f;
  font-size: 0.875rem;
  margin: 0 0 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resumen-qty {
  font-size: 0.78rem;
  color: #aaa;
}

.resumen-precio {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.875rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.totales {
  border-top: 2px solid #fce4ec;
  padding-top: 1rem;
}

.total-linea {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.gratis { color: #2e7d32; font-weight: 600; }

.total-final {
  font-size: 1.05rem;
  color: #880e4f;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #fce4ec;
}

.total-final strong:last-child { color: #e91e8c; }

.volver-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  color: #e91e8c;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.volver-link:hover { opacity: 0.75; }

/* Responsive */
@media (max-width: 900px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .resumen-card { position: static; }
}

@media (max-width: 576px) {
  .field-row { grid-template-columns: 1fr; }
}
</style>
