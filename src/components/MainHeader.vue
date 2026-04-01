<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import http from '@/plugins/axios'
import { usarCarrito } from '@/funciones/UsarCarrito'
import CarritoPanel from './CarritoPanel.vue'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'
import { useRouter } from 'vue-router'

const categorias = ref<{ id: number; nombre: string }[]>([])
const cargandoCategorias = ref(false)
const errorCategorias = ref<string | null>(null)

const { carrito } = usarCarrito()
const mostrarCarrito = ref(false)
const router = useRouter()
const mostrarMenuUsuario = ref(false)
const usuarioLogueado = ref(false)
const emailUsuario = ref('')
const menuMovilAbierto = ref(false)

const carritoCount = computed(() => carrito.value.reduce((s, item) => s + item.cantidad, 0))

const obtenerCategorias = async () => {
  cargandoCategorias.value = true
  errorCategorias.value = null
  try {
    const res = await http.get('categorias')
    categorias.value = res.data
  } catch (error) {
    console.error('Error al cargar categorías:', error)
    errorCategorias.value = 'No se pudieron cargar las categorías.'
  } finally {
    cargandoCategorias.value = false
  }
}

const verificarSesion = () => {
  const token = getTokenFromLocalStorage()
  if (token) {
    usuarioLogueado.value = true
    const decoded = parseJwt(token)
    emailUsuario.value = decoded?.email || 'Usuario'
  } else {
    usuarioLogueado.value = false
  }
}

const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  usuarioLogueado.value = false
  mostrarMenuUsuario.value = false
  router.push('/')
}

const irALogin = () => {
  router.push('/login')
}

const terminoBusqueda = ref('')

const buscar = (e?: Event) => {
  if (e) e.preventDefault()
  const termino = terminoBusqueda.value.trim()
  if (termino) {
    router.push({ path: '/productos', query: { q: termino } })
  } else {
    router.push('/productos')
  }
  terminoBusqueda.value = ''
  menuMovilAbierto.value = false
}

const cerrarMenuUsuario = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    mostrarMenuUsuario.value = false
  }
}

onMounted(() => {
  obtenerCategorias()
  verificarSesion()
  document.addEventListener('click', cerrarMenuUsuario)
})

onUnmounted(() => {
  document.removeEventListener('click', cerrarMenuUsuario)
})
</script>

<template>
  <header class="header">
    <!-- Top bar -->
    <div class="top-bar">
      <div class="container top-bar-inner">
        <span class="top-phone"> <i class="pi pi-phone"></i> (591) 67399831 </span>
        <div class="brand-tagline">🍓 Endulzando Sucre desde 2024</div>
        <div class="social-icons">
          <a href="#" aria-label="Instagram"><i class="pi pi-instagram"></i></a>
          <a href="#" aria-label="Facebook"><i class="pi pi-facebook"></i></a>
          <a href="#" aria-label="Email"><i class="pi pi-envelope"></i></a>
          <a href="#" aria-label="WhatsApp"><i class="pi pi-whatsapp"></i></a>
        </div>
      </div>
    </div>

    <!-- Middle bar -->
    <div class="middle-bar">
      <div class="container middle-bar-inner">
        <!-- Logo -->
        <RouterLink to="/" class="logo">
          <img src="@/assets/images/logoSansa.png" alt="Berry Sweet" />
        </RouterLink>

        <!-- Buscador -->
        <form class="search-box" @submit.prevent="buscar">
          <input
            v-model="terminoBusqueda"
            type="search"
            placeholder="Buscar pasteles, tortas..."
            aria-label="Buscar productos"
          />
          <button type="submit" class="btn-search">
            <i class="pi pi-search"></i>
          </button>
        </form>

        <!-- Usuario y Carrito -->
        <div class="user-cart">
          <!-- Menú usuario -->
          <div class="user-menu">
            <div v-if="!usuarioLogueado" @click="irALogin" class="icon-btn" title="Iniciar sesión">
              <i class="pi pi-user"></i>
            </div>
            <div
              v-else
              @click="mostrarMenuUsuario = !mostrarMenuUsuario"
              class="icon-btn user-logged"
              title="Mi cuenta"
            >
              <i class="pi pi-user"></i>
            </div>

            <!-- Dropdown -->
            <div v-if="usuarioLogueado && mostrarMenuUsuario" class="user-dropdown">
              <div class="user-email"><i class="pi pi-user me-1"></i> {{ emailUsuario }}</div>
              <div class="dropdown-divider"></div>
              <RouterLink to="/perfil" class="dropdown-item" @click="mostrarMenuUsuario = false">
                <i class="pi pi-id-card"></i> Mi Perfil
              </RouterLink>
              <RouterLink
                to="/mis-pedidos"
                class="dropdown-item"
                @click="mostrarMenuUsuario = false"
              >
                <i class="pi pi-shopping-bag"></i> Mis Pedidos
              </RouterLink>
              <div class="dropdown-divider"></div>
              <a @click="cerrarSesion" class="dropdown-item logout" style="cursor: pointer">
                <i class="pi pi-sign-out"></i> Cerrar Sesión
              </a>
            </div>
          </div>

          <!-- Carrito -->
          <div class="cart-btn" @click="mostrarCarrito = true" title="Ver carrito">
            <i class="pi pi-shopping-cart"></i>
            <span v-if="carritoCount > 0" class="cart-badge">{{ carritoCount }}</span>
          </div>

          <!-- Hamburguesa móvil -->
          <button
            class="menu-toggle"
            @click="menuMovilAbierto = !menuMovilAbierto"
            aria-label="Menú"
          >
            <i :class="menuMovilAbierto ? 'pi pi-times' : 'pi pi-bars'"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Navbar principal (escritorio) -->
    <nav class="main-navbar">
      <div class="container">
        <ul class="nav-list">
          <li><RouterLink to="/" class="nav-link">Inicio</RouterLink></li>

          <li class="nav-dropdown" v-if="!errorCategorias">
            <a class="nav-link nav-link-drop">
              Categorías <i class="pi pi-chevron-down" style="font-size: 0.7rem"></i>
            </a>
            <ul class="dropdown-menu">
              <li v-if="cargandoCategorias" class="dropdown-loader">Cargando...</li>
              <li v-else-if="categorias.length === 0" class="dropdown-loader">Sin categorías</li>
              <li v-else v-for="cat in categorias" :key="cat.id">
                <RouterLink class="dropdown-item" :to="`/categorias/${cat.id}`">
                  🍰 {{ cat.nombre }}
                </RouterLink>
              </li>
            </ul>
          </li>

          <li><RouterLink to="/productos" class="nav-link">Productos</RouterLink></li>
          <li><RouterLink :to="{ name: 'carrito' }" class="nav-link">Carrito</RouterLink></li>
          <li><RouterLink :to="{ name: 'perfil' }" class="nav-link">Mi cuenta</RouterLink></li>
        </ul>
      </div>
    </nav>

    <!-- Menú móvil desplegable -->
    <div class="mobile-menu" :class="{ open: menuMovilAbierto }">
      <form class="mobile-search" @submit.prevent="buscar">
        <input v-model="terminoBusqueda" type="search" placeholder="Buscar..." />
        <button type="submit"><i class="pi pi-search"></i></button>
      </form>
      <RouterLink to="/" class="mobile-link" @click="menuMovilAbierto = false">Inicio</RouterLink>
      <RouterLink to="/productos" class="mobile-link" @click="menuMovilAbierto = false"
        >Productos</RouterLink
      >
      <RouterLink to="/carrito" class="mobile-link" @click="menuMovilAbierto = false"
        >Carrito</RouterLink
      >
      <RouterLink to="/perfil" class="mobile-link" @click="menuMovilAbierto = false"
        >Mi cuenta</RouterLink
      >
      <RouterLink
        to="/login"
        class="mobile-link"
        @click="menuMovilAbierto = false"
        v-if="!usuarioLogueado"
        >Iniciar sesión</RouterLink
      >
      <a class="mobile-link mobile-link-logout" v-else @click="cerrarSesion">Cerrar sesión</a>
    </div>

    <!-- Panel del carrito -->
    <CarritoPanel v-if="mostrarCarrito" @cerrar="mostrarCarrito = false" />
  </header>
</template>

<style scoped>
/* ── TOP BAR ── */
.top-bar {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-size: 0.82rem;
  padding: 0.45rem 0;
}

.top-bar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.top-phone {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
}

.brand-tagline {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.social-icons {
  display: flex;
  gap: 0.75rem;
}

.social-icons a {
  color: white;
  font-size: 1rem;
  transition: opacity 0.2s;
  text-decoration: none;
}

.social-icons a:hover {
  opacity: 0.75;
}

/* ── MIDDLE BAR ── */
.middle-bar {
  background: #fff0f5;
  border-bottom: 2px solid #f8bbd0;
  padding: 0.5rem 0;
}

.middle-bar-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.logo img {
  height: 80px;
  width: auto;
}

.search-box {
  flex: 1;
  max-width: 420px;
  display: flex;
  min-width: 160px;
}

.search-box input {
  flex: 1;
  border: 1.5px solid #f48fb1;
  border-right: none;
  border-radius: 50px 0 0 50px;
  padding: 0.55rem 1.1rem;
  font-size: 0.9rem;
  outline: none;
  color: #333;
  background: white;
}

.search-box input:focus {
  border-color: #e91e8c;
}

.btn-search {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 0 50px 50px 0;
  padding: 0 1.1rem;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
}

.btn-search:hover {
  opacity: 0.88;
}

.user-cart {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.icon-btn {
  font-size: 1.4rem;
  color: #c2185b;
  cursor: pointer;
  transition:
    color 0.2s,
    transform 0.2s;
}

.icon-btn:hover {
  color: #e91e8c;
  transform: scale(1.1);
}

.user-logged {
  position: relative;
}

.user-logged::after {
  content: '';
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  border: 1.5px solid white;
}

.cart-btn {
  position: relative;
  font-size: 1.4rem;
  color: #c2185b;
  cursor: pointer;
  transition:
    color 0.2s,
    transform 0.2s;
}

.cart-btn:hover {
  color: #e91e8c;
  transform: scale(1.1);
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -10px;
  background: #e91e8c;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 50px;
  line-height: 1.2;
}

/* User dropdown */
.user-menu {
  position: relative;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(233, 30, 140, 0.18);
  min-width: 220px;
  z-index: 1001;
  padding: 8px 0;
  border: 1px solid #fce4ec;
}

.user-email {
  padding: 12px 16px;
  font-weight: 700;
  color: #e91e8c;
  font-size: 0.88rem;
}

.dropdown-divider {
  height: 1px;
  background: #fce4ec;
  margin: 6px 0;
}

.user-dropdown .dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  color: #880e4f;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.user-dropdown .dropdown-item:hover {
  background: #fff0f5;
}

.user-dropdown .dropdown-item.logout {
  color: #e53e3e;
}

.user-dropdown .dropdown-item.logout:hover {
  background: #fff5f5;
}

/* ── NAVBAR ── */
.main-navbar {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  padding: 0.2rem 0;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
}

.nav-link {
  display: block;
  color: white !important;
  font-weight: 600;
  font-size: 0.92rem;
  padding: 0.65rem 1.1rem;
  border-radius: 6px;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.22);
}

.nav-dropdown {
  position: relative;
}

.nav-link-drop {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.nav-dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(233, 30, 140, 0.18);
  min-width: 200px;
  z-index: 1000;
  padding: 8px 0;
  border: 1px solid #fce4ec;
  list-style: none;
  margin: 0;
}

.dropdown-item {
  display: block;
  padding: 0.6rem 1rem;
  color: #880e4f;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #fff0f5;
  color: #e91e8c;
}

.dropdown-loader {
  padding: 0.6rem 1rem;
  color: #bbb;
  font-size: 0.88rem;
}

/* Hamburguesa */
.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: #c2185b;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0.2rem;
}

/* ── MOBILE MENU ── */
.mobile-menu {
  display: none;
  flex-direction: column;
  background: #fff0f5;
  border-bottom: 2px solid #f8bbd0;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.35s ease;
}

.mobile-menu.open {
  display: flex;
  max-height: 500px;
}

.mobile-search {
  display: flex;
  margin: 0.75rem 1rem 0.5rem;
}

.mobile-search input {
  flex: 1;
  border: 1.5px solid #f48fb1;
  border-right: none;
  border-radius: 50px 0 0 50px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  outline: none;
}

.mobile-search button {
  background: #e91e8c;
  color: white;
  border: none;
  border-radius: 0 50px 50px 0;
  padding: 0 1rem;
  cursor: pointer;
}

.mobile-link {
  display: block;
  padding: 0.75rem 1.25rem;
  color: #880e4f;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border-bottom: 1px solid #fce4ec;
  transition: background 0.2s;
}

.mobile-link:hover {
  background: #fce4ec;
}

.mobile-link-logout {
  color: #e53e3e;
  cursor: pointer;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .main-navbar {
    display: none;
  }

  .menu-toggle {
    display: block;
  }

  .brand-tagline {
    display: none;
  }

  .search-box {
    display: none;
  }

  .logo img {
    height: 60px;
  }
}

@media (max-width: 480px) {
  .top-phone {
    font-size: 0.78rem;
  }
}
</style>
