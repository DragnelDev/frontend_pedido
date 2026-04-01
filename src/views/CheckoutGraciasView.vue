<script setup lang="ts">
import { onMounted, ref } from 'vue'
import http from '@/plugins/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const cargando = ref(true)
const pedido = ref<any>(null)
const items = ref<any[]>([])
const pago = ref<any>(null)

onMounted(async () => {
  const raw = localStorage.getItem('ultimoPedido')
  if (!raw) {
    router.replace('/')
    return
  }

  const ticket = JSON.parse(raw)

  pedido.value = {
    id: ticket.id,
    total: ticket.total,
    estado: ticket.estado,
    metodoPago: ticket.metodoPago,
    fecha: ticket.fecha,
  }

  try {
    const { data } = await http.get(`/pedidos/${ticket.id}`)

    pedido.value = {
      id: data.id,
      total: data.total,
      estado: data.estado,
      metodoPago: data.metodoPago,
      fecha: data.fechaCreacion,
      direccion: data.direccion,
      referencia: data.referencia,
      tipoEnvio: data.tipoEnvio,
    }

    items.value = (data.detallePedido || []).map((d: any) => ({
      id: d.id,
      nombre: d.producto?.nombre,
      imagenUrl: d.producto?.imagenUrl,
      precioUnit: d.precioUnitario,
      cantidad: d.cantidad,
      subtotal: d.precioUnitario * d.cantidad,
    }))

    pago.value = (data.pagos && data.pagos[0]) || null
  } catch {
  } finally {
    cargando.value = false
  }
})

function fmtFecha(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

function fmtBs(n?: number) {
  return (Number(n) || 0).toFixed(2)
}
</script>

<template>
  <section class="gracias">

    <div class="header">
      <div class="icono">🍰</div>
      <h2>¡Gracias por tu compra!</h2>
      <p>Tu pedido fue registrado correctamente en Berry Sweet 🍓</p>
    </div>

    <div class="panel">
      <div class="fila"><b>Pedido #:</b> {{ pedido?.id }}</div>
      <div class="fila"><b>Total:</b> Bs. {{ fmtBs(pedido?.total) }}</div>
      <div class="fila"><b>Fecha:</b> {{ fmtFecha(pedido?.fecha) }}</div>
      <div class="fila"><b>Método de pago:</b> {{ pedido?.metodoPago }}</div>
      <div class="fila"><b>Estado:</b> {{ pedido?.estado }}</div>

      <div v-if="pedido?.direccion" class="fila">
        <b>Envío:</b> {{ pedido?.tipoEnvio }} — {{ pedido?.direccion }}
        <span v-if="pedido?.referencia">({{ pedido?.referencia }})</span>
      </div>
    </div>

    <h3 class="titulo">Productos del pedido</h3>

    <div v-if="cargando">Cargando resumen…</div>

    <div v-else>
      <div v-if="items.length === 0" class="vacio">
        No se encontraron productos del pedido.
      </div>

      <div v-else class="lista">
        <div v-for="it in items" :key="it.id" class="item">

          <img :src="it.imagenUrl" alt="" />

          <div class="info">
            <div class="tit">{{ it.nombre }}</div>
            <div class="sub">
              Cant: {{ it.cantidad }} · Precio: Bs. {{ fmtBs(it.precioUnit) }}
            </div>
          </div>

          <div class="monto">
            Bs. {{ fmtBs(it.subtotal) }}
          </div>

        </div>
      </div>
    </div>

    <div v-if="pago" class="panel">
      <h3>Pago</h3>
      <div class="fila"><b>Método:</b> {{ pago.metodo }}</div>
      <div class="fila"><b>Monto:</b> Bs. {{ fmtBs(pago.monto) }}</div>
      <div class="fila" v-if="pago.maskedCard"><b>Tarjeta:</b> {{ pago.maskedCard }}</div>
      <div class="fila"><b>Estado:</b> {{ pago.estado }}</div>
      <div class="fila" v-if="pago.comprobante">
        <b>Comprobante:</b>
        <a :href="pago.comprobante" target="_blank">ver</a>
      </div>
    </div>

    <router-link to="/" class="btn">
      Volver al inicio
    </router-link>

  </section>
</template>

<style scoped>

.gracias{
  padding:40px 20px;
  max-width:850px;
  margin:auto;
  text-align:center;
}

/* encabezado */

.header{
  margin-bottom:30px;
}

.icono{
  width:70px;
  height:70px;
  border-radius:50%;
  background:linear-gradient(135deg,#e91e63,#f06292);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:32px;
  color:white;
  margin:auto;
  margin-bottom:10px;
}

.header h2{
  color:#880e4f;
}

.header p{
  color:#ad1457;
}

/* panel */

.panel{
  margin:20px auto;
  padding:20px;
  background:white;
  border-radius:14px;
  border:1px solid #fce4ec;
  box-shadow:0 4px 12px rgba(233,30,99,0.08);
  text-align:left;
}

.fila{
  margin:6px 0;
}

/* titulo productos */

.titulo{
  margin-top:30px;
  color:#880e4f;
}

/* lista */

.lista{
  max-width:720px;
  margin:auto;
}

.item{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 0;
  border-bottom:1px solid #fce4ec;
}

.item img{
  width:60px;
  height:60px;
  object-fit:cover;
  border-radius:10px;
}

.info{
  flex:1;
  margin:0 12px;
  text-align:left;
}

.tit{
  font-weight:600;
  color:#880e4f;
}

.sub{
  font-size:0.9rem;
  color:#666;
}

.monto{
  font-weight:700;
  color:#e91e63;
}

/* boton */

.btn{
  display:inline-block;
  margin-top:25px;
  padding:12px 24px;
  border-radius:50px;
  text-decoration:none;
  font-weight:700;
  color:white;
  background:linear-gradient(135deg,#e91e63,#f06292);
  box-shadow:0 4px 12px rgba(233,30,99,0.3);
  transition:0.2s;
}

.btn:hover{
  transform:translateY(-2px);
  opacity:0.9;
}

.vacio{
  color:#777;
}

</style>
