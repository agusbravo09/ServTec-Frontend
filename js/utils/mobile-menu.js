/**
 * Módulo optimizado para manejar el menú hamburguesa
 */
export class MobileMenu {
  constructor() {
    this.elements = {
      menuToggle: document.getElementById('menuToggle'),
      sidebar: document.getElementById('sidebar'),
      overlay: document.getElementById('sidebarOverlay'),
      links: document.querySelectorAll('.sidebar-menu a')
    };

    this.init();
  }

  init() {
    const { menuToggle, sidebar, overlay } = this.elements;
    if (!menuToggle || !sidebar || !overlay) {
      console.warn('Elementos del menú móvil no encontrados');
      return;
    }

    this.setupEventListeners();
    this.handleResponsiveBehavior();
    window.addEventListener('resize', this.handleResponsiveBehavior.bind(this));
  }

  setupEventListeners() {
    const { menuToggle, overlay, links } = this.elements;

    menuToggle.addEventListener('click', this.toggleMenu.bind(this));
    overlay.addEventListener('click', this.closeMenu.bind(this));
    
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) this.closeMenu();
      });
    });
  }

  toggleMenu() {
    const { sidebar, overlay } = this.elements;
    [sidebar, overlay, document.body].forEach(el => 
      el.classList.toggle('active'));
  }

  openMenu() {
    const { sidebar, overlay } = this.elements;
    [sidebar, overlay, document.body].forEach(el => 
      el.classList.add('active'));
  }

  closeMenu() {
    const { sidebar, overlay } = this.elements;
    [sidebar, overlay, document.body].forEach(el => 
      el.classList.remove('active'));
  }

  handleResponsiveBehavior() {
    window.innerWidth > 768 ? this.openMenu() : this.closeMenu();
  }
}