import type { Producto } from '@/models/producto'
import { getTokenFromLocalStorage } from '@/helpers'
import router from '@/router'
import { ref, watch } from 'vue'

interface ItemCarrito {
  producto: Producto
  cantidad: number
}

const carrito = ref<ItemCarrito[]>([])
const mostrarAvisoLogin = ref(false)
let returnUrlLogin = '/'

// Restaurar el carrito solo mientras exista una sesión válida.
if (getTokenFromLocalStorage() && localStorage.getItem('carrito')) {
  carrito.value = JSON.parse(localStorage.getItem('carrito')!)
} else {
  localStorage.removeItem('carrito')
}

// ✅ Guardar automáticamente cada vez que el carrito cambie
watch(
  carrito,
  (nuevoValor) => {
    if (getTokenFromLocalStorage()) {
      localStorage.setItem('carrito', JSON.stringify(nuevoValor))
    } else {
      localStorage.removeItem('carrito')
    }
  },
  { deep: true },
)

export function usarCarrito() {
  // 🛒 Agregar producto al carrito
  const agregarProducto = (producto: Producto, cantidad = 1) => {
    if (!getTokenFromLocalStorage()) {
      carrito.value = []
      localStorage.removeItem('carrito')
      returnUrlLogin = router.currentRoute.value.fullPath
      mostrarAvisoLogin.value = true
      return false
    }

    const existente = carrito.value.find((p) => p.producto.id === producto.id)
    if (existente) {
      existente.cantidad += cantidad
    } else {
      carrito.value.push({ producto, cantidad })
    }
    return true
  }

  const irAInicioSesion = () => {
    mostrarAvisoLogin.value = false
    router.push({ name: 'login', query: { returnUrl: returnUrlLogin } })
  }

  // ➕ Incrementar cantidad
  const incrementarCantidad = (id: number) => {
    const item = carrito.value.find((p) => p.producto.id === id)
    if (item) item.cantidad++
  }

  // ➖ Disminuir cantidad
  const disminuirCantidad = (id: number) => {
    const item = carrito.value.find((p) => p.producto.id === id)
    if (item && item.cantidad > 1) {
      item.cantidad--
    } else if (item && item.cantidad === 1) {
      // Si llega a 0, lo eliminamos del carrito
      eliminarProducto(id)
    }
  }

  // ❌ Eliminar producto
  const eliminarProducto = (id: number) => {
    carrito.value = carrito.value.filter((p) => p.producto.id !== id)
  }

  // 🧹 Vaciar carrito
  const vaciarCarrito = () => {
    carrito.value = []
  }

  // 💰 Calcular total
  const totalCarrito = () =>
    carrito.value.reduce((total, item) => {
      const precio = Number(item.producto.precio)
      return total + (Number.isFinite(precio) ? precio : 0) * item.cantidad
    }, 0)

  return {
    carrito,
    agregarProducto,
    mostrarAvisoLogin,
    irAInicioSesion,
    eliminarProducto,
    vaciarCarrito,
    totalCarrito,
    incrementarCantidad,
    disminuirCantidad,
  }
}
