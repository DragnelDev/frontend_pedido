<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { usarCarrito } from '@/funciones/UsarCarrito'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'
import qrImage from '@/assets/images/qr-sansa.png'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix del ícono default de Leaflet (bug conocido con bundlers)
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const router = useRouter()
const { carrito, totalCarrito, vaciarCarrito } = usarCarrito()

// Constantes de Endpoints
const EP_PEDIDOS = '/pedidos'
const EP_DETALLES = '/detalle-pedidos'
const EP_PAGOS = '/pagos'
const EP_UPLOADS = '/uploads'

const usuarioId = ref<number | null>(null)
const enviandoPedido = ref(false)

const subtotal = computed(() => totalCarrito().toFixed(2))

// ── Selector de fecha personalizado ──────────────────────────────────────────
interface DiaOpcion {
  iso: string
  label: string
  numero: number
  mes: string
  disponible: boolean
}

const HORAS_DISPONIBLES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const diasOpciones = computed<DiaOpcion[]>(() => {
  const hoy = new Date()
  const dias: DiaOpcion[] = []
  const DIAS_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const MESES_LABEL = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]

  for (let i = 0; i < 14; i++) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dias.push({
      iso,
      label: DIAS_LABEL[d.getDay()],
      numero: d.getDate(),
      mes: MESES_LABEL[d.getMonth()],
      disponible: i >= 2,
    })
  }
  return dias
})

const diaSeleccionado = ref<string>('')
const horaSeleccionada = ref<string>('')

const fechaEntregaFinal = computed(() => {
  if (!diaSeleccionado.value || !horaSeleccionada.value) return ''
  return `${diaSeleccionado.value}T${horaSeleccionada.value}:00Z`
})

// ── Formulario de envío ───────────────────────────────────────────────────────
const envio = ref({
  direccion: '',
  referencia: '',
  tipoEnvio: 'domicilio',
})

const pago = ref({
  comprobanteFile: null as File | null,
})

// ── Mapa / Coordenadas ────────────────────────────────────────────────────────
const mapaVisible = ref(false)
const coordenadas = ref<{ lat: number; lng: number } | null>(null)
const buscandoUbicacion = ref(false)
const direccionReversa = ref('')

let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null

// Sucre, Bolivia como centro por defecto
const CENTRO_DEFAULT: L.LatLngTuple = [-19.0477, -65.2594]

function abrirMapa() {
  mapaVisible.value = true
  nextTick(() => inicializarMapa())
}

function cerrarMapa() {
  mapaVisible.value = false
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    markerInstance = null
  }
}

function inicializarMapa() {
  const el = document.getElementById('mapa-leaflet')
  if (!el || mapInstance) return

  const centro: L.LatLngTuple = coordenadas.value
    ? [coordenadas.value.lat, coordenadas.value.lng]
    : CENTRO_DEFAULT

  mapInstance = L.map('mapa-leaflet', { zoomControl: true }).setView(centro, 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(mapInstance)

  if (coordenadas.value) {
    colocarMarcador(coordenadas.value.lat, coordenadas.value.lng)
  }

  mapInstance.on('click', (e: L.LeafletMouseEvent) => {
    colocarMarcador(e.latlng.lat, e.latlng.lng)
    buscarDireccionReversa(e.latlng.lat, e.latlng.lng)
  })
}

function colocarMarcador(lat: number, lng: number) {
  if (!mapInstance) return

  if (markerInstance) {
    markerInstance.setLatLng([lat, lng])
  } else {
    markerInstance = L.marker([lat, lng], { draggable: true }).addTo(mapInstance)

    markerInstance.on('dragend', () => {
      const pos = markerInstance!.getLatLng()
      coordenadas.value = { lat: pos.lat, lng: pos.lng }
      buscarDireccionReversa(pos.lat, pos.lng)
    })
  }

  coordenadas.value = { lat, lng }
  mapInstance.panTo([lat, lng])
}

async function buscarDireccionReversa(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
    )
    const data = await res.json()
    if (data?.display_name) {
      direccionReversa.value = data.display_name
      if (!envio.value.direccion.trim()) {
        envio.value.direccion = data.address?.road
          ? `${data.address.road}${data.address.house_number ? ' ' + data.address.house_number : ''}`
          : data.display_name.split(',')[0]
      }
    }
  } catch {
    direccionReversa.value = ''
  }
}

function usarUbicacionActual() {
  if (!navigator.geolocation) return alert('Tu navegador no soporta geolocalización.')
  buscandoUbicacion.value = true

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      colocarMarcador(lat, lng)
      buscarDireccionReversa(lat, lng)
      mapInstance?.setView([lat, lng], 17)
      buscandoUbicacion.value = false
    },
    () => {
      alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso.')
      buscandoUbicacion.value = false
    },
  )
}

function confirmarUbicacion() {
  if (!coordenadas.value) return alert('Primero selecciona un punto en el mapa.')
  cerrarMapa()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  const token = getTokenFromLocalStorage()
  if (!token) return router.replace('/checkout')

  const payload = parseJwt(token)
  usuarioId.value = payload?.sub ?? null
  if (!usuarioId.value) return router.replace('/checkout')

  const primerDia = diasOpciones.value.find((d) => d.disponible)
  if (primerDia) diaSeleccionado.value = primerDia.iso
})

onUnmounted(() => {
  if (mapInstance) mapInstance.remove()
})

// ── Envío del pedido ──────────────────────────────────────────────────────────
async function uploadComprobante(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await http.post(EP_UPLOADS, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data?.url || data?.path || ''
}

async function confirmarPedido() {
  if (!usuarioId.value) return router.replace('/checkout')
  if (!envio.value.direccion.trim()) return alert('Por favor, ingresa una dirección válida.')
  if (carrito.value.length === 0) {
    alert('Tu carrito está vacío.')
    return router.push('/carrito')
  }
  if (!fechaEntregaFinal.value) return alert('Por favor, selecciona fecha y hora de entrega.')
  if (!pago.value.comprobanteFile)
    return alert('Debes subir la foto o documento de tu comprobante QR.')

  enviandoPedido.value = true

  try {
    // 1. Subir comprobante
    const comprobanteUrl = await uploadComprobante(pago.value.comprobanteFile)

    // 2. Registrar cabecera del pedido (con latitud y longitud)
    const { data: pedido } = await http.post(EP_PEDIDOS, {
      idUsuario: usuarioId.value,
      fechaEntrega: fechaEntregaFinal.value,
      total: Number(totalCarrito()),
      estado: 'pendiente',
      direccionEnvio: envio.value.direccion,
      referencia: envio.value.referencia,
      tipoEnvio: envio.value.tipoEnvio,
      metodoPago: 'qr',
      latitud: coordenadas.value?.lat ?? null,
      longitud: coordenadas.value?.lng ?? null,
    })

    // 3. Registrar detalles en paralelo
    await Promise.all(
      carrito.value.map((item) =>
        http.post(EP_DETALLES, {
          idPedido: pedido.id,
          idProducto: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: Number(item.producto.precio),
        }),
      ),
    )

    // 4. Registrar pago
    await http.post(EP_PAGOS, {
      idPedido: pedido.id,
      metodo: 'qr',
      monto: Number(totalCarrito()),
      estado: 'pendiente',
      comprobante: comprobanteUrl,
    })

    // 5. Guardar en localStorage y limpiar
    localStorage.setItem(
      'ultimoPedido',
      JSON.stringify({
        id: pedido.id,
        total: Number(totalCarrito()),
        metodoPago: 'qr',
        estado: 'pendiente',
        fecha: new Date().toISOString(),
      }),
    )

    vaciarCarrito()
    router.push('/checkout/gracias')
  } catch (e: any) {
    console.error('Error procesando el pedido:', e)
    alert(
      e?.response?.data?.message ||
        'Hubo un problema al procesar tu solicitud. Inténtalo de nuevo.',
    )
  } finally {
    enviandoPedido.value = false
  }
}
</script>

<template>
  <section class="checkout-page">
    <div class="container">
      <!-- ── Header ─────────────────────────────────────────────────────────── -->
      <div class="page-header">
        <span class="section-tag">Pago Seguro</span>
        <h2 class="page-titulo">Confirma tu pedido</h2>
        <p class="page-subtitulo">Solo unos pasos más para recibir tus delicias 🍰</p>
      </div>

      <!-- ── Barra de pasos ──────────────────────────────────────────────────── -->
      <div class="steps-bar">
        <div class="step done">
          <span class="step-dot"><i class="pi pi-shopping-cart"></i></span>
          <span class="step-label">Carrito</span>
        </div>
        <div class="step-line done"></div>
        <div class="step active">
          <span class="step-dot"><i class="pi pi-truck"></i></span>
          <span class="step-label">Entrega</span>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <span class="step-dot"><i class="pi pi-check"></i></span>
          <span class="step-label">Listo</span>
        </div>
      </div>

      <!-- ── Layout principal ────────────────────────────────────────────────── -->
      <div class="checkout-layout">
        <!-- Formulario -->
        <div class="formulario-card">
          <form @submit.prevent="confirmarPedido" novalidate>
            <!-- ── Sección 1: Fecha y hora ───────────────────────────────────── -->
            <div class="form-seccion">
              <div class="seccion-header">
                <span class="seccion-numero">1</span>
                <div>
                  <h4 class="seccion-titulo">¿Cuándo lo recibes?</h4>
                  <p class="seccion-desc">
                    Mínimo 2 días hábiles para preparar tu pedido con amor 🍰
                  </p>
                </div>
              </div>

              <!-- Selector de días -->
              <div class="dias-selector">
                <div
                  v-for="dia in diasOpciones"
                  :key="dia.iso"
                  class="dia-chip"
                  :class="{ activo: diaSeleccionado === dia.iso, inactivo: !dia.disponible }"
                  @click="dia.disponible && (diaSeleccionado = dia.iso)"
                >
                  <span class="dia-nombre">{{ dia.label }}</span>
                  <span class="dia-numero">{{ dia.numero }}</span>
                  <span class="dia-mes">{{ dia.mes }}</span>
                </div>
              </div>

              <!-- Selector de horas -->
              <div v-if="diaSeleccionado" class="horas-selector">
                <p class="horas-label"><i class="pi pi-clock"></i> Elige un horario</p>
                <div class="horas-grid">
                  <button
                    v-for="hora in HORAS_DISPONIBLES"
                    :key="hora"
                    type="button"
                    class="hora-chip"
                    :class="{ activo: horaSeleccionada === hora }"
                    @click="horaSeleccionada = hora"
                  >
                    {{ hora }}
                  </button>
                </div>
              </div>

              <!-- Confirmación visual -->
              <div v-if="fechaEntregaFinal" class="fecha-confirmada">
                <i class="pi pi-calendar-check"></i>
                <span>
                  Entrega el
                  <strong>
                    {{
                      new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-BO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    }}
                  </strong>
                  a las <strong>{{ horaSeleccionada }} hrs</strong>
                </span>
              </div>
            </div>

            <div class="seccion-divider"></div>

            <!-- ── Sección 2: Dirección ──────────────────────────────────────── -->
            <div class="form-seccion">
              <div class="seccion-header">
                <span class="seccion-numero">2</span>
                <div>
                  <h4 class="seccion-titulo">¿Dónde te lo enviamos?</h4>
                  <p class="seccion-desc">Ingresa tu dirección o marca en el mapa</p>
                </div>
              </div>

              <div class="field-row">
                <div class="field">
                  <label class="field-label" for="dir">Dirección <span class="req">*</span></label>
                  <div class="input-wrap">
                    <i class="pi pi-map-marker input-icon"></i>
                    <input
                      id="dir"
                      v-model="envio.direccion"
                      type="text"
                      class="field-input has-icon"
                      placeholder="Calle, número, zona..."
                      required
                    />
                  </div>
                </div>
                <div class="field">
                  <label class="field-label" for="ref">Referencia</label>
                  <div class="input-wrap">
                    <i class="pi pi-info-circle input-icon"></i>
                    <input
                      id="ref"
                      v-model="envio.referencia"
                      type="text"
                      class="field-input has-icon"
                      placeholder="Casa verde, portón negro..."
                    />
                  </div>
                </div>
              </div>

              <!-- Botón abrir mapa -->
              <button type="button" class="btn-mapa" @click="abrirMapa">
                <i class="pi pi-map"></i>
                <span>{{
                  coordenadas ? 'Cambiar ubicación en el mapa' : 'Seleccionar ubicación en el mapa'
                }}</span>
                <span v-if="coordenadas" class="coordenadas-badge">
                  <i class="pi pi-check-circle"></i> Guardada
                </span>
              </button>

              <!-- Preview coordenadas -->
              <div v-if="coordenadas" class="coords-preview">
                <i class="pi pi-map-marker"></i>
                <span>
                  <strong
                    >{{ coordenadas.lat.toFixed(5) }}, {{ coordenadas.lng.toFixed(5) }}</strong
                  >
                  <template v-if="direccionReversa">
                    — {{ direccionReversa.split(',').slice(0, 2).join(',') }}
                  </template>
                </span>
              </div>

              <!-- Tipo de envío -->
              <div class="tipo-envio-group">
                <label
                  class="tipo-card"
                  :class="{ activo: envio.tipoEnvio === 'domicilio' }"
                  @click="envio.tipoEnvio = 'domicilio'"
                >
                  <span class="tipo-icon">🚚</span>
                  <div>
                    <p class="tipo-nombre">Envío a domicilio</p>
                    <p class="tipo-desc">Lo llevamos a tu puerta</p>
                  </div>
                  <span v-if="envio.tipoEnvio === 'domicilio'" class="tipo-check">
                    <i class="pi pi-check-circle"></i>
                  </span>
                </label>
                <label
                  class="tipo-card"
                  :class="{ activo: envio.tipoEnvio === 'local' }"
                  @click="envio.tipoEnvio = 'local'"
                >
                  <span class="tipo-icon">🏪</span>
                  <div>
                    <p class="tipo-nombre">Recoger en local</p>
                    <p class="tipo-desc">Pasa por la tienda</p>
                  </div>
                  <span v-if="envio.tipoEnvio === 'local'" class="tipo-check">
                    <i class="pi pi-check-circle"></i>
                  </span>
                </label>
              </div>
            </div>

            <div class="seccion-divider"></div>

            <!-- ── Sección 3: Pago QR ────────────────────────────────────────── -->
            <div class="form-seccion">
              <div class="seccion-header">
                <span class="seccion-numero">3</span>
                <div>
                  <h4 class="seccion-titulo">Pago mediante QR</h4>
                  <p class="seccion-desc">Escanea y sube tu comprobante desde Simple</p>
                </div>
              </div>

              <div class="box-pago">
                <div class="qr-side">
                  <div class="qr-frame">
                    <img :src="qrImage" alt="QR Simple Pago" class="qr-img" />
                  </div>
                  <span class="qr-badge">Simple</span>
                </div>

                <div class="comprobante-side">
                  <p class="comprobante-titulo">Sube tu comprobante <span class="req">*</span></p>
                  <p class="comprobante-desc">Foto de pantalla o PDF de la transferencia</p>

                  <label class="upload-area" :class="{ 'tiene-archivo': pago.comprobanteFile }">
                    <div v-if="!pago.comprobanteFile" class="upload-placeholder">
                      <i class="pi pi-cloud-upload upload-icon"></i>
                      <span>Seleccionar archivo</span>
                      <small>JPG, PNG, PDF</small>
                    </div>
                    <div v-else class="upload-preview">
                      <i class="pi pi-file-check"></i>
                      <span>{{ pago.comprobanteFile.name }}</span>
                      <button
                        type="button"
                        class="remove-file"
                        @click.prevent="pago.comprobanteFile = null"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      class="file-hidden"
                      @change="
                        (e) =>
                          (pago.comprobanteFile = (e.target as HTMLInputElement).files?.[0] || null)
                      "
                    />
                  </label>
                </div>
              </div>
            </div>

            <!-- Botón confirmar -->
            <button class="btn-confirmar" type="submit" :disabled="enviandoPedido">
              <span v-if="enviandoPedido">
                <i class="pi pi-spin pi-spinner"></i> Procesando tu pedido...
              </span>
              <span v-else>🍰 Confirmar pedido · Bs. {{ subtotal }}</span>
            </button>
          </form>
        </div>

        <!-- ── Resumen lateral ──────────────────────────────────────────────── -->
        <aside class="resumen-card">
          <h5 class="resumen-titulo">Tu pedido</h5>

          <div class="resumen-lista">
            <div v-for="item in carrito" :key="item.producto.id" class="resumen-item">
              <img :src="item.producto.imagenUrl" alt="Producto" class="resumen-img" />
              <div class="resumen-info">
                <p class="resumen-nombre">{{ item.producto.nombre }}</p>
                <span class="resumen-qty">× {{ item.cantidad }}</span>
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
            <div class="total-linea"><span>Envío</span><span class="gratis">🎁 Gratis</span></div>
            <div class="total-linea total-final">
              <strong>Total</strong>
              <strong class="monto-final">Bs. {{ subtotal }}</strong>
            </div>
          </div>

          <RouterLink to="/carrito" class="volver-link">
            <i class="pi pi-arrow-left"></i> Volver al carrito
          </RouterLink>
        </aside>
      </div>
    </div>

    <!-- ── Modal del mapa ────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="mapaVisible" class="modal-overlay" @click.self="cerrarMapa">
          <div class="modal-mapa">
            <div class="modal-header">
              <div>
                <h3 class="modal-titulo"><i class="pi pi-map"></i> Selecciona tu ubicación</h3>
                <p class="modal-desc">Haz clic en el mapa o arrastra el marcador para ajustar</p>
              </div>
              <button class="modal-close" type="button" @click="cerrarMapa">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <div class="mapa-container">
              <div id="mapa-leaflet"></div>

              <!-- Botón GPS flotante -->
              <button
                type="button"
                class="btn-gps"
                @click="usarUbicacionActual"
                :disabled="buscandoUbicacion"
              >
                <i :class="buscandoUbicacion ? 'pi pi-spin pi-spinner' : 'pi pi-crosshairs'"></i>
                {{ buscandoUbicacion ? 'Localizando...' : 'Mi ubicación' }}
              </button>
            </div>

            <div class="modal-footer">
              <div class="direccion-detectada">
                <i class="pi pi-map-marker"></i>
                <span v-if="coordenadas && direccionReversa" class="dir-texto">
                  {{ direccionReversa.split(',').slice(0, 3).join(',') }}
                </span>
                <span v-else-if="coordenadas" class="dir-coords">
                  {{ coordenadas.lat.toFixed(6) }}, {{ coordenadas.lng.toFixed(6) }}
                </span>
                <span v-else class="dir-placeholder">Haz clic en el mapa para seleccionar</span>
              </div>

              <button
                type="button"
                class="btn-confirmar-ubicacion"
                :disabled="!coordenadas"
                @click="confirmarUbicacion"
              >
                <i class="pi pi-check"></i> Confirmar ubicación
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
/* ── Variables ──────────────────────────────────────────────────────────────── */
:root {
  --pink: #e91e8c;
  --pink-dark: #c2185b;
  --pink-deep: #880e4f;
  --pink-light: #fce4ec;
  --pink-mid: #f8bbd0;
}

/* ── Base ───────────────────────────────────────────────────────────────────── */
.checkout-page {
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 50%, #fff 100%);
  padding: 1.25rem 1rem 2rem;
  min-height: 80vh;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.page-header {
  margin-bottom: 0.85rem;
}

.section-tag {
  display: inline-block;
  background: #fce4ec;
  color: #e91e8c;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 0.28rem 0.9rem;
  border-radius: 50px;
  margin-bottom: 0.5rem;
}

.page-titulo {
  font-size: clamp(1.3rem, 3vw, 1.75rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.15rem;
  line-height: 1.2;
}

.page-subtitulo {
  font-size: 0.9rem;
  color: #999;
  margin: 0;
}

/* ── Steps bar ──────────────────────────────────────────────────────────────── */
.steps-bar {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0.85rem 1.25rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #fce4ec;
  box-shadow: 0 2px 12px rgba(233, 30, 140, 0.06);
}

.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  background: #f5f5f5;
  color: #bbb;
  border: 2px solid #eee;
  transition: all 0.3s;
}

.step.done .step-dot {
  background: #fce4ec;
  color: #e91e8c;
  border-color: #f48fb1;
}

.step.active .step-dot {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-color: #e91e8c;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.3);
}

.step-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #ccc;
}
.step.done .step-label {
  color: #e91e8c;
}
.step.active .step-label {
  color: #880e4f;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #eee;
  margin: 0 0.75rem;
}
.step-line.done {
  background: linear-gradient(90deg, #f48fb1, #e91e8c);
}

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px; /* evita que la columna principal desborde */
  gap: 1.5rem;
  align-items: start;
  margin: 0 auto;
  justify-content: center; /* centra la grid dentro del contenedor si hay espacio */
}

/* ── Formulario card ────────────────────────────────────────────────────────── */
.formulario-card {
  background: white;
  border-radius: 24px;
  padding: 1.35rem;
  box-shadow: 0 4px 24px rgba(233, 30, 140, 0.07);
  border: 1px solid #fce4ec;
}

.form-seccion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.seccion-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.seccion-numero {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(233, 30, 140, 0.3);
}

.seccion-titulo {
  font-size: 0.95rem;
  font-weight: 700;
  color: #880e4f;
  margin: 0 0 0.1rem;
}

.seccion-desc {
  font-size: 0.75rem;
  color: #999;
  margin: 0;
}

.seccion-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #fce4ec, transparent);
  margin: 0.35rem 0;
}

/* ── Selector de días ───────────────────────────────────────────────────────── */
.dias-selector {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.dias-selector::-webkit-scrollbar {
  display: none;
}

.dia-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 55px;
  padding: 0.6rem 0.35rem;
  border-radius: 14px;
  border: 1.5px solid #fce4ec;
  background: #fff9fb;
  cursor: pointer;
  transition: all 0.2s;
  scroll-snap-align: start;
  flex-shrink: 0;
  gap: 0.1rem;
  user-select: none;
}

.dia-chip:hover:not(.inactivo) {
  border-color: #f48fb1;
  background: #fce4ec;
}

.dia-chip.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
}

.dia-chip.inactivo {
  opacity: 0.35;
  cursor: not-allowed;
}

.dia-nombre {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #aaa;
}
.dia-numero {
  font-size: 1.2rem;
  font-weight: 800;
  color: #880e4f;
  line-height: 1;
}
.dia-mes {
  font-size: 0.65rem;
  color: #bbb;
  font-weight: 500;
}

.dia-chip.activo .dia-nombre,
.dia-chip.activo .dia-numero,
.dia-chip.activo .dia-mes {
  color: white;
}

/* ── Selector de horas ──────────────────────────────────────────────────────── */
.horas-selector {
  background: #fff9fb;
  border: 1.5px solid #fce4ec;
  border-radius: 14px;
  padding: 0.85rem;
}

.horas-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #c2185b;
  margin: 0 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.horas-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hora-chip {
  padding: 0.4rem 0.85rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #c2185b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}

.hora-chip:hover {
  background: #fce4ec;
  border-color: #e91e8c;
}

.hora-chip.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: white;
  box-shadow: 0 3px 10px rgba(233, 30, 140, 0.25);
}

/* ── Confirmación de fecha ──────────────────────────────────────────────────── */
.fecha-confirmada {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #fce4ec, #fff9fb);
  border: 1.5px solid #f48fb1;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #880e4f;
}

.fecha-confirmada i {
  color: #e91e8c;
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* ── Campos de texto ────────────────────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #880e4f;
  letter-spacing: 0.2px;
}

.req {
  color: #e91e8c;
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.85rem;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #333;
  outline: none;
  background: #fff9fb;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}

.field-input.has-icon {
  padding-left: 2.35rem;
}

.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
  background: white;
}

/* ── Botón abrir mapa ───────────────────────────────────────────────────────── */
.btn-mapa {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.8rem 1.1rem;
  background: #fff9fb;
  border: 1.5px dashed #f48fb1;
  border-radius: 12px;
  color: #c2185b;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mapa:hover {
  background: #fff0f7;
  border-color: #e91e8c;
}

.coordenadas-badge {
  margin-left: auto;
  font-size: 0.75rem;
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* ── Preview coordenadas ────────────────────────────────────────────────────── */
.coords-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  background: #f1f8e9;
  border: 1px solid #c8e6c9;
  border-radius: 10px;
  font-size: 0.78rem;
  color: #2e7d32;
}

.coords-preview i {
  flex-shrink: 0;
}

/* ── Tipo de envío ──────────────────────────────────────────────────────────── */
.tipo-envio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.tipo-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1.5px solid #fce4ec;
  background: #fff9fb;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tipo-card:hover {
  border-color: #f48fb1;
}

.tipo-card.activo {
  border-color: #e91e8c;
  background: #fff0f7;
  box-shadow: 0 3px 12px rgba(233, 30, 140, 0.12);
}

.tipo-icon {
  font-size: 1.4rem;
}

.tipo-nombre {
  font-size: 0.82rem;
  font-weight: 700;
  color: #880e4f;
  margin: 0 0 0.1rem;
}
.tipo-desc {
  font-size: 0.72rem;
  color: #aaa;
  margin: 0;
}

.tipo-check {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  color: #e91e8c;
  font-size: 0.9rem;
}

/* ── Box de pago QR ─────────────────────────────────────────────────────────── */
.box-pago {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  background: #fff9fb;
  border: 1.5px solid #fce4ec;
  border-radius: 16px;
  padding: 1.1rem;
}

.qr-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.qr-frame {
  padding: 0.6rem;
  background: white;
  border-radius: 12px;
  border: 1.5px solid #fce4ec;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.1);
}

.qr-img {
  width: 110px;
  height: 110px;
  display: block;
  border-radius: 6px;
}

.qr-badge {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.75rem;
  border-radius: 50px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.comprobante-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.comprobante-titulo {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.9rem;
  margin: 0;
}
.comprobante-desc {
  font-size: 0.78rem;
  color: #aaa;
  margin: 0 0 0.4rem;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.1rem;
  border: 2px dashed #f48fb1;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  text-align: center;
  min-height: 90px;
}

.upload-area:hover {
  background: #fff0f7;
  border-color: #e91e8c;
}

.upload-area.tiene-archivo {
  border-style: solid;
  border-color: #e91e8c;
  background: #fff0f7;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #e91e8c;
}
.upload-icon {
  font-size: 1.6rem;
}
.upload-placeholder span {
  font-size: 0.82rem;
  font-weight: 600;
  color: #c2185b;
}
.upload-placeholder small {
  font-size: 0.7rem;
  color: #ccc;
}

.upload-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e91e8c;
  font-size: 0.82rem;
  font-weight: 600;
  width: 100%;
}

.upload-preview i {
  font-size: 1.2rem;
  flex-shrink: 0;
}
.upload-preview span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.remove-file {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 0.2rem;
  flex-shrink: 0;
  font-size: 0.8rem;
}

.remove-file:hover {
  color: #e91e8c;
}

.file-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

/* ── Botón confirmar pedido ─────────────────────────────────────────────────── */
.btn-confirmar {
  width: 100%;
  margin-top: 1.25rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.85rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(233, 30, 140, 0.35);
  transition:
    opacity 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
  letter-spacing: 0.2px;
}

.btn-confirmar:hover:not(:disabled) {
  opacity: 0.93;
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(233, 30, 140, 0.4);
}

.btn-confirmar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Resumen lateral ────────────────────────────────────────────────────────── */
.resumen-card {
  background: white;
  border-radius: 24px;
  padding: 1.15rem;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  border: 1px solid #fce4ec;
  position: sticky;
  top: 1rem;
}

.resumen-titulo {
  font-weight: 800;
  color: #880e4f;
  font-size: 1rem;
  margin: 0 0 0.9rem;
}

.resumen-lista {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #f8bbd0 transparent;
}

.resumen-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem;
  background: #fff9fb;
  border-radius: 12px;
  border: 1px solid #fce4ec;
}

.resumen-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid #fce4ec;
}

.resumen-info {
  flex: 1;
  min-width: 0;
}

.resumen-nombre {
  font-weight: 600;
  color: #880e4f;
  font-size: 0.84rem;
  margin: 0 0 0.12rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resumen-qty {
  font-size: 0.75rem;
  color: #bbb;
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
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.45rem;
}

.gratis {
  color: #2e7d32;
  font-weight: 600;
}

.total-final {
  font-size: 1.05rem;
  color: #880e4f;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #fce4ec;
}

.monto-final {
  color: #e91e8c;
}

.volver-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.85rem;
  color: #e91e8c;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.volver-link:hover {
  opacity: 0.7;
}

/* ── Modal overlay ──────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(136, 14, 79, 0.35);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-mapa {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(136, 14, 79, 0.25);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #fce4ec;
}

.modal-titulo {
  font-size: 1rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-desc {
  font-size: 0.78rem;
  color: #aaa;
  margin: 0;
}

.modal-close {
  background: #fce4ec;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c2185b;
  font-size: 0.85rem;
  flex-shrink: 0;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f8bbd0;
}

/* ── Mapa Leaflet ───────────────────────────────────────────────────────────── */
.mapa-container {
  position: relative;
  flex: 1;
}

#mapa-leaflet {
  width: 100%;
  height: 380px;
}

.btn-gps {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  background: white;
  border: 1.5px solid #f48fb1;
  border-radius: 50px;
  color: #e91e8c;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.btn-gps:hover:not(:disabled) {
  background: #fce4ec;
  border-color: #e91e8c;
}
.btn-gps:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Footer modal ───────────────────────────────────────────────────────────── */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #fce4ec;
  background: #fff9fb;
}

.direccion-detectada {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  flex: 1;
  min-width: 0;
  color: #880e4f;
}

.dir-texto,
.dir-coords {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dir-placeholder {
  color: #bbb;
  font-style: italic;
}

.btn-confirmar-ubicacion {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.4rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition:
    opacity 0.2s,
    transform 0.2s;
  flex-shrink: 0;
}

.btn-confirmar-ubicacion:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-confirmar-ubicacion:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Transición modal ───────────────────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .modal-mapa,
.modal-fade-leave-active .modal-mapa {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-mapa,
.modal-fade-leave-to .modal-mapa {
  transform: translateY(20px);
  opacity: 0;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
  .resumen-card {
    position: static;
  }
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }
  .tipo-envio-group {
    grid-template-columns: 1fr;
  }
  .box-pago {
    flex-direction: column;
  }
  .steps-bar {
    padding: 0.75rem 1rem;
  }
  .formulario-card {
    padding: 1.25rem;
  }
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-confirmar-ubicacion {
    justify-content: center;
  }
  #mapa-leaflet {
    height: 300px;
  }
}
</style>
