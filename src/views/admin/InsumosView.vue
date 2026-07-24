<script setup lang="ts">
import { ref, computed } from "vue";

const insumos = ref([
  {
    id: 1,
    nombre: "Harina de Trigo",
    categoria: "Secos",
    stock: 12.5,
    unidad: "kg",
    stockMinimo: 10,
  },
  {
    id: 2,
    nombre: "Frutillas Frescas",
    categoria: "Frutas",
    stock: 3.0,
    unidad: "kg",
    stockMinimo: 5,
  },
  {
    id: 3,
    nombre: "Cajas para Tortas 25cm",
    categoria: "Empaques",
    stock: 45,
    unidad: "uds",
    stockMinimo: 20,
  },
]);

const buscar = ref("");

const insumosFiltrados = computed(() => {
  return insumos.value.filter((i) =>
    i.nombre.toLowerCase().includes(buscar.value.toLowerCase()),
  );
});
</script>

<template>
  <div class="modulo-container">
    <div class="header-section">
      <div>
        <h2>Control de Insumos y Materia Prima</h2>
        <p>Gestión de inventario para la preparación de pasteles y empaques</p>
      </div>
      <button class="btn-primary">
        <i class="pi pi-plus"></i> Nuevo Insumo
      </button>
    </div>

    <div class="card">
      <div class="card-header">
        <input
          v-model="buscar"
          placeholder="Buscar insumo..."
          class="field-input-sm"
        />
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in insumosFiltrados" :key="item.id">
              <td>
                <strong>{{ item.nombre }}</strong>
              </td>
              <td>
                <span class="badge-cat">{{ item.categoria }}</span>
              </td>
              <td>
                <strong>{{ item.stock }} {{ item.unidad }}</strong>
              </td>
              <td>{{ item.stockMinimo }} {{ item.unidad }}</td>
              <td>
                <span
                  :class="
                    item.stock <= item.stockMinimo ? 'status-low' : 'status-ok'
                  "
                >
                  {{
                    item.stock <= item.stockMinimo ? "⚠️ Reponer" : "✓ Normal"
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modulo-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.header-section h2 {
  margin: 0;
  color: #880e4f;
}
.header-section p {
  margin: 0;
  color: #888;
  font-size: 0.85rem;
}
.card {
  background: white;
  border-radius: 20px;
  border: 1px solid #f8bbd0;
  overflow: hidden;
}
.card-header {
  padding: 1rem;
  background: #fff9fb;
  border-bottom: 1px solid #fce4ec;
}
.field-input-sm {
  padding: 0.5rem 0.9rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 8px;
  width: 250px;
}
.btn-primary {
  background: #e91e8c;
  color: white;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 50px;
  font-weight: 700;
  cursor: pointer;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 0.85rem;
  text-align: left;
  border-bottom: 1px solid #fce4ec;
  font-size: 0.9rem;
}
.data-table th {
  color: #880e4f;
  background: #fff9fb;
}
.badge-cat {
  background: #fce4ec;
  color: #c2185b;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
}
.status-ok {
  color: #2e7d32;
  font-weight: bold;
}
.status-low {
  color: #c62828;
  font-weight: bold;
  background: #ffebee;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
}
</style>
