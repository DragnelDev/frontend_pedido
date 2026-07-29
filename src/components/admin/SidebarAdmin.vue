<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

const emit = defineEmits<{ (e: 'close'): void }>()

const router = useRouter()
const route = useRoute()
const nombreUsuario = ref('')
const rolUsuario = ref('')
const imagenUsuario = ref('')

// Estado para controlar qué menús desplegables están abiertos
/*const menuAbierto = ref<string | null>('Contabilidad')

function toggleSubmenu(label: string) {
  menuAbierto.value = menuAbierto.value === label ? null : label
}*/

function isActive(path?: string) {
  if (!path) return false
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
    imagenUsuario.value = decoded?.imagenUrl || ''
  }
})

function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

function navigate(path?: string) {
  if (!path) return
  router.push(path)
  emit('close')
}

function irAlPerfil() {
  router.push('/admin/perfil-empleado')
  emit('close')
}

const navItems = [
  {
    title: 'OPERACIONES',
    items: [
      {
        label: 'Registrar Ventas',
        icon: 'pi pi-plus-circle',
        path: '/admin/registrar-venta',
      },
      {
        label: 'Pedidos En Línea',
        icon: 'pi pi-shopping-cart',
        path: '/admin/pedidos',
      },
      { label: 'Pagos', icon: 'pi pi-credit-card', path: '/admin/pagos' },
    ],
  },
  {
    title: 'CATÁLOGO E INVENTARIO',
    items: [
      { label: 'Productos', icon: 'pi pi-box', path: '/admin/productos' },
      { label: 'Categorías', icon: 'pi pi-tags', path: '/admin/categorias' },
      {
        label: 'Insumos / Recetas',
        icon: 'pi pi-list-check',
        path: '/admin/insumos',
      },
      {
        label: 'Cocina / Producción',
        icon: 'pi pi-shop',
        path: '/admin/cocina',
      },
    ],
  },
  {
    title: 'CONTABILIDAD Y CAJA',
    items: [
      {
        label: 'Cierre de Caja',
        icon: 'pi pi-money-bill',
        path: '/admin/contabilidad/caja',
      },
      {
        label: 'Gastos y Egresos',
        icon: 'pi pi-minus-circle',
        path: '/admin/contabilidad/gastos',
      },
      {
        label: 'Libro de Ventas',
        icon: 'pi pi-file-excel',
        path: '/admin/contabilidad/libro-ventas',
      },
    ],
  },
  {
    title: 'SISTEMA Y ACCESOS',
    items: [
      {
        label: 'Clientes (Portal)',
        icon: 'pi pi-users',
        path: '/admin/clientes',
      },
      {
        label: 'Usuarios / Roles',
        icon: 'pi pi-user-edit',
        path: '/admin/usuarios',
      },
      { label: 'Empleados', icon: 'pi pi-id-card', path: '/admin/empleados' },
      { label: 'Reportes', icon: 'pi pi-chart-bar', path: '/admin/reportes' },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        path: '/admin/configuracion',
      },
    ],
  },
]
</script>

<template>
  <nav class="sidebar-nav">
    <!-- Marca -->
    <div class="sidebar-brand">
      <div class="brand-icon">🍓</div>
      <div class="brand-text">
        <div class="brand-name">Berry Sweet</div>
        <div class="brand-sub">Panel de administración</div>
      </div>
    </div>

    <!-- Menú de navegación -->
    <div class="nav-menu">
      <template v-for="section in navItems" :key="section.title">
        <p class="menu-label">{{ section.title }}</p>
        <button
          v-for="item in section.items"
          :key="item.path"
          class="nav-btn"
          :class="{ activo: isActive(item.path) }"
          @click="navigate(item.path)"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </button>
      </template>
    </div>

    <!-- Separador flexible -->
    <div class="sidebar-spacer"></div>

    <!-- Tarjeta de usuario -->
    <div
      class="user-card interactiva"
      @click="irAlPerfil"
      role="button"
      tabindex="0"
      title="Ver mi perfil"
      @keydown.enter="irAlPerfil"
    >
      <div class="user-avatar">
        <img v-if="imagenUsuario" :src="imagenUsuario" :alt="nombreUsuario" class="avatar-img" />
        <span v-else class="avatar-inicial">{{ nombreUsuario.charAt(0).toUpperCase() }}</span>
      </div>
      <div class="user-info">
        <div class="user-name">{{ nombreUsuario }}</div>
        <div class="user-role">{{ rolUsuario }}</div>
      </div>
      <i class="pi pi-chevron-right icon-ir"></i>
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
  box-sizing: border-box;
  overflow-y: auto;
}

/* ── Marca ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(233, 30, 140, 0.1);
  flex-shrink: 0;
}

.brand-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.brand-text {
  min-width: 0;
}

.brand-name {
  font-weight: 800;
  font-size: 1.05rem;
  color: #c2185b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-sub {
  font-size: 0.72rem;
  color: #f48fb1;
  font-weight: 500;
  white-space: nowrap;
}

/* ── Menú ── */
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

.title {
  color: #880e4f;
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
  min-height: 44px;
}

.nav-btn i {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  color: #f48fb1;
  transition: color 0.2s;
  flex-shrink: 0;
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

/* ── Estilos Submenú ── */
.btn-desplegable {
  justify-content: space-between;
}

.btn-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.arrow-icon {
  font-size: 0.75rem !important;
  transition: transform 0.3s ease !important;
}

.arrow-icon.rotate {
  transform: rotate(180deg);
}

.submenu-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-left: 0.8rem;
  margin-top: 0.2rem;
  margin-bottom: 0.4rem;
}

.sub-btn {
  font-size: 0.85rem;
  padding: 0.6rem 0.8rem;
  min-height: 38px;
}

/* ── Separador ── */
.sidebar-spacer {
  flex: 1;
  min-height: 1.5rem;
}

/* ── Tarjeta de usuario ── */
.user-card.interactiva {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 10px rgba(233, 30, 140, 0.08);
  border: 1px solid #fce4ec;
  flex-shrink: 0;
  min-width: 0;
  cursor: pointer;
  transition: all 0.25s ease;
}

.user-card.interactiva:hover {
  background: #fff5f8;
  border-color: #f48fb1;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.15);
}

.icon-ir {
  font-size: 0.75rem;
  color: #f48fb1;
  transition: transform 0.2s;
}

.user-card.interactiva:hover .icon-ir {
  color: #e91e8c;
  transform: translateX(2px);
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
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-inicial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.user-info {
  min-width: 0;
  flex: 1;
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

/* ── Logout ── */
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
  min-height: 44px;
  transition:
    background 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
  flex-shrink: 0;
}

.btn-logout:hover {
  background: #e53e3e;
  color: white;
  border-color: #e53e3e;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(229, 62, 62, 0.3);
}
</style>
