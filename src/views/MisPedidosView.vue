<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage } from '@/helpers'

type Pedido = {
  id: number
  total: number
  estado: 'pendiente' | 'entregado' | 'cancelado'
  metodoPago: string
  tipoEnvio: string
  direccion?: string
  fechaCreacion?: string
  detallePedido?: Array<any>
  pedidosProductos?: Array<any>
  pagos?: Array<any>
}

const router = useRouter()
const pedidos = ref<Pedido[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)
const abierto = ref<number | null>(null)

onMounted(async () => {
  const token = getTokenFromLocalStorage()
  if (!token) {
    alert('Por favor, inicie sesión para ver sus pedidos.')
    router.replace('/login')
    return
  }
  await cargarPedidos()
})

async function cargarPedidos() {
  cargando.value = true
  error.value = null
  try {
    const { data } = await http.get<Pedido[]>('/pedidos/mios')
    pedidos.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudieron cargar los pedidos'
  } finally {
    cargando.value = false
  }
}

async function verDetalle(id: number) {
  if (abierto.value === id) { abierto.value = null; return }

  try {
    const { data } = await http.get(`/pedidos/${id}`)
    const i = pedidos.value.findIndex((p) => p.id === id)
    if (i >= 0) {
      pedidos.value[i] = {
        ...pedidos.value[i], ...data,
        detallePedido: data.detallePedido || data.pedidosProductos || [],
        pagos: data.pagos || [],
      }
    }
    abierto.value = id
  } catch {
    alert('No se pudo cargar el detalle.')
  }
}

function fmtFecha(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(+d) ? '' : d.toLocaleString()
}

function fmtBs(n?: number) {
  return (Number(n) || 0).toFixed(2)
}
</script>

<template>
  <section class="pedidos-page">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <span class="section-tag">📦 Mi historial</span>
        <h2 class="page-titulo">Mis Pedidos</h2>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-msg">
        <i class="pi pi-exclamation-triangle"></i> {{ error }}
      </div>

      <!-- Cargando -->
      <div v-else-if="cargando" class="cargando">
        <i class="pi pi-spin pi-spinner"></i> Cargando pedidos...
      </div>

      <!-- Sin pedidos -->
      <div v-else-if="pedidos.length === 0" class="vacio">
        <div class="vacio-icon">📦</div>
        <h4>Aún no tienes pedidos</h4>
        <p>Cuando realices una compra, aparecerá aquí</p>
        <RouterLink to="/productos" class="btn-explorar">🍰 Explorar productos</RouterLink>
      </div>

      <!-- Tabla -->
      <div v-else class="tabla-card">
        <div class="table-wrap">
          <table class="tabla">
            <thead>
              <tr>
                <th>Nro</th>
                <th>Total (Bs.)</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="p in pedidos" :key="p.id">
                <tr :class="{ 'row-abierta': abierto === p.id }">
                  <td><span class="id-badge">#{{ p.id }}</span></td>
                  <td><span class="monto">Bs. {{ fmtBs(p.total) }}</span></td>
                  <td><span class="metodo-badge">{{ p.metodoPago }}</span></td>
                  <td>
                    <span class="estado-badge" :class="p.estado">{{ p.estado }}</span>
                  </td>
                  <td class="fecha-cell">{{ fmtFecha(p.fechaCreacion) }}</td>
                  <td>
                    <button class="btn-accion" @click="verDetalle(p.id)">
                      <i :class="abierto === p.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                      {{ abierto === p.id ? 'Ocultar' : 'Ver detalle' }}
                    </button>
                  </td>
                </tr>

                <!-- Detalle expandible -->
                <tr v-if="abierto === p.id" class="fila-detalle">
                  <td colspan="6">
                    <div class="detalle-wrap">
                      <div v-if="!p.detallePedido?.length" class="empty">
                        <i class="pi pi-inbox"></i> Sin productos registrados
                      </div>
                      <div v-else class="detalle-lista">
                        <div
                          v-for="producto in p.detallePedido"
                          :key="producto.id"
                          class="detalle-item"
                        >
                          <img
                            :src="producto.producto?.imagenUrl"
                            alt="Producto"
                            class="detalle-img"
                          />
                          <div class="detalle-info">
                            <h6>{{ producto.producto?.nombre }}</h6>
                            <p>Cantidad: {{ producto.cantidad }} · Precio: Bs. {{ fmtBs(producto.precioUnitario) }}</p>
                          </div>
                          <span class="detalle-subtotal">
                            Bs. {{ fmtBs(producto.cantidad * producto.precioUnitario) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pedidos-page {
  background: linear-gradient(180deg, #fff9fb 0%, #fce4ec 100%);
  padding: 3rem 1rem;
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
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0;
}

/* Error / Cargando */
.error-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 12px;
  border-left: 4px solid #e53935;
  font-weight: 600;
}

.cargando {
  text-align: center;
  padding: 3rem;
  color: #f48fb1;
  font-size: 0.9rem;
}

.cargando i { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }

/* Vacío */
.vacio {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 1px solid #fce4ec;
}

.vacio-icon { font-size: 4rem; opacity: 0.4; margin-bottom: 1rem; }

.vacio h4 {
  font-weight: 700;
  color: #880e4f;
  margin-bottom: 0.4rem;
}

.vacio p { color: #aaa; margin-bottom: 1.5rem; }

.btn-explorar {
  display: inline-block;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 700;
  padding: 0.75rem 1.75rem;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: opacity 0.2s, transform 0.2s;
}

.btn-explorar:hover { opacity: 0.9; transform: translateY(-2px); color: white; }

/* Tabla */
.tabla-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
  border: 1px solid #fce4ec;
}

.table-wrap { overflow-x: auto; }

.tabla {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

.tabla thead {
  background: linear-gradient(135deg, #e91e8c, #f06292);
}

.tabla th {
  padding: 0.85rem 1rem;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.tabla td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.875rem;
  vertical-align: middle;
}

.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr:hover td { background: #fff9fb; }
.row-abierta td { background: #fff0f5 !important; }

/* Badges */
.id-badge {
  background: #fce4ec;
  color: #c2185b;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.2rem 0.55rem;
  border-radius: 50px;
}

.monto { font-weight: 800; color: #e91e8c; }

.metodo-badge {
  background: #e8eaf6;
  color: #3949ab;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
  text-transform: capitalize;
}

.estado-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.3rem 0.75rem;
  border-radius: 50px;
  text-transform: capitalize;
  display: inline-block;
}

.estado-badge.pendiente { background: #fff3e0; color: #e65100; }
.estado-badge.entregado { background: #e8f5e9; color: #2e7d32; }
.estado-badge.cancelado { background: #fce4ec; color: #c62828; }

.fecha-cell { font-size: 0.8rem; color: #999; white-space: nowrap; }

/* Acción */
.btn-accion {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  background: #fce4ec;
  color: #c2185b;
  border: none;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-accion:hover { background: #f8bbd0; }

/* Detalle expandible */
.fila-detalle td {
  padding: 0;
  background: #fff9fb;
  border-bottom: 2px solid #fce4ec;
}

.detalle-wrap {
  padding: 1.25rem;
}

.empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  font-style: italic;
  font-size: 0.875rem;
  padding: 0.5rem;
}

.detalle-lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.detalle-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #fce4ec;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.05);
}

.detalle-img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #fce4ec;
  flex-shrink: 0;
}

.detalle-info { flex: 1; }

.detalle-info h6 {
  font-weight: 700;
  color: #880e4f;
  font-size: 0.9rem;
  margin: 0 0 0.2rem;
}

.detalle-info p {
  font-size: 0.8rem;
  color: #aaa;
  margin: 0;
}

.detalle-subtotal {
  font-weight: 800;
  color: #e91e8c;
  font-size: 0.9rem;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
