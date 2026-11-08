document.documentElement.classList.add('js');

document.querySelectorAll('[data-open]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.open).showModal());
});

// Close dialogs when clicking the backdrop
document.querySelectorAll('dialog').forEach((d) => {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
});

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// 3D tilt on portfolio cards (mouse only; purely decorative)
if (matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateZ(8px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
