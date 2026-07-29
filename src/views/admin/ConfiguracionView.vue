<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { configuracionService } from '@/servicios/configuracionService'

// ── ESTADOS DE LA EMPRESA ──
const empresa = ref({
  nombre: 'Berry Sweet',
  nit: '',
  direccion: '',
  telefonoWhatsapp: '',
  emailContacto: '',
  logoUrl: '',
})

const logoPreview = ref<string | null>(null)

// ── ESTADOS DE MÉTODOS DE PAGO ──
const metodosPago = ref({
  qr: {
    activo: false,
    banco: '',
    titular: '',
    imagenQrUrl: '',
  },
  transferencia: {
    activo: false,
    banco: '',
    tipoCuenta: '',
    numeroCuenta: '',
    titular: '',
    ciNit: '',
  },
  efectivo: {
    activo: true,
    descripcion: 'Pago contra entrega o en sucursal',
  },
})

const qrPreview = ref<string | null>(null)
const cargando = ref(true)
const guardando = ref(false)
const exitoMensaje = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const config = await configuracionService.obtener()
    empresa.value = {
      nombre: config.nombre || 'Berry Sweet',
      nit: config.nit || '',
      direccion: config.direccion || '',
      telefonoWhatsapp: config.telefonoWhatsapp || '',
      emailContacto: config.emailContacto || '',
      logoUrl: config.logoUrl || '',
    }
    metodosPago.value = config.metodosPago
    logoPreview.value = config.logoUrl || null
    qrPreview.value = config.metodosPago?.qr?.imagenQrUrl || null
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo cargar la configuración'
  } finally {
    cargando.value = false
  }
})

// ── MANEJO DE IMÁGENES ──
// Nota: por ahora se usa una URL local de vista previa. La subida real del
// archivo al backend se conecta con el módulo de /uploads cuando se defina
// el flujo definitivo de imágenes de configuración.
function handleLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    logoPreview.value = URL.createObjectURL(file)
  }
}

function handleQrUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    qrPreview.value = URL.createObjectURL(file)
  }
}

// ── GUARDAR CONFIGURACIÓN ──
async function guardarConfiguracion() {
  guardando.value = true
  exitoMensaje.value = false
  error.value = null

  try {
    await configuracionService.actualizar({
      ...empresa.value,
      metodosPago: metodosPago.value,
    })
    exitoMensaje.value = true

    setTimeout(() => {
      exitoMensaje.value = false
    }, 4000)
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Error al guardar la configuración'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="config-container">
    <!-- Encabezado de la Sección -->
    <div class="header-section">
      <div class="header-title">
        <div class="header-icon">⚙️</div>
        <div>
          <h2>Configuración del Sistema</h2>
          <p>Gestiona la información del negocio y los métodos de pago para los clientes</p>
        </div>
      </div>
      <button class="btn-primary" @click="guardarConfiguracion" :disabled="guardando || cargando">
        <i v-if="!guardando" class="pi pi-save"></i>
        <span v-else class="loading-spinner"></span>
        {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </div>

    <!-- Alerta de Error -->
    <div v-if="error" class="alert-error">
      <i class="pi pi-exclamation-circle"></i>
      {{ error }}
    </div>

    <!-- Alerta de Éxito -->
    <transition name="fade">
      <div v-if="exitoMensaje" class="alert-success">
        <i class="pi pi-check-circle"></i>
        ¡Configuración guardada exitosamente!
      </div>
    </transition>

    <p v-if="cargando" class="empty-text">Cargando configuración...</p>

    <div v-else class="grid-layout">
      <!-- SECCIÓN 1: DATOS DE LA EMPRESA -->
      <div class="card">
        <div class="card-header">
          <i class="pi pi-building card-icon"></i>
          <h3>Datos de la Empresa</h3>
        </div>

        <div class="card-body">
          <!-- Carga de Logo -->
          <div class="logo-upload-container">
            <div class="logo-preview">
              <img v-if="logoPreview" :src="logoPreview" alt="Logo de la Pastelería" />
              <div v-else class="logo-placeholder">
                <span>🍓</span>
              </div>
            </div>
            <div class="logo-actions">
              <label for="logo-input" class="btn-upload">
                <i class="pi pi-upload"></i> Cambiar Logo
              </label>
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                @change="handleLogoUpload"
                hidden
              />
              <span class="upload-hint">Formato recomendado: PNG o JPG (Máx. 2MB)</span>
            </div>
          </div>

          <!-- Formulario de Empresa -->
          <div class="form-grid">
            <div class="field-group">
              <label for="nombre">Nombre de la Pastelería</label>
              <input id="nombre" v-model="empresa.nombre" type="text" class="field-input" />
            </div>

            <div class="field-group">
              <label for="nit">NIT / CI</label>
              <input id="nit" v-model="empresa.nit" type="text" class="field-input" />
            </div>

            <div class="field-group full-width">
              <label for="direccion">Dirección Física (Sucre, Bolivia)</label>
              <div class="input-wrap">
                <i class="pi pi-map-marker input-icon"></i>
                <input
                  id="direccion"
                  v-model="empresa.direccion"
                  type="text"
                  class="field-input icon-padding"
                />
              </div>
            </div>

            <div class="field-group">
              <label for="whatsapp">Teléfono de WhatsApp (Pedidos)</label>
              <div class="input-wrap">
                <i class="pi pi-whatsapp input-icon"></i>
                <input
                  id="whatsapp"
                  v-model="empresa.telefonoWhatsapp"
                  type="text"
                  class="field-input icon-padding"
                />
              </div>
            </div>

            <div class="field-group">
              <label for="email">Correo Electrónico de Contacto</label>
              <div class="input-wrap">
                <i class="pi pi-envelope input-icon"></i>
                <input
                  id="email"
                  v-model="empresa.emailContacto"
                  type="email"
                  class="field-input icon-padding"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: MÉTODOS DE PAGO -->
      <div class="card">
        <div class="card-header">
          <i class="pi pi-wallet card-icon"></i>
          <h3>Métodos de Pago</h3>
        </div>

        <div class="card-body">
          <!-- PAGO POR QR -->
          <div class="payment-method-block">
            <div class="method-header">
              <div class="method-title">
                <i class="pi pi-qrcode"></i>
                <strong>Pago mediante Código QR (Simple / BCB)</strong>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="metodosPago.qr.activo" />
                <span class="slider"></span>
              </label>
            </div>

            <div v-if="metodosPago.qr.activo" class="method-content">
              <div class="qr-upload-grid">
                <div class="qr-preview-box">
                  <img v-if="qrPreview" :src="qrPreview" alt="Código QR de Pago" />
                  <div v-else class="qr-placeholder">
                    <i class="pi pi-qrcode"></i>
                    <span>Sin imagen QR</span>
                  </div>
                </div>
                <div class="qr-details">
                  <label for="qr-input" class="btn-upload btn-sm">
                    <i class="pi pi-upload"></i> Cargar Imagen del QR
                  </label>
                  <input
                    id="qr-input"
                    type="file"
                    accept="image/*"
                    @change="handleQrUpload"
                    hidden
                  />

                  <div class="field-group margin-top">
                    <label>Banco u Entidad</label>
                    <input v-model="metodosPago.qr.banco" type="text" class="field-input" />
                  </div>
                  <div class="field-group">
                    <label>Titular de la Cuenta</label>
                    <input v-model="metodosPago.qr.titular" type="text" class="field-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- TRANSFERENCIA BANCARIA -->
          <div class="payment-method-block">
            <div class="method-header">
              <div class="method-title">
                <i class="pi pi-building-columns"></i>
                <strong>Transferencia Bancaria Directa</strong>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="metodosPago.transferencia.activo" />
                <span class="slider"></span>
              </label>
            </div>

            <div v-if="metodosPago.transferencia.activo" class="method-content form-grid">
              <div class="field-group">
                <label>Banco</label>
                <input v-model="metodosPago.transferencia.banco" type="text" class="field-input" />
              </div>
              <div class="field-group">
                <label>Tipo de Cuenta</label>
                <input
                  v-model="metodosPago.transferencia.tipoCuenta"
                  type="text"
                  class="field-input"
                />
              </div>
              <div class="field-group">
                <label>Nº de Cuenta</label>
                <input
                  v-model="metodosPago.transferencia.numeroCuenta"
                  type="text"
                  class="field-input"
                />
              </div>
              <div class="field-group">
                <label>Titular de la Cuenta</label>
                <input
                  v-model="metodosPago.transferencia.titular"
                  type="text"
                  class="field-input"
                />
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- PAGO EN EFECTIVO -->
          <div class="payment-method-block">
            <div class="method-header">
              <div class="method-title">
                <i class="pi pi-money-bill"></i>
                <strong>Pago en Efectivo / Contra Entrega</strong>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="metodosPago.efectivo.activo" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── CONTENEDOR PRINCIPAL ── */
.config-container {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  color: #333;
}

/* ── HEADER ── */
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2.2rem;
  background: #fce4ec;
  padding: 0.6rem;
  border-radius: 16px;
}

.header-title h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: #880e4f;
  margin: 0;
}

.header-title p {
  font-size: 0.875rem;
  color: #888;
  margin: 0.2rem 0 0 0;
}

/* ── BOTÓN GUARDAR ── */
.btn-primary {
  background: linear-gradient(135deg, #e91e8c, #f06292);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 0.75rem 1.75rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 14px rgba(233, 30, 140, 0.3);
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(233, 30, 140, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* ── LAYOUT ── */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
}

/* ── TARJETAS (CARDS) ── */
.card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid #f8bbd0;
  overflow: hidden;
}

.card-header {
  background: #fff9fb;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #fce4ec;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-icon {
  font-size: 1.2rem;
  color: #e91e8c;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #880e4f;
}

.card-body {
  padding: 1.5rem;
}

/* ── LOGO UPLOAD ── */
.logo-upload-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #fce4ec;
}

.logo-preview {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 2px dashed #f48fb1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff9fb;
  flex-shrink: 0;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-size: 2.5rem;
}

.logo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fce4ec;
  color: #c2185b;
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
  width: fit-content;
}

.btn-upload:hover {
  background: #f8bbd0;
}

.btn-sm {
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
}

.upload-hint {
  font-size: 0.75rem;
  color: #999;
}

/* ── FORMULARIOS ── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.full-width {
  grid-column: span 2;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-group label {
  font-size: 0.825rem;
  font-weight: 600;
  color: #880e4f;
}

.field-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1.5px solid #f8bbd0;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #fff9fb;
  transition: border-color 0.2s;
}

.field-input:focus {
  border-color: #e91e8c;
  background: white;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  color: #f48fb1;
  font-size: 0.9rem;
}

.icon-padding {
  padding-left: 2.4rem;
}

/* ── MÉTODOS DE PAGO ── */
.payment-method-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.method-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.method-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #880e4f;
  font-size: 0.95rem;
}

.method-content {
  background: #fff9fb;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #fce4ec;
}

.divider {
  border: none;
  border-top: 1px solid #fce4ec;
  margin: 1.2rem 0;
}

/* QR Upload Layout */
.qr-upload-grid {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.qr-preview-box {
  width: 120px;
  height: 120px;
  border: 2px dashed #f48fb1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  flex-shrink: 0;
  overflow: hidden;
}

.qr-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  color: #ccc;
  font-size: 0.75rem;
}

.qr-placeholder i {
  font-size: 2rem;
  color: #f48fb1;
}

.qr-details {
  flex: 1;
}

.margin-top {
  margin-top: 0.75rem;
}

/* ── SWITCH INTERRUPTOR ── */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #e91e8c;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* ── ALERTAS ── */
.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.empty-text {
  color: #999;
  font-size: 0.9rem;
  padding: 2rem 0;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Spinner de carga */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* ── RESPONSIVE ── */
@media (max-width: 600px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: span 1;
  }

  .qr-upload-grid {
    flex-direction: column;
    align-items: center;
  }

  .qr-details {
    width: 100%;
  }
}
</style>
