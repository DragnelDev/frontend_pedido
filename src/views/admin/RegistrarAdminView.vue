<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// ─────────────────────────────────────────────────────────────────────────────
// Tipos (alineados al DER)
// ─────────────────────────────────────────────────────────────────────────────
type Producto = {
  id: number
  nombre: string
  precio: number
  stock: number
  imagenUrl?: string
  categoria?: { nombre: string }
}

type ItemVenta = {
  producto: Producto
  cantidad: number
}

// Alineado a tabla `clientes` del DER
type Cliente = {
  id?: number
  cedulaIdentidad: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  celular: string
  email: string
  direccion: string
}

// Modos de la vista
type ModoVenta = 'mostrador' | 'domicilio'

// ─────────────────────────────────────────────────────────────────────────────
// Estado principal
// ─────────────────────────────────────────────────────────────────────────────
const productos = ref<Producto[]>([])
const carrito = ref<ItemVenta[]>([])
const busqueda = ref('')
const procesando = ref(false)
const ventaExitosa = ref<number | null>(null)
const usuarioId = ref<number | null>(null)

// Modo: mostrador (entrega inmediata) o domicilio (pedido con delivery)
const modoVenta = ref<ModoVenta>('mostrador')

// Método de pago (tabla `pagos`: metodo)
const metodo = ref<'efectivo' | 'qr' | 'transferencia' | 'tarjeta'>('efectivo')

// Datos de pago extra — tabla `pagos`: comprobante, masked_card
const comprobante = ref('')
const maskedCard = ref('')

// Nota interna (va a `pedidos.referencia`)
const notaVenta = ref('')

// ─────────────────────────────────────────────────────────────────────────────
// Cliente — tabla `clientes`
// ─────────────────────────────────────────────────────────────────────────────
const clienteBuscado = ref(false)
const cliente = ref<Cliente>({
  cedulaIdentidad: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  celular: '',
  email: '',
  direccion: '',
})

// ─────────────────────────────────────────────────────────────────────────────
// Envío — tabla `pedidos`: tipo_envio, direccion_envio, referencia, latitud, longitud
// ─────────────────────────────────────────────────────────────────────────────
const envio = ref({
  tipoEnvio: 'retiroTienda' as 'retiroTienda' | 'delivery' | 'express',
  direccionEnvio: 'Sucursal Principal — Berry Sweet',
  referencia: '',
})

// ─────────────────────────────────────────────────────────────────────────────
// Selector de fecha para domicilio (mínimo hoy + 0h para domicilio inmediato)
// ─────────────────────────────────────────────────────────────────────────────
interface DiaOpcion {
  iso: string
  label: string
  numero: number
  mes: string
  disponible: boolean
}

const HORAS_DISPONIBLES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']
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

const diasOpciones = computed<DiaOpcion[]>(() => {
  const hoy = new Date()
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      iso,
      label: DIAS_LABEL[d.getDay()],
      numero: d.getDate(),
      mes: MESES_LABEL[d.getMonth()],
      disponible: true,
    }
  })
})

const diaSeleccionado = ref('')
const horaSeleccionada = ref('')

const fechaEntregaFinal = computed(() =>
  diaSeleccionado.value && horaSeleccionada.value
    ? `${diaSeleccionado.value}T${horaSeleccionada.value}:00Z`
    : '',
)

// ─────────────────────────────────────────────────────────────────────────────
// Mapa Leaflet — latitud / longitud para tabla `pedidos`
// ─────────────────────────────────────────────────────────────────────────────
const mapaVisible = ref(false)
const coordenadas = ref<{ lat: number; lng: number } | null>(null)
const buscandoGPS = ref(false)
const direccionReversa = ref('')

let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null
const CENTRO_DEFAULT: L.LatLngTuple = [-19.0477, -65.2594] // Sucre, Bolivia

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
  const el = document.getElementById('mapa-venta')
  if (!el || mapInstance) return
  const centro: L.LatLngTuple = coordenadas.value
    ? [coordenadas.value.lat, coordenadas.value.lng]
    : CENTRO_DEFAULT
  mapInstance = L.map('mapa-venta').setView(centro, 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(mapInstance)
  if (coordenadas.value) colocarPin(coordenadas.value.lat, coordenadas.value.lng)
  mapInstance.on('click', (e: L.LeafletMouseEvent) => {
    colocarPin(e.latlng.lat, e.latlng.lng)
    geocodificarReverso(e.latlng.lat, e.latlng.lng)
  })
}

function colocarPin(lat: number, lng: number) {
  if (!mapInstance) return
  if (markerInstance) {
    markerInstance.setLatLng([lat, lng])
  } else {
    markerInstance = L.marker([lat, lng], { draggable: true }).addTo(mapInstance)
    markerInstance.on('dragend', () => {
      const p = markerInstance!.getLatLng()
      coordenadas.value = { lat: p.lat, lng: p.lng }
      geocodificarReverso(p.lat, p.lng)
    })
  }
  coordenadas.value = { lat, lng }
  mapInstance.panTo([lat, lng])
}

async function geocodificarReverso(lat: number, lng: number) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
    )
    const d = await r.json()
    if (d?.display_name) {
      direccionReversa.value = d.display_name
      if (
        !envio.value.direccionEnvio ||
        envio.value.direccionEnvio === 'Sucursal Principal — Berry Sweet'
      ) {
        envio.value.direccionEnvio = d.address?.road
          ? `${d.address.road}${d.address.house_number ? ' ' + d.address.house_number : ''}`
          : d.display_name.split(',')[0]
      }
    }
  } catch {
    direccionReversa.value = ''
  }
}

function usarGPS() {
  if (!navigator.geolocation) return alert('Geolocalización no disponible.')
  buscandoGPS.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      colocarPin(pos.coords.latitude, pos.coords.longitude)
      geocodificarReverso(pos.coords.latitude, pos.coords.longitude)
      mapInstance?.setView([pos.coords.latitude, pos.coords.longitude], 17)
      buscandoGPS.value = false
    },
    () => {
      alert('No se pudo obtener ubicación.')
      buscandoGPS.value = false
    },
  )
}

function confirmarUbicacion() {
  if (!coordenadas.value) return alert('Selecciona un punto en el mapa.')
  cerrarMapa()
}

onUnmounted(() => {
  if (mapInstance) mapInstance.remove()
})

// ─────────────────────────────────────────────────────────────────────────────
// Montaje
// ─────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const token = getTokenFromLocalStorage()
  if (token) usuarioId.value = Number(parseJwt(token)?.sub)

  // Pre-seleccionar hoy como fecha de entrega
  const hoy = new Date()
  diaSeleccionado.value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  horaSeleccionada.value = HORAS_DISPONIBLES[0]

  await cargarProductos()
})

// ─────────────────────────────────────────────────────────────────────────────
// Productos
// ─────────────────────────────────────────────────────────────────────────────
async function cargarProductos() {
  try {
    const { data } = await http.get('/productos')
    productos.value = data
  } catch (e) {
    console.error(e)
  }
}

const productosFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase()
  return productos.value.filter(
    (p) => p.nombre.toLowerCase().includes(q) || p.categoria?.nombre?.toLowerCase().includes(q),
  )
})

function agregarAlCarrito(p: Producto) {
  const item = carrito.value.find((i) => i.producto.id === p.id)
  if (item) {
    if (item.cantidad < p.stock) item.cantidad++
  } else carrito.value.push({ producto: p, cantidad: 1 })
}

function quitarItem(id: number) {
  carrito.value = carrito.value.filter((i) => i.producto.id !== id)
}

function cambiarCantidad(id: number, delta: number) {
  const item = carrito.value.find((i) => i.producto.id === id)
  if (!item) return
  const nueva = item.cantidad + delta
  if (nueva <= 0) {
    quitarItem(id)
    return
  }
  if (nueva > item.producto.stock) return
  item.cantidad = nueva
}

const total = computed(() => carrito.value.reduce((s, i) => s + i.producto.precio * i.cantidad, 0))

// ─────────────────────────────────────────────────────────────────────────────
// Búsqueda de cliente por CI
// ─────────────────────────────────────────────────────────────────────────────
async function buscarCliente(source: 'ci' | 'email' = 'ci') {
  const ci = cliente.value.cedulaIdentidad.trim()
  const email = cliente.value.email.trim()
  const valor = source === 'email' ? email : ci
  if (!valor) return

  try {
    const { data } = await http.get(`/clientes/buscar?q=${encodeURIComponent(valor)}`)
    cliente.value = data
    clienteBuscado.value = true
  } catch {
    clienteBuscado.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Watcher de modo: ajusta defaults al cambiar modo
// ─────────────────────────────────────────────────────────────────────────────
function cambiarModo(modo: ModoVenta) {
  modoVenta.value = modo
  if (modo === 'mostrador') {
    envio.value.tipoEnvio = 'retiroTienda'
    envio.value.direccionEnvio = 'Sucursal Principal — Berry Sweet'
    metodo.value = 'efectivo'
  } else {
    envio.value.tipoEnvio = 'delivery'
    envio.value.direccionEnvio = cliente.value.direccion || ''
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmar venta — construye payload según DER
// ─────────────────────────────────────────────────────────────────────────────
async function confirmarVenta() {
  if (!usuarioId.value) return alert('Usuario no identificado. Inicia sesión.')
  if (carrito.value.length === 0) return alert('Agrega al menos un producto.')
  if (modoVenta.value === 'domicilio' && !fechaEntregaFinal.value)
    return alert('Selecciona fecha y hora de entrega.')
  if ((metodo.value === 'qr' || metodo.value === 'transferencia') && !comprobante.value)
    return alert('Ingresa el número de comprobante.')
  if (metodo.value === 'tarjeta' && maskedCard.value.length !== 4)
    return alert('Ingresa los últimos 4 dígitos de la tarjeta.')

  procesando.value = true

  try {
    // 1. Crear o actualizar cliente (tabla `clientes`)
    let clienteId: number | null = null
    if (cliente.value.cedulaIdentidad && cliente.value.nombre) {
      if (cliente.value.id) {
        // cliente ya existía — usar su id directamente
        clienteId = cliente.value.id
      } else {
        const { data: clienteCreado } = await http.post('/clientes', {
          cedulaIdentidad: cliente.value.cedulaIdentidad,
          nombre: cliente.value.nombre,
          apellidoPaterno: cliente.value.apellidoPaterno,
          apellidoMaterno: cliente.value.apellidoMaterno,
          celular: cliente.value.celular,
          email: cliente.value.email,
          direccion: cliente.value.direccion,
        })
        clienteId = clienteCreado.id
      }
    }

    // 2. Crear pedido (tabla `pedidos`)
    const { data: pedido } = await http.post('/pedidos', {
      idUsuario: usuarioId.value,
      idCliente: clienteId,
      fechaEntrega:
        modoVenta.value === 'mostrador' ? new Date().toISOString() : fechaEntregaFinal.value,
      total: total.value,
      estado: modoVenta.value === 'mostrador' ? 'entregado' : 'pendiente',
      direccionEnvio:
        modoVenta.value === 'mostrador'
          ? 'Sucursal Principal — Berry Sweet'
          : envio.value.direccionEnvio,
      referencia: notaVenta.value || envio.value.referencia,
      tipoEnvio: envio.value.tipoEnvio,
      latitud: coordenadas.value?.lat ?? null,
      longitud: coordenadas.value?.lng ?? null,
      metodoPago: metodo.value,
    })

    // 3. Crear detalles (tabla `detalle_pedidos`)
    await Promise.all(
      carrito.value.map((item) =>
        http.post('/detalle-pedidos', {
          idPedido: pedido.id,
          idProducto: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
        }),
      ),
    )

    // 4. Registrar pago (tabla `pagos`)
    await http.post('/pagos', {
      idPedido: pedido.id,
      metodo: metodo.value,
      monto: total.value,
      estado: modoVenta.value === 'mostrador' ? 'aprobado' : 'pendiente',
      comprobante:
        metodo.value === 'qr' || metodo.value === 'transferencia' ? comprobante.value : '',
      maskedCard: metodo.value === 'tarjeta' ? `****${maskedCard.value}` : '',
    })

    ventaExitosa.value = pedido.id
    await cargarProductos()
  } catch (e: any) {
    console.error(e)
    alert(e?.response?.data?.message || 'Error al registrar la venta.')
  } finally {
    procesando.value = false
  }
}

function limpiarVenta() {
  carrito.value = []
  metodo.value = 'efectivo'
  notaVenta.value = ''
  comprobante.value = ''
  maskedCard.value = ''
  coordenadas.value = null
  direccionReversa.value = ''
  clienteBuscado.value = false
  envio.value = {
    tipoEnvio: modoVenta.value === 'mostrador' ? 'retiroTienda' : 'delivery',
    direccionEnvio: modoVenta.value === 'mostrador' ? 'Sucursal Principal — Berry Sweet' : '',
    referencia: '',
  }
  cliente.value = {
    cedulaIdentidad: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    celular: '',
    email: '',
    direccion: '',
  }
  ventaExitosa.value = null
}

function fmtBs(v: number) {
  return Number(v).toFixed(2)
}

const labelModo: Record<ModoVenta, string> = {
  mostrador: 'Venta en mostrador',
  domicilio: 'Pedido a domicilio',
}
</script>

<template>
  <section class="admin-wrap">
    <div class="container">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="page-header">
        <span class="section-tag">Punto de venta</span>
        <h2 class="page-titulo">Registrar Venta</h2>
        <p class="page-sub">Venta directa en mostrador o pedido a domicilio</p>
      </div>

      <!-- ── Selector de modo ────────────────────────────────────────────── -->
      <div class="modo-selector">
        <button
          class="modo-btn"
          :class="{ activo: modoVenta === 'mostrador' }"
          @click="cambiarModo('mostrador')"
        >
          <span class="modo-icon">🏪</span>
          <div class="modo-texto">
            <strong>Mostrador</strong>
            <small>Entrega inmediata · estado: entregado</small>
          </div>
        </button>
        <button
          class="modo-btn"
          :class="{ activo: modoVenta === 'domicilio' }"
          @click="cambiarModo('domicilio')"
        >
          <span class="modo-icon">🚚</span>
          <div class="modo-texto">
            <strong>Domicilio</strong>
            <small>Pedido con delivery · estado: pendiente</small>
          </div>
        </button>
      </div>

      <!-- ── Resultado venta exitosa ─────────────────────────────────────── -->
      <Transition name="slide-fade" mode="out-in">
        <div v-if="ventaExitosa" key="exito" class="venta-exitosa-card">
          <div class="exito-anillo">
            <span class="exito-icon">{{ modoVenta === 'mostrador' ? '🎉' : '📦' }}</span>
          </div>
          <h3>{{ modoVenta === 'mostrador' ? '¡Venta registrada!' : '¡Pedido creado!' }}</h3>
          <p>
            {{
              modoVenta === 'mostrador'
                ? 'El pedido fue marcado como entregado.'
                : 'El pedido fue registrado como pendiente de entrega.'
            }}
          </p>
          <p class="exito-id">
            Pedido <strong>#{{ String(ventaExitosa).padStart(5, '0') }}</strong>
          </p>
          <button class="btn-nueva" @click="limpiarVenta">
            <i class="pi pi-plus"></i>
            {{ modoVenta === 'mostrador' ? 'Nueva venta' : 'Nuevo pedido' }}
          </button>
        </div>

        <!-- ── Layout principal ──────────────────────────────────────────── -->
        <div v-else key="formulario" class="venta-layout">
          <!-- Panel izquierdo: Catálogo ──────────────────────────────────── -->
          <div class="catalogo-panel">
            <div class="search-wrap">
              <i class="pi pi-search search-icon"></i>
              <input
                v-model="busqueda"
                type="search"
                class="search-input"
                placeholder="Buscar por nombre o categoría..."
              />
            </div>

            <div class="productos-grid">
              <div
                v-for="p in productosFiltrados"
                :key="p.id"
                class="producto-tile"
                :class="{ 'sin-stock': p.stock === 0 }"
                @click="p.stock > 0 && agregarAlCarrito(p)"
              >
                <img
                  :src="p.imagenUrl || '/assets/images/default.jpg'"
                  :alt="p.nombre"
                  class="tile-img"
                />
                <div class="tile-info">
                  <p class="tile-nombre">{{ p.nombre }}</p>
                  <p class="tile-precio">Bs. {{ fmtBs(p.precio) }}</p>
                  <span
                    class="tile-stock"
                    :class="{ bajo: p.stock <= 5 && p.stock > 0, agotado: p.stock === 0 }"
                  >
                    {{ p.stock === 0 ? 'Sin stock' : `Stock: ${p.stock}` }}
                  </span>
                </div>
                <div v-if="p.stock > 0" class="tile-add"><i class="pi pi-plus"></i></div>
                <div v-else class="tile-agotado">Sin stock</div>
              </div>
              <p v-if="productosFiltrados.length === 0" class="sin-resultados">
                <i class="pi pi-search"></i> Sin resultados
              </p>
            </div>
          </div>

          <!-- Panel derecho: Venta ───────────────────────────────────────── -->
          <div class="venta-panel">
            <!-- Badge modo activo -->
            <div class="modo-badge-activo">
              <span>{{ modoVenta === 'mostrador' ? '🏪' : '🚚' }}</span>
              <span>{{ labelModo[modoVenta] }}</span>
              <span class="estado-hint">
                → {{ modoVenta === 'mostrador' ? 'entregado' : 'pendiente' }}
              </span>
            </div>

            <h4 class="panel-titulo"><i class="pi pi-shopping-cart"></i> Detalle de venta</h4>

            <!-- Carrito vacío -->
            <div v-if="carrito.length === 0" class="carrito-vacio">
              <div class="vacio-icon">🛒</div>
              <p>Selecciona productos del catálogo</p>
            </div>

            <template v-else>
              <!-- Lista de productos -->
              <div class="carrito-lista">
                <div v-for="item in carrito" :key="item.producto.id" class="carrito-item">
                  <img
                    :src="item.producto.imagenUrl || '/assets/images/default.jpg'"
                    class="item-img"
                  />
                  <div class="ci-info">
                    <p class="ci-nombre">{{ item.producto.nombre }}</p>
                    <p class="ci-precio">Bs. {{ fmtBs(item.producto.precio) }} c/u</p>
                  </div>
                  <div class="ci-ctrl">
                    <button class="btn-qty" @click="cambiarCantidad(item.producto.id, -1)">
                      −
                    </button>
                    <span class="qty">{{ item.cantidad }}</span>
                    <button class="btn-qty" @click="cambiarCantidad(item.producto.id, 1)">+</button>
                  </div>
                  <span class="ci-sub">Bs. {{ fmtBs(item.producto.precio * item.cantidad) }}</span>
                  <button class="btn-quitar" @click="quitarItem(item.producto.id)">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>

              <!-- ── Datos del cliente (tabla `clientes`) ──────────────── -->
              <div class="seccion-card">
                <div class="seccion-header-mini">
                  <i class="pi pi-user"></i>
                  <span>Datos del cliente</span>
                  <span v-if="clienteBuscado" class="badge-encontrado">
                    <i class="pi pi-check-circle"></i> Encontrado
                  </span>
                </div>
                <div class="cliente-grid">
                  <div class="field">
                    <label class="field-label">CI <span class="req">*</span></label>
                    <div class="input-wrap">
                      <i class="pi pi-id-card input-icon"></i>
                      <input
                        v-model="cliente.cedulaIdentidad"
                        @blur="buscarCliente"
                        class="field-input has-icon"
                        placeholder="Carnet de identidad"
                      />
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-label">Nombre</label>
                    <div class="input-wrap">
                      <i class="pi pi-user input-icon"></i>
                      <input
                        v-model="cliente.nombre"
                        class="field-input has-icon"
                        placeholder="Nombre"
                      />
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-label">Ap. Paterno</label>
                    <input
                      v-model="cliente.apellidoPaterno"
                      class="field-input"
                      placeholder="Apellido paterno"
                    />
                  </div>
                  <div class="field">
                    <label class="field-label">Ap. Materno</label>
                    <input
                      v-model="cliente.apellidoMaterno"
                      class="field-input"
                      placeholder="Apellido materno"
                    />
                  </div>
                  <div class="field">
                    <label class="field-label">Celular</label>
                    <div class="input-wrap">
                      <i class="pi pi-mobile input-icon"></i>
                      <input
                        v-model="cliente.celular"
                        class="field-input has-icon"
                        placeholder="Celular"
                      />
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-label">Email</label>
                    <div class="input-wrap">
                      <i class="pi pi-envelope input-icon"></i>
                      <input
                        v-model="cliente.email"
                        @blur="buscarCliente('email')"
                        class="field-input has-icon"
                        placeholder="correo@..."
                      />
                    </div>
                  </div>
                  <div class="field full-width">
                    <label class="field-label">Dirección del cliente</label>
                    <div class="input-wrap">
                      <i class="pi pi-map-marker input-icon"></i>
                      <input
                        v-model="cliente.direccion"
                        class="field-input has-icon"
                        placeholder="Dirección del cliente"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Entrega (solo domicilio) ───────────────────────────── -->
              <div v-if="modoVenta === 'domicilio'" class="seccion-card">
                <div class="seccion-header-mini">
                  <i class="pi pi-truck"></i>
                  <span>Entrega a domicilio</span>
                </div>

                <!-- Tipo de envío -->
                <div class="tipo-envio-group">
                  <label
                    class="tipo-card"
                    :class="{ activo: envio.tipoEnvio === 'delivery' }"
                    @click="envio.tipoEnvio = 'delivery'"
                  >
                    <span class="tipo-icon">🚚</span>
                    <div>
                      <p class="tipo-nombre">Delivery</p>
                      <p class="tipo-desc">Envío normal</p>
                    </div>
                    <span v-if="envio.tipoEnvio === 'delivery'" class="tipo-check">
                      <i class="pi pi-check-circle"></i>
                    </span>
                  </label>
                  <label
                    class="tipo-card"
                    :class="{ activo: envio.tipoEnvio === 'express' }"
                    @click="envio.tipoEnvio = 'express'"
                  >
                    <span class="tipo-icon">⚡</span>
                    <div>
                      <p class="tipo-nombre">Express</p>
                      <p class="tipo-desc">Entrega prioritaria</p>
                    </div>
                    <span v-if="envio.tipoEnvio === 'express'" class="tipo-check">
                      <i class="pi pi-check-circle"></i>
                    </span>
                  </label>
                </div>

                <!-- Fecha de entrega -->
                <div class="subseccion-label"><i class="pi pi-calendar"></i> Fecha de entrega</div>
                <div class="dias-selector">
                  <div
                    v-for="dia in diasOpciones"
                    :key="dia.iso"
                    class="dia-chip"
                    :class="{ activo: diaSeleccionado === dia.iso }"
                    @click="diaSeleccionado = dia.iso"
                  >
                    <span class="dia-nombre">{{ dia.label }}</span>
                    <span class="dia-numero">{{ dia.numero }}</span>
                    <span class="dia-mes">{{ dia.mes }}</span>
                  </div>
                </div>
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
                <div v-if="fechaEntregaFinal" class="fecha-confirmada">
                  <i class="pi pi-calendar-check"></i>
                  <span
                    >Entrega:
                    <strong>{{
                      new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-BO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    }}</strong>
                    · <strong>{{ horaSeleccionada }} hrs</strong></span
                  >
                </div>

                <!-- Dirección de envío (pedidos.direccion_envio) -->
                <div class="field" style="margin-top: 0.75rem">
                  <label class="field-label">Dirección de entrega <span class="req">*</span></label>
                  <div class="input-wrap">
                    <i class="pi pi-map-marker input-icon"></i>
                    <input
                      v-model="envio.direccionEnvio"
                      class="field-input has-icon"
                      placeholder="Calle, número, zona..."
                    />
                  </div>
                </div>

                <!-- Botón mapa -->
                <button type="button" class="btn-mapa" @click="abrirMapa">
                  <i class="pi pi-map"></i>
                  <span>{{
                    coordenadas ? 'Cambiar ubicación en el mapa' : 'Marcar en el mapa'
                  }}</span>
                  <span v-if="coordenadas" class="coords-badge">
                    <i class="pi pi-check-circle"></i> {{ coordenadas.lat.toFixed(4) }},
                    {{ coordenadas.lng.toFixed(4) }}
                  </span>
                </button>

                <div class="field">
                  <label class="field-label">Referencia</label>
                  <div class="input-wrap">
                    <i class="pi pi-info-circle input-icon"></i>
                    <input
                      v-model="envio.referencia"
                      class="field-input has-icon"
                      placeholder="Referencia o indicación extra"
                    />
                  </div>
                </div>
              </div>

              <!-- ── Método de pago ─────────────────────────────────────── -->
              <div class="seccion-card">
                <div class="seccion-header-mini">
                  <i class="pi pi-credit-card"></i>
                  <span>Método de pago</span>
                </div>
                <div class="metodo-opts">
                  <label
                    v-for="m in ['efectivo', 'qr', 'transferencia', 'tarjeta']"
                    :key="m"
                    class="metodo-opt"
                    :class="{ activo: metodo === m }"
                  >
                    <input type="radio" v-model="metodo" :value="m" hidden />
                    {{
                      m === 'efectivo'
                        ? '💵'
                        : m === 'qr'
                          ? '📱'
                          : m === 'transferencia'
                            ? '🏦'
                            : '💳'
                    }}
                    {{ m.charAt(0).toUpperCase() + m.slice(1) }}
                  </label>
                </div>

                <!-- Comprobante (pagos.comprobante) -->
                <div
                  v-if="metodo === 'qr' || metodo === 'transferencia'"
                  class="field"
                  style="margin-top: 0.75rem"
                >
                  <label class="field-label"
                    >Número de comprobante <span class="req">*</span></label
                  >
                  <div class="input-wrap">
                    <i class="pi pi-receipt input-icon"></i>
                    <input
                      v-model="comprobante"
                      class="field-input has-icon"
                      placeholder="N° de comprobante"
                    />
                  </div>
                </div>

                <!-- Últimos 4 dígitos (pagos.masked_card) -->
                <div v-if="metodo === 'tarjeta'" class="field" style="margin-top: 0.75rem">
                  <label class="field-label">Últimos 4 dígitos <span class="req">*</span></label>
                  <div class="input-wrap">
                    <i class="pi pi-credit-card input-icon"></i>
                    <input
                      v-model="maskedCard"
                      maxlength="4"
                      class="field-input has-icon"
                      placeholder="**** **** **** ____"
                    />
                  </div>
                </div>
              </div>

              <!-- ── Nota (pedidos.referencia) ──────────────────────────── -->
              <div class="field">
                <label class="field-label">Nota adicional (opcional)</label>
                <div class="input-wrap">
                  <i class="pi pi-pencil input-icon"></i>
                  <input
                    v-model="notaVenta"
                    class="field-input has-icon"
                    placeholder="Cliente VIP, pedido especial, alergia..."
                  />
                </div>
              </div>

              <!-- ── Total y confirmar ──────────────────────────────────── -->
              <div class="venta-footer">
                <div class="total-row">
                  <span>Total</span>
                  <span class="total-monto">Bs. {{ fmtBs(total) }}</span>
                </div>
                <button class="btn-confirmar" @click="confirmarVenta" :disabled="procesando">
                  <span v-if="procesando">
                    <i class="pi pi-spin pi-spinner"></i> Procesando...
                  </span>
                  <span v-else>
                    {{ modoVenta === 'mostrador' ? '✅ Confirmar venta' : '📦 Crear pedido' }}
                  </span>
                </button>
                <button class="btn-limpiar" @click="limpiarVenta">
                  <i class="pi pi-trash"></i> Cancelar
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── Modal del mapa ─────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="mapaVisible" class="modal-overlay" @click.self="cerrarMapa">
          <div class="modal-mapa">
            <div class="modal-header">
              <div>
                <h3 class="modal-titulo"><i class="pi pi-map"></i> Ubicación de entrega</h3>
                <p class="modal-desc">Haz clic en el mapa o arrastra el marcador</p>
              </div>
              <button class="modal-close" type="button" @click="cerrarMapa">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div class="mapa-container">
              <div id="mapa-venta"></div>
              <button type="button" class="btn-gps" @click="usarGPS" :disabled="buscandoGPS">
                <i :class="buscandoGPS ? 'pi pi-spin pi-spinner' : 'pi pi-crosshairs'"></i>
                {{ buscandoGPS ? 'Localizando...' : 'Mi ubicación' }}
              </button>
            </div>
            <div class="modal-footer">
              <div class="dir-detectada">
                <i class="pi pi-map-marker"></i>
                <span v-if="coordenadas && direccionReversa" class="dir-texto">
                  {{ direccionReversa.split(',').slice(0, 3).join(',') }}
                </span>
                <span v-else-if="coordenadas">
                  {{ coordenadas.lat.toFixed(6) }}, {{ coordenadas.lng.toFixed(6) }}
                </span>
                <span v-else class="dir-placeholder">Haz clic en el mapa para seleccionar</span>
              </div>
              <button
                type="button"
                class="btn-confirmar-ubi"
                :disabled="!coordenadas"
                @click="confirmarUbicacion"
              >
                <i class="pi pi-check"></i> Confirmar
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
.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Base ───────────────────────────────────────────────────────────────────── */
.admin-wrap {
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 50%, #fff 100%);
  padding: 2rem 1rem;
  min-height: 80vh;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.page-header {
  margin-bottom: 1.5rem;
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
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.25rem;
}
.page-sub {
  font-size: 0.9rem;
  color: #999;
  margin: 0;
}

/* ── Selector de modo ───────────────────────────────────────────────────────── */
.modo-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.modo-btn {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
  padding: 1rem 1.25rem;
  background: white;
  border: 2px solid #fce4ec;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.modo-btn:hover {
  border-color: #f48fb1;
  background: #fff9fb;
}

.modo-btn.activo {
  border-color: #e91e8c;
  background: linear-gradient(135deg, #fff0f7, #fff9fb);
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.15);
}

.modo-icon {
  font-size: 1.75rem;
}

.modo-texto strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  color: #880e4f;
  margin-bottom: 0.1rem;
}

.modo-texto small {
  font-size: 0.72rem;
  color: #aaa;
}

/* ── Venta exitosa ──────────────────────────────────────────────────────────── */
.venta-exitosa-card {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(233, 30, 140, 0.15);
  border: 1px solid #fce4ec;
}

.exito-anillo {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fce4ec, #fff9fb);
  border: 3px solid #f48fb1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 0 0 8px rgba(233, 30, 140, 0.07);
}

.exito-icon {
  font-size: 2.5rem;
}

.venta-exitosa-card h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #880e4f;
  margin-bottom: 0.4rem;
}
.venta-exitosa-card p {
  color: #666;
  margin-bottom: 0.3rem;
}
.exito-id {
  font-size: 1.1rem;
  color: #e91e8c;
  font-weight: 700;
  margin-bottom: 1.25rem !important;
}

.btn-nueva {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.8rem 1.8rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-nueva:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
}

/* ── Layout ─────────────────────────────────────────────────────────────────── */
.venta-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 1.75rem;
  align-items: start;
}

/* ── Catálogo ───────────────────────────────────────────────────────────────── */
.catalogo-panel {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
  border: 1px solid #fce4ec;
}

.search-wrap {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.875rem;
  outline: none;
  background: #fff9fb;
  transition: all 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  max-height: 62vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #f48fb1 transparent;
}

.producto-tile {
  background: #fff9fb;
  border-radius: 16px;
  border: 1.5px solid #fce4ec;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.producto-tile:hover:not(.sin-stock) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(233, 30, 140, 0.15);
  border-color: #f48fb1;
}

.producto-tile.sin-stock {
  opacity: 0.5;
  cursor: not-allowed;
}

.tile-img {
  width: 100%;
  height: 110px;
  object-fit: cover;
}

.tile-info {
  padding: 0.75rem;
}

.tile-nombre {
  font-weight: 700;
  font-size: 0.85rem;
  color: #880e4f;
  margin: 0 0 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-precio {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.9rem;
  margin: 0 0 0.3rem;
}
.tile-stock {
  font-size: 0.72rem;
  color: #aaa;
  font-weight: 500;
}
.tile-stock.bajo {
  color: #e65100;
  font-weight: 700;
}
.tile-stock.agotado {
  color: #c62828;
  font-weight: 700;
}

.tile-add {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.producto-tile:hover .tile-add {
  opacity: 1;
}

.tile-agotado {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #ffcdd2;
  color: #c62828;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 50px;
}

.sin-resultados {
  text-align: center;
  color: #aaa;
  font-size: 0.875rem;
  padding: 2rem;
  grid-column: 1/-1;
}

/* ── Panel venta ────────────────────────────────────────────────────────────── */
.venta-panel {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  border: 1px solid #fce4ec;
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #f48fb1 transparent;
}

.modo-badge-activo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #c2185b;
  background: #fce4ec;
  border-radius: 50px;
  padding: 0.35rem 0.85rem;
  width: fit-content;
}

.estado-hint {
  color: #f48fb1;
  font-weight: 600;
}

.panel-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #c2185b;
  margin: 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #fce4ec;
}

/* ── Carrito ────────────────────────────────────────────────────────────────── */
.carrito-vacio {
  text-align: center;
  padding: 2rem 1rem;
}
.vacio-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 0.5rem;
}
.carrito-vacio p {
  color: #aaa;
  font-size: 0.875rem;
}

.carrito-lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.carrito-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem;
  background: #fff9fb;
  border-radius: 12px;
  border: 1px solid #fce4ec;
}

.item-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid #fce4ec;
}

.ci-info {
  flex: 1;
  min-width: 0;
}
.ci-nombre {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.8rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ci-precio {
  font-size: 0.7rem;
  color: #aaa;
  margin: 0;
}

.ci-ctrl {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-qty {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #c2185b;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-qty:hover {
  background: #fce4ec;
  border-color: #e91e8c;
}

.qty {
  font-weight: 800;
  color: #880e4f;
  min-width: 22px;
  text-align: center;
  font-size: 0.82rem;
}

.ci-sub {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.8rem;
  white-space: nowrap;
}

.btn-quitar {
  background: none;
  border: none;
  color: #f48fb1;
  cursor: pointer;
  font-size: 0.78rem;
  padding: 0.25rem;
  transition: color 0.2s;
  flex-shrink: 0;
}
.btn-quitar:hover {
  color: #e53e3e;
}

/* ── Secciones card ─────────────────────────────────────────────────────────── */
.seccion-card {
  background: #fff9fb;
  border: 1.5px solid #fce4ec;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.seccion-header-mini {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #c2185b;
  font-size: 0.85rem;
  padding-bottom: 0.5rem;
  border-bottom: 1.5px solid #fce4ec;
}

.seccion-header-mini i {
  color: #e91e8c;
}

.badge-encontrado {
  margin-left: auto;
  font-size: 0.7rem;
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* ── Grid cliente ───────────────────────────────────────────────────────────── */
.cliente-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}
.full-width {
  grid-column: 1/-1;
}

/* ── Tipo envío ─────────────────────────────────────────────────────────────── */
.tipo-envio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.tipo-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  border: 1.5px solid #fce4ec;
  background: white;
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
  box-shadow: 0 3px 10px rgba(233, 30, 140, 0.1);
}
.tipo-icon {
  font-size: 1.2rem;
}
.tipo-nombre {
  font-size: 0.75rem;
  font-weight: 700;
  color: #880e4f;
  margin: 0;
}
.tipo-desc {
  font-size: 0.65rem;
  color: #aaa;
  margin: 0;
}
.tipo-check {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  color: #e91e8c;
  font-size: 0.8rem;
}

/* ── Selector fecha ─────────────────────────────────────────────────────────── */
.subseccion-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #c2185b;
  margin-bottom: 0.25rem;
}

.dias-selector {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  scrollbar-width: none;
}
.dias-selector::-webkit-scrollbar {
  display: none;
}

.dia-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  padding: 0.5rem 0.3rem;
  border-radius: 12px;
  border: 1.5px solid #fce4ec;
  background: white;
  cursor: pointer;
  transition: all 0.18s;
  flex-shrink: 0;
  gap: 0.05rem;
}

.dia-chip:hover {
  border-color: #f48fb1;
  background: #fce4ec;
}
.dia-chip.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  box-shadow: 0 3px 10px rgba(233, 30, 140, 0.25);
}

.dia-nombre {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #aaa;
}
.dia-numero {
  font-size: 1.1rem;
  font-weight: 800;
  color: #880e4f;
  line-height: 1;
}
.dia-mes {
  font-size: 0.58rem;
  color: #bbb;
}

.dia-chip.activo .dia-nombre,
.dia-chip.activo .dia-numero,
.dia-chip.activo .dia-mes {
  color: white;
}

.horas-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.hora-chip {
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
  border: 1.5px solid #f8bbd0;
  background: white;
  color: #c2185b;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.hora-chip:hover {
  background: #fce4ec;
  border-color: #e91e8c;
}
.hora-chip.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  border-color: #e91e8c;
  color: white;
}

.fecha-confirmada {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #fce4ec, #fff9fb);
  border: 1.5px solid #f48fb1;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  font-size: 0.8rem;
  color: #880e4f;
}

.fecha-confirmada i {
  color: #e91e8c;
  flex-shrink: 0;
}

/* ── Botón mapa ─────────────────────────────────────────────────────────────── */
.btn-mapa {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem 0.9rem;
  background: white;
  border: 1.5px dashed #f48fb1;
  border-radius: 10px;
  color: #c2185b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mapa:hover {
  background: #fff0f7;
  border-color: #e91e8c;
}

.coords-badge {
  margin-left: auto;
  font-size: 0.7rem;
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* ── Campos formulario ──────────────────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.field-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #880e4f;
}
.req {
  color: #e91e8c;
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #f48fb1;
  font-size: 0.8rem;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.6rem 0.9rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #333;
  outline: none;
  background: white;
  transition: all 0.2s;
  box-sizing: border-box;
}

.field-input.has-icon {
  padding-left: 2.1rem;
}
.field-input:focus {
  border-color: #e91e8c;
  box-shadow: 0 0 0 3px rgba(233, 30, 140, 0.08);
}

/* ── Método de pago ─────────────────────────────────────────────────────────── */
.metodo-opts {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.metodo-opt {
  padding: 0.4rem 0.85rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #c2185b;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.metodo-opt.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-color: #e91e8c;
}

/* ── Footer venta ───────────────────────────────────────────────────────────── */
.venta-footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-top: 0.5rem;
  border-top: 2px solid #fce4ec;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fce4ec, #fff9fb);
  border-radius: 12px;
  font-weight: 700;
  color: #880e4f;
}

.total-monto {
  font-weight: 800;
  color: #e91e8c;
  font-size: 1.2rem;
}

.btn-confirmar {
  width: 100%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.85rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.25);
}

.btn-confirmar:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
}
.btn-confirmar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-limpiar {
  width: 100%;
  background: none;
  border: 1.5px solid #ffcdd2;
  color: #e53e3e;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.65rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-limpiar:hover {
  background: #fff5f5;
  border-color: #e53e3e;
}

/* ── Modal mapa ─────────────────────────────────────────────────────────────── */
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
  max-width: 680px;
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
  transition: background 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f8bbd0;
}

.mapa-container {
  position: relative;
}
#mapa-venta {
  width: 100%;
  height: 360px;
}

.btn-gps {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: white;
  border: 1.5px solid #f48fb1;
  border-radius: 50px;
  color: #e91e8c;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
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

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid #fce4ec;
  background: #fff9fb;
}

.dir-detectada {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  flex: 1;
  min-width: 0;
  color: #880e4f;
}
.dir-texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dir-placeholder {
  color: #bbb;
  font-style: italic;
}

.btn-confirmar-ubi {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.3);
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-confirmar-ubi:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-confirmar-ubi:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Transiciones ───────────────────────────────────────────────────────────── */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

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
@media (max-width: 1000px) {
  .venta-layout {
    grid-template-columns: 1fr;
  }
  .venta-panel {
    position: static;
    max-height: none;
  }
}

@media (max-width: 640px) {
  .modo-selector {
    flex-direction: column;
  }
  .cliente-grid {
    grid-template-columns: 1fr;
  }
  .tipo-envio-group {
    grid-template-columns: 1fr;
  }
  .productos-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  .admin-wrap {
    padding: 1rem;
  }
  #mapa-venta {
    height: 280px;
  }
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-confirmar-ubi {
    justify-content: center;
  }
}
</style>
