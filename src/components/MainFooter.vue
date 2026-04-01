<template>
  <footer class="footer">
    <!-- Bloque principal -->
    <div class="footer-main">
      <div class="container footer-grid">
        <!-- Marca -->
        <div class="footer-col">
          <div class="footer-logo">🍓 Berry Sweet</div>
          <p class="footer-desc">
            Pastelería artesanal en Sucre, Bolivia. Endulzamos tus momentos más especiales con amor
            y los mejores ingredientes.
          </p>
          <div class="footer-social">
            <a href="#" aria-label="Instagram"><i class="pi pi-instagram"></i></a>
            <a href="#" aria-label="Facebook"><i class="pi pi-facebook"></i></a>
            <a href="#" aria-label="WhatsApp"><i class="pi pi-whatsapp"></i></a>
            <a href="#" aria-label="Email"><i class="pi pi-envelope"></i></a>
          </div>
        </div>

        <!-- Links rápidos -->
        <div class="footer-col">
          <h6 class="footer-heading">Navegación</h6>
          <ul class="footer-links">
            <li><RouterLink to="/">Inicio</RouterLink></li>
            <li><RouterLink to="/productos">Productos</RouterLink></li>
            <li><RouterLink to="/carrito">Carrito</RouterLink></li>
            <li><RouterLink to="/perfil">Mi cuenta</RouterLink></li>
          </ul>
        </div>

        <!-- Contacto -->
        <div class="footer-col">
          <h6 class="footer-heading">Contáctanos</h6>
          <ul class="footer-contact">
            <li><i class="pi pi-map-marker"></i> Sucre, Bolivia</li>
            <li><i class="pi pi-phone"></i> (591) 67399831</li>
            <li><i class="pi pi-envelope"></i> info@berrysweet.bo</li>
            <li><i class="pi pi-clock"></i> Lun–Sáb: 8:00 – 20:00</li>
          </ul>
        </div>

        <!-- Galería / Instagram preview -->
        <div class="footer-col">
          <h6 class="footer-heading">Síguenos en Instagram</h6>
          <div class="instagram-grid">
            <div class="ig-thumb" v-for="n in 6" :key="n">
              <i class="pi pi-image"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p class="mb-0">
          &copy; 2026 <strong>Berry Sweet</strong> — Pastelería artesanal, Sucre, Bolivia. Hecho con
          🍰 y mucho amor.
        </p>
        <p class="mb-0 footer-credits">
          Proyecto: Aplicación Web para Pedidos en Línea · Gestión 2026
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(180deg, #3d0022 0%, #880e4f 100%);
  color: rgba(255, 255, 255, 0.85);
  margin-top: auto;
}

/* Grid principal */
.footer-main {
  padding: 3.5rem 0 2.5rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2.5rem;
}

.footer-col {
  display: flex;
  flex-direction: column;
}

/* Logo */
.footer-logo {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.85rem;
  letter-spacing: -0.5px;
}

.footer-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 1.25rem;
}

.footer-social {
  display: flex;
  gap: 0.75rem;
}

.footer-social a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 0.95rem;
  text-decoration: none;
  transition:
    background 0.2s,
    transform 0.2s;
}

.footer-social a:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(-2px);
}

/* Headings */
.footer-heading {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #f48fb1;
  margin-bottom: 1rem;
}

/* Links */
.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  font-size: 0.9rem;
  transition:
    color 0.2s,
    padding-left 0.2s;
}

.footer-links a:hover {
  color: #f8bbd0;
  padding-left: 6px;
}

/* Contacto */
.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.footer-contact li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.72);
}

.footer-contact .pi {
  color: #f48fb1;
  font-size: 0.9rem;
  width: 16px;
  flex-shrink: 0;
}

/* Instagram grid */
.instagram-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}

.ig-thumb {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}

.ig-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Footer bottom */
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.1rem 0;
  background: rgba(0, 0, 0, 0.2);
}

.footer-bottom-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.footer-credits {
  font-style: italic;
  font-size: 0.75rem;
}

@media (max-width: 576px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.75rem;
  }

  .footer-bottom-inner {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 380px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
