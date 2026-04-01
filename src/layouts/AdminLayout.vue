<script setup lang="ts">
import SidebarAdmin from '@/components/admin/SidebarAdmin.vue'
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <SidebarAdmin />
    </aside>
    <main class="content">
      <section class="page">
        <router-view />
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.sidebar {
  border-right: 1px solid #fce4ec;
  height: 100vh;
  overflow-y: auto;
  position: sticky;
  top: 0;
  background: #fff0f5;
}

.content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  background: #fff9fb;
}

.page {
  padding: 0;
  flex: 1;
}

/* Responsive: ocultar sidebar en móvil si se necesita */
@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }
}
</style>
