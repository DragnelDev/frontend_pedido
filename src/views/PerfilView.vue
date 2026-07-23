<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'

const router = useRouter()

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const cargando = ref(true)
const error    = ref<string | null>(null)

const usuario = ref({
  id:      0,
  imagenUrl: '',
  email:   '',
  rol:     '',
  activo:  true,
  cliente: { id: 0, nombre: '', apellidoPaterno: '', apellidoMaterno: '', celular: '', email: '', direccion: '' },
  empleado: null as any,
})

// ─────────────────────────────────────────────────────────────────────────────
// Montaje
// ─────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const token   = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null

  if (!token || !payload?.sub) {
    router.replace('/login')
    return
  }

  try {
    const { data } = await http.get(`/usuarios/${payload.sub}`)
    usuario.value  = data
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el perfil'
  } finally {
    cargando.value = false
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const nombreCompleto = computed(() => {
  const c = usuario.value.cliente
  if (!c?.nombre) return '—'
  return [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ')
})

const inicial = computed(() => {
  const nombre = usuario.value.cliente?.nombre || usuario.value.email || '?'
  return nombre.charAt(0).toUpperCase()
})

// Para editar perfil - Cliente
const irAEditar = () => {
  router.push('/perfil/editar') // O la ruta que vayas a definir para el formulario
}
</script>

<template>
  <div class="perfil-page">

    <!-- ── Cargando ──────────────────────────────────────────────────────── -->
    <div v-if="cargando" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p>Cargando perfil...</p>
    </div>

    <section v-else class="perfil-container">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="page-header">
        <span class="section-tag">Mi cuenta</span>
        <h2 class="page-titulo">Mi Perfil</h2>
        <p class="page-sub">Información de tu cuenta en Berry Sweet 🍓</p>
      </div>

      <!-- ── Error ──────────────────────────────────────────────────────── -->
      <div v-if="error" class="error-banner">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
      </div>

      <template v-else>

        <!-- ── Card de perfil ──────────────────────────────────────────── -->
        <div class="profile-card">

          <!-- Avatar + nombre -->
          <div class="profile-hero">
            <!-- Botón de edición en la esquina -->
  <button class="btn-editar-flotante" @click="irAEditar" title="Editar Perfil">
    <i class="pi pi-pencil"></i>
  </button>
            <div class="avatar-ring">
              <img 
                v-if="usuario.imagenUrl" 
                :src="usuario.imagenUrl" 
                :alt="nombreCompleto" 
                class="avatar-img"
              />
              <div v-else class="avatar">{{ inicial }}</div>
            </div>
            <div class="profile-hero-info">
              <h3 class="hero-nombre">{{ nombreCompleto }}</h3>
              <span class="hero-email">{{ usuario.email || '—' }}</span>
              <div class="hero-badges">
                <span class="rol-badge">
                  {{ usuario.rol === 'CLIENTE' ? '👤 Cliente' : usuario.rol === 'EMPLEADO' ? '👔 Empleado' : usuario.rol }}
                </span>
                <span class="activo-badge" :class="usuario.activo ? 'activo' : 'inactivo'">
                  <i :class="usuario.activo ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  {{ usuario.activo ? 'Cuenta activa' : 'Cuenta inactiva' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="card-divider"></div>

          <!-- Datos de contacto -->
          <div class="seccion-titulo-mini">
            <i class="pi pi-id-card"></i> Datos de contacto
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-icon-wrap" style="background:#fce4ec; color:#e91e8c">
                <i class="pi pi-user"></i>
              </div>
              <div>
                <p class="info-label">Nombre completo</p>
                <p class="info-valor">{{ nombreCompleto }}</p>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon-wrap" style="background:#e8eaf6; color:#3949ab">
                <i class="pi pi-envelope"></i>
              </div>
              <div>
                <p class="info-label">Correo electrónico</p>
                <p class="info-valor">{{ usuario.email || '—' }}</p>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon-wrap" style="background:#e8f5e9; color:#2e7d32">
                <i class="pi pi-phone"></i>
              </div>
              <div>
                <p class="info-label">Celular</p>
                <p class="info-valor">{{ usuario.cliente?.celular || 'No registrado' }}</p>
              </div>
            </div>

            <div class="info-item">
              <div class="info-icon-wrap" style="background:#fff3e0; color:#e65100">
                <i class="pi pi-map-marker"></i>
              </div>
              <div>
                <p class="info-label">Dirección</p>
                <p class="info-valor">{{ usuario.cliente?.direccion || 'No registrada' }}</p>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="card-divider"></div>

          <div class="acciones-wrap">
            <RouterLink to="/mis-pedidos" class="btn-accion primario">
              <i class="pi pi-list"></i>
              Ver mis pedidos
            </RouterLink>
            <RouterLink to="/productos" class="btn-accion secundario">
              <i class="pi pi-shopping-bag"></i>
              Seguir comprando
            </RouterLink>
          </div>

        </div>

      </template>
    </section>
  </div>
</template>

<style scoped>
/* ── Base ───────────────────────────────────────────────────────────────────── */
.perfil-page {
  min-height: 80vh;
  padding: 3rem 1rem 4rem;
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 50%, #fff 100%);
  display: flex;
  justify-content: center;
}

/* ── Loading ────────────────────────────────────────────────────────────────── */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #f48fb1;
  font-size: 0.9rem;
}

.loading-spinner {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 3px solid #fce4ec;
  border-top-color: #e91e8c;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Contenedor ─────────────────────────────────────────────────────────────── */
.perfil-container {
  width: 100%;
  max-width: 540px;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.page-header { margin-bottom: 1.5rem; }

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

.page-titulo { font-size: clamp(1.5rem, 4vw, 1.9rem); font-weight: 800; color: #880e4f; margin: 0 0 0.25rem; }
.page-sub    { font-size: 0.875rem; color: #f48fb1; margin: 0; }

/* ── Error ──────────────────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #ffebee;
  color: #c62828;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border-left: 4px solid #e53935;
  font-weight: 600;
  font-size: 0.875rem;
}

/* ── Profile card ───────────────────────────────────────────────────────────── */
.profile-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #fce4ec;
  box-shadow: 0 8px 32px rgba(233, 30, 140, 0.1);
  overflow: hidden;
}

/* Hero */
.profile-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.75rem 1.75rem 1.5rem;
  background: linear-gradient(135deg, #fff0f7, #fff9fb);
}

.btn-editar-flotante {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border: 1px solid #f8bbd0;
  color: #e91e8c;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.15);
  transition: all 0.2s ease;
}

.btn-editar-flotante:hover {
  background: #e91e8c;
  color: white;
  transform: scale(1.05);
}

.avatar-ring {
  width: 72px; height: 72px;
  border-radius: 50%;
  padding: 3px; 
  background: linear-gradient(135deg, #e91e8c, #f06292);
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 👈 Esto hace que la foto se recorte proporcionalmente sin deformarse */
  border-radius: 50%;
}

.avatar {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem;
  font-weight: 800;
  color: #e91e8c;
}

.profile-hero-info { flex: 1; min-width: 0; }

.hero-nombre {
  font-size: 1.1rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-email {
  display: block;
  font-size: 0.8rem;
  color: #bbb;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.rol-badge {
  display: inline-block;
  background: #fce4ec;
  color: #c2185b;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 50px;
}

.activo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 50px;
}

.activo-badge.activo   { background: #e8f5e9; color: #2e7d32; }
.activo-badge.inactivo { background: #fce4ec; color: #c62828; }

/* Divider */
.card-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #fce4ec, transparent);
  margin: 0 1.75rem;
}

/* Sección título */
.seccion-titulo-mini {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #f48fb1;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 1rem 1.75rem 0.5rem;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 0 1.25rem 0.75rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #fce4ec;
}

.info-item:nth-last-child(-n+2) { border-bottom: none; }

.info-icon-wrap {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.info-label { font-size: 0.7rem; color: #bbb; font-weight: 600; margin: 0 0 0.1rem; text-transform: uppercase; letter-spacing: 0.3px; }
.info-valor { font-size: 0.85rem; font-weight: 600; color: #444; margin: 0; word-break: break-word; }

/* Acciones */
.acciones-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem 1.75rem 1.75rem;
}

.btn-accion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  transition: opacity 0.2s, transform 0.2s;
}

.btn-accion.primario {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.3);
}

.btn-accion.primario:hover { opacity: 0.9; transform: translateY(-2px); color: white; }

.btn-accion.secundario {
  background: #fce4ec;
  color: #c2185b;
  border: 1.5px solid #f8bbd0;
}

.btn-accion.secundario:hover { background: #f8bbd0; color: #c2185b; }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .profile-hero { flex-direction: column; text-align: center; }
  .hero-badges  { justify-content: center; }
  .info-grid    { grid-template-columns: 1fr; }
  .info-item:nth-last-child(-n+2) { border-bottom: 1px solid #fce4ec; }
  .info-item:last-child           { border-bottom: none; }
}
</style>
