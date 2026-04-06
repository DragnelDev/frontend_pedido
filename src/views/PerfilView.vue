<script setup lang="ts">
import { ref, onMounted } from 'vue'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'
import router from '@/router'

const usuario = ref({
  id: 0,
  cliente: { id: 0, nombre: '', celular: '' },
  email: '',
})

const error = ref<string | null>(null)

onMounted(async () => {
  const token = getTokenFromLocalStorage()
  const payload = token ? parseJwt(token) : null

  if (!token) {
    alert('No estás logueado')
    router.replace('/login')
    return
  }

  try {
    const { data } = await http.get(`/usuarios/${payload?.sub}`)
    usuario.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar el perfil'
  }
})
</script>

<template>
  <div class="perfil-page">
    <section class="perfil-wrap">

      <div class="page-header">
        <span class="section-tag">👤 Mi cuenta</span>
        <h2 class="page-titulo">Mi Perfil</h2>
        <p class="page-sub">Información de tu cuenta Berry Sweet 🍓</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-msg">
        <i class="pi pi-exclamation-triangle"></i> {{ error }}
      </div>

      <!-- Perfil -->
      <div v-else class="profile-card">
        <div class="avatar">🍰</div>

        <div class="profile-row">
          <span class="row-label"><i class="pi pi-user"></i> Nombre</span>
          <span class="row-valor">{{ usuario.cliente.nombre || '—' }}</span>
        </div>

        <div class="profile-row">
          <span class="row-label"><i class="pi pi-envelope"></i> Correo</span>
          <span class="row-valor">{{ usuario.email || '—' }}</span>
        </div>

        <div class="profile-row">
          <span class="row-label"><i class="pi pi-phone"></i> Teléfono</span>
          <span class="row-valor">{{ usuario.cliente?.celular || 'No disponible' }}</span>
        </div>

        <RouterLink to="/mis-pedidos" class="btn-pedidos">
          📦 Ver mis pedidos
        </RouterLink>
      </div>

    </section>
  </div>
</template>

<style scoped>
.perfil-page {
  min-height: calc(100vh - 200px);
  padding: 3rem 1rem;
  background: linear-gradient(180deg, #fff9fb 0%, #fce4ec 100%);
  display: flex;
  justify-content: center;
}

.perfil-wrap {
  width: 100%;
  max-width: 520px;
}

.page-header { margin-bottom: 1.5rem; }

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
  font-size: 1.75rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.2rem;
}

.page-sub {
  font-size: 0.875rem;
  color: #f48fb1;
  margin: 0;
}

/* Card */
.profile-card {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.1);
  border: 1px solid #fce4ec;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Avatar */
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.3);
}

/* Filas */
.profile-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.9rem;
}

.profile-row:last-of-type { border-bottom: none; }

.row-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #c2185b;
  font-weight: 600;
}

.row-label .pi { font-size: 0.875rem; color: #f48fb1; }

.row-valor { color: #555; font-weight: 500; }

/* Botón */
.btn-pedidos {
  display: block;
  margin-top: 1.5rem;
  text-align: center;
  padding: 0.85rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: transform 0.2s, opacity 0.2s;
}

.btn-pedidos:hover {
  transform: translateY(-2px);
  opacity: 0.9;
  color: white;
}

/* Error */
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
</style>
