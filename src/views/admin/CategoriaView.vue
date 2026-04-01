<script setup lang="ts">
import CategoriaList from '@/components/categoria/CategoriaList.vue'
import CategoriaSave from '@/components/categoria/CategoriaSave.vue'
import Button from 'primevue/button'
import { ref } from 'vue'

const mostrarDialog = ref(false)
const categoriaListRef = ref<typeof CategoriaList | null>(null)
const categoriaEdit = ref<any>(null)

function handleCreate() {
  categoriaEdit.value = null
  mostrarDialog.value = true
}

function handleEdit(categoria: any) {
  categoriaEdit.value = categoria
  mostrarDialog.value = true
}

function handleCloseDialog() {
  mostrarDialog.value = false
}

function handleGuardar() {
  categoriaListRef.value?.obtenerLista()
}
</script>

<template>
  <div class="admin-wrap">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon">
          <i class="pi pi-tags"></i>
        </div>
        <div>
          <h2 class="page-titulo">Categorías</h2>
          <p class="page-sub">Gestiona las categorías de productos</p>
        </div>
      </div>
      <button class="btn-crear" @click="handleCreate">
        <i class="pi pi-plus"></i>
        <span>Nueva categoría</span>
      </button>
    </div>

    <!-- Contenido -->
    <div class="page-content">
      <CategoriaList ref="categoriaListRef" @edit="handleEdit" />
    </div>

    <CategoriaSave
      :mostrar="mostrarDialog"
      :categoria="categoriaEdit"
      :modoEdicion="!!categoriaEdit"
      @guardar="handleGuardar"
      @close="handleCloseDialog"
    />
  </div>
</template>

<style scoped>
.admin-wrap {
  padding: 1.75rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
}

.page-titulo {
  font-size: 1.5rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0 0 0.2rem;
}

.page-sub {
  font-size: 0.85rem;
  color: #f48fb1;
  margin: 0;
}

.btn-crear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.65rem 1.4rem;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition:
    opacity 0.2s,
    transform 0.2s;
  white-space: nowrap;
}

.btn-crear:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(233, 30, 140, 0.4);
}

.page-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(233, 30, 140, 0.08);
  overflow: hidden;
  border: 1px solid #fce4ec;
}
</style>
