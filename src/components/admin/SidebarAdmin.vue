<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

const router = useRouter()
const route = useRoute()
const nombreUsuario = ref('')
const rolUsuario = ref('')

function isActive(path: string) {
  return route.path.startsWith(path)
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
  <nav class="sidebar-nav">
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
        @click="router.push(item.path)"
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
</style>
