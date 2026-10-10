/* Menú móvil de la Revista Colombiana de Medicina */
(function () {
  var b = document.querySelector('.menu-btn'), n = document.getElementById('menu');
  if (!b || !n) return;
  b.addEventListener('click', function () {
    var abierto = n.classList.toggle('abierto');
    b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
  n.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { n.classList.remove('abierto'); b.setAttribute('aria-expanded', 'false'); }
  });
})();
