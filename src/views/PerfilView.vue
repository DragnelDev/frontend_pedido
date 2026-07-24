<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import http from "@/plugins/axios";
import { getTokenFromLocalStorage, parseJwt } from "@/helpers";

const router = useRouter();

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────
const cargando = ref(true);
const error = ref<string | null>(null);
const tabActiva = ref<"contacto" | "direcciones" | "favoritos">("contacto");

const usuario = ref({
  id: 0,
  imagenUrl: "",
  email: "",
  rol: "",
  activo: true,
  cliente: {
    id: 0,
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    celular: "",
    email: "",
    direccion: "",
  },
  empleado: null as any,
});

// Mock de Direcciones Guardadas (puedes conectarlo a tu API luego)
const direcciones = ref([
  {
    id: 1,
    etiqueta: "Casa",
    direccion: "Av. Arce, Edificio Los Pinos, La Paz",
    principal: true,
  },
  {
    id: 2,
    etiqueta: "Oficina",
    direccion: "Calle Calvo #120, Sucre",
    principal: false,
  },
]);

// Mock de Favoritos (puedes conectarlo a tu API luego)
const favoritos = ref([
  {
    id: 101,
    nombre: "Torta Tres Leches con Frutilla",
    precio: 120,
    imagen: "/images/torta-frutilla.jpg",
  },
  {
    id: 102,
    nombre: "Cupcakes de Chocolate x6",
    precio: 45,
    imagen: "/images/cupcakes.jpg",
  },
]);

// ─────────────────────────────────────────────────────────────────────────────
// Montaje
// ─────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const token = getTokenFromLocalStorage();
  const payload = token ? parseJwt(token) : null;

  if (!token || !payload?.sub) {
    router.replace("/login");
    return;
  }

  try {
    const { data } = await http.get(`/usuarios/${payload.sub}`);
    usuario.value = data;
  } catch (e: any) {
    error.value = e?.response?.data?.message || "No se pudo cargar el perfil";
  } finally {
    cargando.value = false;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const nombreCompleto = computed(() => {
  const c = usuario.value.cliente;
  if (!c?.nombre) return "—";
  return [c.nombre, c.apellidoPaterno, c.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
});

const inicial = computed(() => {
  const nombre = usuario.value.cliente?.nombre || usuario.value.email || "?";
  return nombre.charAt(0).toUpperCase();
});

const irAEditar = () => {
  router.push("/perfil/editar");
};

const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
};
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
          <!-- Hero / Encabezado del Perfil -->
          <div class="profile-hero">
            <div class="hero-actions-top">
              <button
                class="btn-icon-top"
                @click="irAEditar"
                title="Editar Perfil"
              >
                <i class="pi pi-pencil"></i>
              </button>
              <button
                class="btn-icon-top logout"
                @click="cerrarSesion"
                title="Cerrar Sesión"
              >
                <i class="pi pi-sign-out"></i>
              </button>
            </div>

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
              <span class="hero-email">{{ usuario.email || "—" }}</span>
              <div class="hero-badges">
                <span class="rol-badge">
                  {{ usuario.rol === "CLIENTE" ? "👤 Cliente" : usuario.rol }}
                </span>
                <span
                  class="activo-badge"
                  :class="usuario.activo ? 'activo' : 'inactivo'"
                >
                  <i
                    :class="
                      usuario.activo
                        ? 'pi pi-check-circle'
                        : 'pi pi-times-circle'
                    "
                  ></i>
                  {{ usuario.activo ? "Cuenta activa" : "Inactiva" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Pestañas (Tabs) de Selección -->
          <div class="tabs-bar">
            <button
              :class="{ activo: tabActiva === 'contacto' }"
              @click="tabActiva = 'contacto'"
            >
              <i class="pi pi-id-card"></i> Datos
            </button>
            <button
              :class="{ activo: tabActiva === 'direcciones' }"
              @click="tabActiva = 'direcciones'"
            >
              <i class="pi pi-map-marker"></i> Direcciones
            </button>
            <button
              :class="{ activo: tabActiva === 'favoritos' }"
              @click="tabActiva = 'favoritos'"
            >
              <i class="pi pi-heart"></i> Favoritos
            </button>
          </div>

          <!-- TAB 1: DATOS DE CONTACTO -->
          <div v-if="tabActiva === 'contacto'" class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <div
                  class="info-icon-wrap"
                  style="background: #fce4ec; color: #e91e8c"
                >
                  <i class="pi pi-user"></i>
                </div>
                <div>
                  <p class="info-label">Nombre completo</p>
                  <p class="info-valor">{{ nombreCompleto }}</p>
                </div>
              </div>

              <div class="info-item">
                <div
                  class="info-icon-wrap"
                  style="background: #e8eaf6; color: #3949ab"
                >
                  <i class="pi pi-envelope"></i>
                </div>
                <div>
                  <p class="info-label">Correo electrónico</p>
                  <p class="info-valor">{{ usuario.email || "—" }}</p>
                </div>
              </div>

              <div class="info-item">
                <div
                  class="info-icon-wrap"
                  style="background: #e8f5e9; color: #2e7d32"
                >
                  <i class="pi pi-phone"></i>
                </div>
                <div>
                  <p class="info-label">Celular</p>
                  <p class="info-valor">
                    {{ usuario.cliente?.celular || "No registrado" }}
                  </p>
                </div>
              </div>

              <div class="info-item">
                <div
                  class="info-icon-wrap"
                  style="background: #fff3e0; color: #e65100"
                >
                  <i class="pi pi-map-marker"></i>
                </div>
                <div>
                  <p class="info-label">Dirección Principal</p>
                  <p class="info-valor">
                    {{ usuario.cliente?.direccion || "No registrada" }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: DIRECCIONES GUARDADAS -->
          <div v-if="tabActiva === 'direcciones'" class="tab-content">
            <div class="tab-header-action">
              <span>Direcciones para entregas</span>
              <button class="btn-sm-primary">
                <i class="pi pi-plus"></i> Nueva
              </button>
            </div>

            <div class="list-cards">
              <div v-for="dir in direcciones" :key="dir.id" class="card-item">
                <div class="card-item-icon">
                  <i class="pi pi-building"></i>
                </div>
                <div class="card-item-info">
                  <strong
                    >{{ dir.etiqueta }}
                    <span v-if="dir.principal" class="badge-tag"
                      >Principal</span
                    ></strong
                  >
                  <p>{{ dir.direccion }}</p>
                </div>
                <button class="btn-icon-del">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 3: FAVORITOS -->
          <div v-if="tabActiva === 'favoritos'" class="tab-content">
            <div class="tab-header-action">
              <span>Productos guardados</span>
            </div>

            <div v-if="favoritos.length === 0" class="empty-state">
              <i class="pi pi-heart"></i>
              <p>Aún no tienes productos guardados en favoritos</p>
            </div>

            <div v-else class="fav-grid">
              <div v-for="fav in favoritos" :key="fav.id" class="fav-item">
                <div class="fav-info">
                  <strong>{{ fav.nombre }}</strong>
                  <span class="fav-precio">Bs. {{ fav.precio }}</span>
                </div>
                <button class="btn-sm-fav" title="Añadir al carrito">
                  <i class="pi pi-shopping-bag"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Acciones Principales (Boton para Ir a Mis Pedidos) -->
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
/* Base y Layout */
.perfil-page {
  min-height: 80vh;
  padding: 5rem 1rem 4rem;
  background: linear-gradient(160deg, #fff9fb 0%, #fce4ec 50%, #fff 100%);
  display: flex;
  justify-content: center;
}

.perfil-container {
  width: 100%;
  max-width: 540px;
}
.page-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

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

.page-titulo {
  font-size: clamp(1.5rem, 4vw, 1.9rem);
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.25rem;
}
.page-sub {
  font-size: 0.875rem;
  color: #f48fb1;
  margin: 0;
}

.profile-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #fce4ec;
  box-shadow: 0 8px 32px rgba(233, 30, 140, 0.1);
  overflow: hidden;
}

.profile-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 1.75rem 1.25rem;
  background: linear-gradient(135deg, #fff0f7, #fff9fb);
}

.hero-actions-top {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.btn-icon-top {
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
.btn-icon-top:hover {
  background: #e91e8c;
  color: white;
}
.btn-icon-top.logout {
  color: #e53935;
  border-color: #ffcdd2;
}
.btn-icon-top.logout:hover {
  background: #e53935;
  color: white;
}

.avatar-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 800;
  color: #e91e8c;
}
.hero-nombre {
  font-size: 1.1rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.15rem;
}
.hero-email {
  display: block;
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 0.5rem;
}
.hero-badges {
  display: flex;
  gap: 0.4rem;
}

.rol-badge {
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
.activo-badge.activo {
  background: #e8f5e9;
  color: #2e7d32;
}

/* Barra de Pestañas (Tabs) */
.tabs-bar {
  display: flex;
  background: #fff0f7;
  padding: 0.3rem;
  margin: 0.5rem 1.5rem 1rem;
  border-radius: 12px;
  gap: 0.3rem;
}

.tabs-bar button {
  flex: 1;
  padding: 0.6rem 0.3rem;
  border: none;
  background: transparent;
  color: #880e4f;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.tabs-bar button.activo {
  background: white;
  color: #e91e8c;
  box-shadow: 0 2px 8px rgba(233, 30, 140, 0.15);
}

/* Estilos de Contenido de Tabs */
.tab-content {
  padding: 0 1.5rem 1rem;
}
.tab-header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #880e4f;
  margin-bottom: 0.75rem;
}
.btn-sm-primary {
  background: #e91e8c;
  color: white;
  border: none;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

/* Tarjetas de Direcciones */
.list-cards {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.card-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #fff9fb;
  border: 1px solid #fce4ec;
  border-radius: 12px;
}
.card-item-icon {
  width: 32px;
  height: 32px;
  background: #fce4ec;
  color: #e91e8c;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-item-info {
  flex: 1;
  font-size: 0.8rem;
}
.card-item-info p {
  margin: 0;
  color: #666;
  font-size: 0.75rem;
}
.badge-tag {
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  margin-left: 0.4rem;
}
.btn-icon-del {
  background: none;
  border: none;
  color: #e53935;
  cursor: pointer;
  padding: 0.3rem;
}

/* Grid Favoritos */
.fav-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.fav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.8rem;
  background: #fff9fb;
  border: 1px solid #fce4ec;
  border-radius: 12px;
}
.fav-info strong {
  display: block;
  font-size: 0.82rem;
  color: #333;
}
.fav-precio {
  font-size: 0.78rem;
  font-weight: 700;
  color: #e91e8c;
}
.btn-sm-fav {
  background: #fce4ec;
  color: #c2185b;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: #bbb;
  font-size: 0.85rem;
}
.empty-state i {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: #f8bbd0;
}

/* Info grid Contacto */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #fce4ec;
}
.info-item:nth-last-child(-n + 2) {
  border-bottom: none;
}
.info-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.info-label {
  font-size: 0.7rem;
  color: #bbb;
  font-weight: 600;
  margin: 0 0 0.1rem;
  text-transform: uppercase;
}
.info-valor {
  font-size: 0.85rem;
  font-weight: 600;
  color: #444;
  margin: 0;
  word-break: break-word;
}

/* Acciones Footer */
.card-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #fce4ec, transparent);
  margin: 0 1.75rem;
}
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
  transition: all 0.2s;
}
.btn-accion.primario {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.3);
}
.btn-accion.secundario {
  background: #fce4ec;
  color: #c2185b;
  border: 1.5px solid #f8bbd0;
}

@media (max-width: 480px) {
  .profile-hero {
    flex-direction: column;
    text-align: center;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
