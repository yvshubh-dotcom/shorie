// Global app utilities — loaded on all pages
document.addEventListener('DOMContentLoaded', () => {
  // Auto-dismiss flash messages after 4s
  document.querySelectorAll('[data-autohide]').forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 4000);
  });
});
