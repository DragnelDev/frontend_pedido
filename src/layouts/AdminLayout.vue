<script setup lang="ts">
import { ref } from 'vue'
import SidebarAdmin from '@/components/admin/SidebarAdmin.vue'

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="admin-layout">
    <!-- Topbar móvil -->
    <header class="mobile-topbar">
      <button class="hamburger" @click="toggleSidebar" aria-label="Abrir menú">
        <span :class="['bar', { open: sidebarOpen }]"></span>
        <span :class="['bar', { open: sidebarOpen }]"></span>
        <span :class="['bar', { open: sidebarOpen }]"></span>
      </button>
      <div class="topbar-brand">
        <span class="topbar-icon">🍓</span>
        <span class="topbar-name">Berry Sweet</span>
      </div>
    </header>

    <!-- Overlay oscuro en móvil -->
    <div
      class="sidebar-overlay"
      :class="{ visible: sidebarOpen }"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
      <SidebarAdmin @close="closeSidebar" />
    </aside>

    <!-- Contenido principal -->
    <main class="content">
      <section class="page">
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ── Layout base (desktop) ── */
.admin-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 1fr;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.mobile-topbar {
  display: none;
}

.sidebar {
  border-right: 1px solid #fce4ec;
  height: 100vh;
  overflow-y: auto;
  position: sticky;
  top: 0;
  background: #fff0f5;
  z-index: 200;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  background: #fff9fb;
}

.page {
  flex: 1;
}

.sidebar-overlay {
  display: none;
}

/* ── Responsive: tablet y móvil ── */
@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 56px 1fr;
    max-height: 100vh;
    overflow: hidden;
  }

  /* Topbar visible */
  .mobile-topbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 1rem;
    background: linear-gradient(135deg, #fff0f5, #fce4ec);
    border-bottom: 1px solid #f8bbd0;
    height: 56px;
    position: sticky;
    top: 0;
    z-index: 300;
    box-shadow: 0 2px 10px rgba(233, 30, 140, 0.1);
    grid-column: 1 / -1;
  }

  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .topbar-icon {
    font-size: 1.4rem;
  }

  .topbar-name {
    font-weight: 800;
    font-size: 1rem;
    color: #c2185b;
  }

  /* Botón hamburguesa */
  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 36px;
    height: 36px;
    background: white;
    border: none;
    border-radius: 8px;
    padding: 6px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(233, 30, 140, 0.15);
    flex-shrink: 0;
  }

  .bar {
    display: block;
    width: 100%;
    height: 2px;
    background: #c2185b;
    border-radius: 2px;
    transition: transform 0.3s ease, opacity 0.3s ease;
    transform-origin: center;
  }

  .bar:nth-child(1).open {
    transform: translateY(7px) rotate(45deg);
  }
  .bar:nth-child(2).open {
    opacity: 0;
    transform: scaleX(0);
  }
  .bar:nth-child(3).open {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* Sidebar deslizable */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 270px;
    transform: translateX(-100%);
    box-shadow: none;
    z-index: 400;
    grid-row: unset;
  }

  .sidebar--open {
    transform: translateX(0);
    box-shadow: 4px 0 30px rgba(233, 30, 140, 0.2);
  }

  /* Overlay */
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(136, 14, 79, 0.35);
    backdrop-filter: blur(2px);
    z-index: 350;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .sidebar-overlay.visible {
    opacity: 1;
    pointer-events: all;
  }

  /* Contenido ocupa toda la pantalla debajo del topbar */
  .content {
    height: calc(100vh - 56px);
    overflow-y: auto;
  }
}
</style>