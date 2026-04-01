<script setup lang="ts">
import { ref, onMounted } from 'vue'
import http from '@/plugins/axios'
import { getTokenFromLocalStorage, parseJwt } from '@/helpers'
import router from '@/router'

const usuario = ref({
  id: 0,
  cliente: {
    id: 0,
    nombre: '',
    celular: '',
  },
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
  <div class="perfil-container">
    <section class="profile-wrap">

      <header class="toolbar">
        <h2>Mi Perfil</h2>
        <p class="subtitle">Información de tu cuenta Berry Sweet 🍓</p>
      </header>

      <!-- Error -->
      <div v-if="error" class="alert error">
        {{ error }}
      </div>

      <!-- Perfil -->
      <div v-else class="profile-card">

        <div class="avatar">
          🍰
        </div>

        <div class="profile-row">
          <strong>Nombre</strong>
          <span>{{ usuario.cliente.nombre }}</span>
        </div>

        <div class="profile-row">
          <strong>Email</strong>
          <span>{{ usuario.email }}</span>
        </div>

        <div class="profile-row">
          <strong>Teléfono</strong>
          <span>{{ usuario.cliente?.celular || 'No disponible' }}</span>
        </div>

        <RouterLink to="/mis-pedidos" class="button">
          📦 Ver mis pedidos
        </RouterLink>

      </div>
    </section>
  </div>
</template>

<style scoped>

.perfil-container{
  min-height: calc(100vh - 200px);
  padding:40px 20px;
  display:flex;
  justify-content:center;
}

.profile-wrap{
  width:100%;
  max-width:520px;
}

/* Header */

.toolbar{
  text-align:center;
  margin-bottom:25px;
}

.toolbar h2{
  font-size:28px;
  font-weight:700;
  color:#880e4f;
}

.subtitle{
  font-size:14px;
  color:#f48fb1;
}

/* Card */

.profile-card{
  background:white;
  padding:30px;
  border-radius:16px;
  box-shadow:0 4px 14px rgba(233,30,140,0.08);
  border:1px solid #fce4ec;
  display:flex;
  flex-direction:column;
  gap:18px;
}

/* Avatar */

.avatar{
  width:70px;
  height:70px;
  border-radius:50%;
  background:linear-gradient(135deg,#e91e8c,#f06292);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:32px;
  color:white;
  margin:auto;
  margin-bottom:10px;
}

/* Filas */

.profile-row{
  display:flex;
  justify-content:space-between;
  padding-bottom:10px;
  border-bottom:1px solid #fce4ec;
  font-size:15px;
}

.profile-row strong{
  color:#c2185b;
}

.profile-row span{
  color:#555;
}

/* Botón */

.button{
  margin-top:15px;
  text-align:center;
  padding:12px;
  border-radius:50px;
  text-decoration:none;
  font-weight:700;
  color:white;
  background:linear-gradient(135deg,#e91e8c,#f06292);
  box-shadow:0 4px 12px rgba(233,30,140,0.3);
  transition:transform .2s,opacity .2s;
}

.button:hover{
  transform:translateY(-2px);
  opacity:.9;
}

/* Error */

.alert.error{
  background:#ffebee;
  color:#c62828;
  padding:12px;
  border-radius:10px;
  border-left:4px solid #e53935;
  font-weight:500;
}

</style>
