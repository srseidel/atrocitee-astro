// Simple mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      // Toggle the hidden class
      mobileMenu.classList.toggle('hidden');
      
      // Update aria-expanded attribute
      const isExpanded = !mobileMenu.classList.contains('hidden');
      menuButton.setAttribute('aria-expanded', isExpanded.toString());
    });
  }
}); 