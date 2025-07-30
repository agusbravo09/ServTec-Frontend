/**
 * Módulo para manejar el menú hamburguesa y funcionalidades móviles
 */
export class MobileMenu {
  constructor() {
    this.menuToggle = document.getElementById('menuToggle');
    this.sidebar = document.getElementById('sidebar');
    this.overlay = document.getElementById('sidebarOverlay');
    
    // Inicialización automática al crear instancia
    this.init();
  }

  init() {
    if (!this.menuToggle || !this.sidebar || !this.overlay) {
      console.warn('Elementos del menú móvil no encontrados');
      return;
    }

    this.setupEventListeners();
    this.handleResponsiveBehavior();
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', this.handleResponsiveBehavior.bind(this));
  }

  setupEventListeners() {
    // Toggle del menú
    this.menuToggle.addEventListener('click', () => {
      this.toggleMenu();
    });

    // Cerrar al hacer clic en el overlay
    this.overlay.addEventListener('click', () => {
      this.closeMenu();
    });

    // Cerrar al hacer clic en enlaces (opcional)
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          this.closeMenu();
        }
      });
    });
  }

  toggleMenu() {
    this.sidebar.classList.toggle('active');
    this.overlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  }

  openMenu() {
    this.sidebar.classList.add('active');
    this.overlay.classList.add('active');
    document.body.classList.add('menu-open');
  }

  closeMenu() {
    this.sidebar.classList.remove('active');
    this.overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
  }

  handleResponsiveBehavior() {
    if (window.innerWidth > 768) {
      this.openMenu(); // Siempre abierto en desktop
    } else {
      this.closeMenu(); // Cerrado inicialmente en móvil
    }
  }
}