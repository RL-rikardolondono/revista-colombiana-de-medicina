/* Buscador del archivo — Revista Colombiana de Medicina.
   Lee /datos/articulos.json y /datos/numeros.json y filtra en el navegador (sin servidor). */
(function () {
  var caja = document.getElementById('q'), res = document.getElementById('resultados'), todo = document.getElementById('archivo-completo');
  if (!caja || !res || !todo) return;
  var form = caja.form, datos = null, numeros = [];

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function nombreNumero(id) { for (var i = 0; i < numeros.length; i++) if (numeros[i].id === id) return numeros[i].titulo; return ''; }
  function texto(a) {
    return norm([a.titulo, a.tituloIngles, a.tipo, a.palabrasClave, a.keywords, a.resumen, a.abstract, a.anio, nombreNumero(a.numero),
      (a.autores || []).map(function (x) { return [x.nombre, x.institucion, x.ciudad].join(' '); }).join(' ')].join(' '));
  }
  function tarjeta(a) {
    var meta = [nombreNumero(a.numero) || a.anio];
    var autores = (a.autores || []).map(function (x) { return x.nombre; }).join(', ');
    return '<article class="card art"><span class="tag">' + esc(a.tipo) + '</span><span class="meta">' + esc(meta.join(' · ')) + '</span>' +
      '<h3><a href="/articulo/' + esc(a.slug) + '.html">' + esc(a.titulo) + '</a></h3><div class="meta">' + esc(autores) + '</div>' +
      '<div class="btns">' + (a.pdf ? '<a class="btn p" href="' + esc(a.pdf) + '" target="_blank" rel="noopener">⬇ PDF</a>' : '') +
      '<a class="btn s" href="/articulo/' + esc(a.slug) + '.html">Ver artículo</a></div></article>';
  }
  function buscar(q) {
    var palabras = norm(q).split(/\s+/).filter(Boolean);
    if (!palabras.length) { res.classList.add('oculto'); todo.classList.remove('oculto'); return; }
    var hallados = datos.filter(function (a) { var t = a._t || (a._t = texto(a)); return palabras.every(function (p) { return t.indexOf(p) >= 0; }); });
    res.innerHTML = '<p class="meta"><b>' + hallados.length + '</b> ' + (hallados.length === 1 ? 'artículo encontrado' : 'artículos encontrados') + ' para «' + esc(q) + '» · <a href="/archivo/" id="limpiar">Ver todo</a></p>' +
      (hallados.length ? hallados.map(tarjeta).join('') : '<p class="card">No hay artículos con esas palabras. Pruebe con otra palabra o con el apellido de un autor.</p>');
    res.classList.remove('oculto'); todo.classList.add('oculto');
    var l = document.getElementById('limpiar');
    if (l) l.addEventListener('click', function (e) { e.preventDefault(); caja.value = ''; poner(''); buscar(''); });
  }
  function poner(q) { try { history.replaceState(null, '', q ? '/archivo/?q=' + encodeURIComponent(q) : '/archivo/'); } catch (e) {} }

  Promise.all([fetch('/datos/articulos.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }),
    fetch('/datos/numeros.json', { cache: 'no-cache' }).then(function (r) { return r.json(); })]).then(function (r) {
    datos = (r[0] && r[0].articulos) || []; numeros = (r[1] && r[1].numeros) || r[1] || [];
    var inicial = new URLSearchParams(location.search).get('q') || '';
    if (inicial) { caja.value = inicial; buscar(inicial); }
    var t;
    caja.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { poner(caja.value.trim()); buscar(caja.value.trim()); }, 200); });
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); poner(caja.value.trim()); buscar(caja.value.trim()); });
  }).catch(function () { /* si falla la carga, el formulario sigue funcionando como enlace normal */ });
})();
