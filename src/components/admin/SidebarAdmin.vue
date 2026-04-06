<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

const router = useRouter()
const route = useRoute()
const nombreUsuario = ref('')
const rolUsuario = ref('')
const sidebarOpen = ref(false)

function isActive(path: string) {
  return route.path.startsWith(path)
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function navigateTo(path: string) {
  router.push(path)
  closeSidebar()
}

onMounted(() => {
  const token = getTokenFromLocalStorage()
  if (token) {
    const decoded = parseJwt(token)
    const nombre = decoded?.nombre || ''
    const apellidos = decoded?.apellidos || ''
    const nombreCompleto = `${nombre} ${apellidos}`.trim()
    nombreUsuario.value = nombreCompleto || decoded?.email?.split('@')[0] || 'Usuario'
    rolUsuario.value = decoded?.rol || 'EMPLEADO'
  }
})

function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const navItems = [
  { label: 'Productos', icon: 'pi pi-box', path: '/admin/productos' },
  { label: 'Categorías', icon: 'pi pi-tags', path: '/admin/categorias' },
  { label: 'Pedidos', icon: 'pi pi-shopping-cart', path: '/admin/pedidos' },
  { label: 'Pagos', icon: 'pi pi-credit-card', path: '/admin/pagos' },
]
</script>

<template>
  <!-- Botón Hamburguesa (visible en móvil) -->
  <button class="hamburger-btn" @click="toggleSidebar">
    <i class="pi" :class="sidebarOpen ? 'pi-times' : 'pi-bars'"></i>
  </button>

  <!-- Overlay para cerrar sidebar en móvil -->
  <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

  <nav class="sidebar-nav" :class="{ 'sidebar-open': sidebarOpen }">
    <!-- Marca -->
    <div class="sidebar-brand">
      <div class="brand-icon">🍓</div>
      <div>
        <div class="brand-name">Berry Sweet</div>
        <div class="brand-sub">Panel de administración</div>
      </div>
    </div>

    <!-- Menú -->
    <div class="nav-menu">
      <p class="menu-label">Gestión</p>
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-btn"
        :class="{ activo: isActive(item.path) }"
        @click="navigateTo(item.path)"
      >
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </button>
    </div>

    <!-- Separador -->
    <div class="sidebar-spacer"></div>

    <!-- Usuario -->
    <div class="user-card">
      <div class="user-avatar">{{ nombreUsuario.charAt(0).toUpperCase() }}</div>
      <div class="user-info">
        <div class="user-name">{{ nombreUsuario }}</div>
        <div class="user-role">{{ rolUsuario }}</div>
      </div>
    </div>

    <!-- Cerrar sesión -->
    <button class="btn-logout" @click="cerrarSesion">
      <i class="pi pi-sign-out"></i>
      <span>Cerrar Sesión</span>
    </button>
  </nav>
</template>

<style scoped>
.sidebar-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.25rem 1rem;
  background: linear-gradient(180deg, #fff0f5 0%, #fce4ec 100%);
  border-right: 2px solid #f8bbd0;
}

.hamburger-btn {
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: 44px;
  height: 44px;
  border: none;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border-radius: 10px;
  font-size: 1.3rem;
  cursor: pointer;
  z-index: 999;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.3);
}

.hamburger-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(233, 30, 140, 0.4);
}

.hamburger-btn:active {
  transform: scale(0.95);
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

/* Marca */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(233, 30, 140, 0.1);
}

.brand-icon {
  font-size: 2rem;
  line-height: 1;
}

.brand-name {
  font-weight: 800;
  font-size: 1.05rem;
  color: #c2185b;
  line-height: 1.2;
}

.brand-sub {
  font-size: 0.72rem;
  color: #f48fb1;
  font-weight: 500;
}

/* Menú */
.menu-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: #f48fb1;
  margin: 0 0 0.5rem 0.5rem;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #880e4f;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.15s,
    color 0.2s;
  text-align: left;
}

.nav-btn i {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  color: #f48fb1;
  transition: color 0.2s;
}

.nav-btn:hover {
  background: rgba(233, 30, 140, 0.08);
  transform: translateX(4px);
  color: #e91e8c;
}

.nav-btn:hover i {
  color: #e91e8c;
}

.nav-btn.activo {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transform: translateX(0);
}

.nav-btn.activo i {
  color: white;
}

/* Separador flexible */
.sidebar-spacer {
  flex: 1;
}

/* Usuario */
.user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 10px rgba(233, 30, 140, 0.08);
  border: 1px solid #fce4ec;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-weight: 700;
  font-size: 0.875rem;
  color: #880e4f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.72rem;
  color: #f06292;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Logout */
.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem;
  border: 1.5px solid #ffcdd2;
  border-radius: 10px;
  background: transparent;
  color: #e53e3e;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}

.btn-logout:hover {
  background: #e53e3e;
  color: white;
  border-color: #e53e3e;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(229, 62, 62, 0.3);
}

/* Tablet: Ajustes menores */
@media (max-width: 900px) {
  .sidebar-nav {
    padding: 1rem 0.8rem;
  }

  .sidebar-brand {
    gap: 0.6rem;
    padding: 0.7rem;
  }

  .brand-name {
    font-size: 0.98rem;
  }

  .brand-sub {
    font-size: 0.68rem;
  }

  .nav-btn {
    padding: 0.7rem 0.85rem;
    font-size: 0.86rem;
  }

  .nav-btn i {
    width: 18px;
  }

  .user-card {
    gap: 0.6rem;
    padding: 0.75rem;
  }

  .user-name {
    font-size: 0.82rem;
  }

  .user-role {
    font-size: 0.66rem;
  }

  .btn-logout {
    padding: 0.65rem;
    font-size: 0.82rem;
  }
}

/* Móvil: Sidebar colapsable */
@media (max-width: 768px) {
  .hamburger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar-overlay {
    display: block;
  }

  .sidebar-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: auto;
    bottom: 0;
    width: 280px;
    max-width: 85vw;
    height: 100vh;
    padding: 1rem 0.8rem;
    z-index: 100;
    border-right: 2px solid #f8bbd0;
    border-radius: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    overflow-y: auto;
  }

  .sidebar-nav.sidebar-open {
    transform: translateX(0);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  .sidebar-brand {
    margin-top: 0.5rem;
    margin-bottom: 1.2rem;
  }

  .nav-btn span {
    font-weight: 600;
  }

  .user-card {
    margin-bottom: 0.5rem;
  }

  .btn-logout {
    margin-top: auto;
  }
}

/* Móvil pequeño: Ajustes adicionales */
@media (max-width: 480px) {
  .hamburger-btn {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    top: 0.75rem;
    left: 0.75rem;
  }

  .sidebar-nav {
    width: 100%;
    max-width: 100%;
  }

  .sidebar-brand {
    gap: 0.6rem;
    padding: 0.65rem;
    margin-bottom: 1rem;
  }

  .brand-icon {
    font-size: 1.8rem;
  }

  .brand-name {
    font-size: 0.95rem;
  }

  .brand-sub {
    font-size: 0.65rem;
  }

  .menu-label {
    font-size: 0.65rem;
    margin-left: 0.3rem;
    margin-bottom: 0.3rem;
  }

  .nav-menu {
    gap: 0.2rem;
  }

  .nav-btn {
    padding: 0.65rem 0.8rem;
    font-size: 0.85rem;
  }

  .nav-btn i {
    font-size: 0.95rem;
    width: 18px;
  }

  .user-card {
    gap: 0.6rem;
    padding: 0.7rem;
    margin-bottom: 0.5rem;
  }

  .user-avatar {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }

  .user-name {
    font-size: 0.78rem;
  }

  .user-role {
    font-size: 0.62rem;
  }

  .btn-logout {
    padding: 0.6rem;
    font-size: 0.78rem;
    gap: 0.4rem;
  }

  .btn-logout i {
    font-size: 0.85rem;
  }
}
</style>
