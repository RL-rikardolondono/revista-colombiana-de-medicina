/* Revista Colombiana de Medicina — generador único de páginas.
   Lo usan el panel /admin y el armado inicial: todo lo que convierte datos en HTML está aquí,
   para que el resultado sea siempre igual. Plataforma desarrollada por SkyNet Genesis. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Formato = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  var SITIO = 'https://revistacolombianademedicina.com';
  var VERSION = '3';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var WA_SOPORTE_TXT = 'Hola, vengo de la Revista Colombiana de Medicina y tengo una consulta.';

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Texto del editor -> HTML seguro. Línea en blanco = párrafo; "## " = subtítulo; "- " = viñeta;
  // **texto** = negrita; las direcciones web se vuelven enlaces.
  function enlazar(t) {
    t = esc(t);
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g, function (u) {
      var externo = u.indexOf(SITIO) !== 0;
      return '<a href="' + u + '"' + (externo ? ' target="_blank" rel="noopener"' : '') + '>' + u + '</a>';
    });
    return t;
  }
  function textoAHtml(texto) {
    var bloques = String(texto || '').replace(/\r/g, '').split(/\n\s*\n/);
    var html = [];
    bloques.forEach(function (b) {
      b = b.trim();
      if (!b) return;
      var lineas = b.split('\n');
      if (lineas.every(function (l) { return /^\s*[-•]\s+/.test(l); })) {
        html.push('<ul>' + lineas.map(function (l) { return '<li>' + enlazar(l.replace(/^\s*[-•]\s+/, '')) + '</li>'; }).join('') + '</ul>');
      } else if (/^##\s+/.test(b) && lineas.length === 1) {
        html.push('<h3>' + enlazar(b.replace(/^##\s+/, '')) + '</h3>');
      } else {
        html.push('<p>' + lineas.map(enlazar).join('<br>') + '</p>');
      }
    });
    return html.join('\n');
  }
  function enLinea(t) { return enlazar(String(t || '').replace(/\s*\n\s*/g, ' ')); }
  function textoPlano(texto, max) {
    var t = String(texto || '').replace(/^##\s+/gm, '').replace(/^\s*[-•]\s+/gm, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    if (max && t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '') + '…';
    return t;
  }
  function fechaLarga(iso) {
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    if (p.length < 3) return '';
    return parseInt(p[2], 10) + ' de ' + MESES[parseInt(p[1], 10) - 1] + ' de ' + p[0];
  }
  function slugify(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
  }
  function soloNumeros(t) { return String(t || '').replace(/\D/g, '').replace(/^57(?=\d{10}$)/, ''); }

  // ---------- Artículos y números ----------
  function numeroPorId(numeros, id) {
    var l = (numeros && numeros.numeros) || [];
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }
  function ordenarArticulos(lista) {
    return lista.slice().sort(function (a, b) {
      var pa = a.paginaInicio || 0, pb = b.paginaInicio || 0;
      if ((a.orden || 0) !== (b.orden || 0)) return (a.orden || 0) - (b.orden || 0);
      if (pa !== pb) return pa - pb;
      return String(a.titulo).localeCompare(String(b.titulo));
    });
  }
  function articulosDe(arts, idNumero) { return ordenarArticulos((arts || []).filter(function (a) { return (a.numero || '') === idNumero; })); }
  function ordenarNumeros(numeros) {
    return ((numeros && numeros.numeros) || []).slice().sort(function (a, b) {
      return (b.anio - a.anio) || (b.volumen - a.volumen) || (b.numero - a.numero);
    });
  }
  function rangoPaginas(a) {
    if (a.paginaInicio && a.paginaFin) return a.paginaInicio + '-' + a.paginaFin;
    return '';
  }
  function nombresAutores(a) { return (a.autores || []).map(function (x) { return x.nombre; }).join(', '); }
  function instituciones(a) {
    var v = [];
    (a.autores || []).forEach(function (x) { if (x.institucion && v.indexOf(x.institucion) < 0) v.push(x.institucion); });
    return v.join(' · ');
  }
  // "Londoño González, Ricardo" -> "Londoño González, R."
  function autorAPA(x) {
    var c = x.citacion || x.nombre || '';
    var p = c.split(',');
    if (p.length < 2) return c.trim();
    var ini = p[1].trim().split(/\s+/).filter(Boolean).map(function (n) { return n[0].toUpperCase() + '.'; }).join(' ');
    return p[0].trim() + ', ' + ini;
  }
  function autoresAPA(a) {
    var l = (a.autores || []).map(autorAPA);
    if (l.length <= 1) return l.join('');
    return l.slice(0, -1).join(', ') + ', & ' + l[l.length - 1];
  }
  function urlArticulo(a) { return SITIO + '/articulo/' + a.slug + '.html'; }
  // html=true devuelve HTML ya escapado (con el nombre de la revista en cursiva).
  function comoCitar(a, numeros, html) {
    var e = html ? esc : function (x) { return String(x); };
    var n = numeroPorId(numeros, a.numero);
    var rev = html ? '<i>Revista Colombiana de Medicina</i>' : 'Revista Colombiana de Medicina';
    var t = e(autoresAPA(a) + ' (' + a.anio + '). ' + String(a.titulo).replace(/\.$/, '') + '. ') + rev;
    var resto = '';
    if (n) {
      resto += ', Nueva época, ' + n.volumen + '(' + n.numero + ')';
      if (rangoPaginas(a)) resto += ', ' + rangoPaginas(a);
    }
    return t + e(resto + '. ' + urlArticulo(a));
  }
  function lineaMeta(a, numeros, conRef) {
    var n = numeroPorId(numeros, a.numero);
    var partes = [n ? n.titulo : 'Archivo · ' + a.anio];
    if (rangoPaginas(a)) partes.push('pp. ' + rangoPaginas(a));
    if (a.paginas) partes.push(a.paginas + ' páginas');
    if (conRef && a.referencias) partes.push(a.referencias + ' referencias');
    return partes.join(' · ');
  }

  // ---------- Armazón ----------
  var LOGO = '<svg viewBox="0 0 64 64" width="42" height="42" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="14" fill="#0B4F8A"/><path d="M32 14v36M14 32h36" stroke="#14A38B" stroke-width="9" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="#FFFFFF"/></svg>';
  var SKY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="22" height="22" aria-hidden="true"><rect x="4" y="4" width="192" height="192" rx="46" fill="#0B4F8A"/><g stroke="#FFFFFF" stroke-linecap="round"><polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" fill="none" stroke-opacity=".35" stroke-width="4"/><path d="M100 100L100 42M100 100L150.2 71M100 100L150.2 129M100 100L100 158M100 100L49.8 129M100 100L49.8 71" stroke-width="6"/></g><g fill="#FFFFFF"><circle cx="150.2" cy="71" r="10"/><circle cx="150.2" cy="129" r="10"/><circle cx="100" cy="158" r="10"/><circle cx="49.8" cy="129" r="10"/><circle cx="49.8" cy="71" r="10"/></g><circle cx="100" cy="42" r="13" fill="#14A38B"/><circle cx="100" cy="100" r="20" fill="#14A38B"/></svg>';
  var MENU = [['numero', '/#numero', 'Número actual'], ['archivo', '/#archivo', 'Archivo'], ['servicios', '/#servicios', 'Formación'], ['autores', '/#autores', 'Para autores'], ['comite', '/#comite', 'Comité editorial'], ['contacto', '/#contacto', 'Contacto']];

  function cabecera(s) {
    return '<a class="salto" href="#contenido">Saltar al contenido</a>\n<header class="top"><div class="in">' +
      '<a class="brand" href="/">' + LOGO + '<span><b>' + esc(s.nombre) + '</b><small>ISSN ' + esc(s.issnLinea) + ' (en línea) · ISSN ' + esc(s.issnImpreso) + ' (impreso)</small></span></a>' +
      '<button class="menu-btn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '<nav id="menu" aria-label="Principal">' + MENU.map(function (m) { return '<a href="' + m[1] + '">' + m[2] + '</a>'; }).join('') + '</nav>' +
      '</div></header>';
  }
  function pie(s) {
    var f = (s.formacion && s.formacion.cursos) || {};
    return '<footer><div class="in"><div><b>' + esc(s.nombre) + '</b><br>' + esc((s.ciudad || '').split(',')[0]) + ', Colombia · ISSN ' + esc(s.issnLinea) + ' (en línea) · ISSN ' + esc(s.issnImpreso) + ' (impreso)<br>' +
      'Contenido de acceso abierto bajo licencia <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.es" rel="license">CC BY-NC 4.0</a>.<br>' +
      (s.comite && s.comite.asesoria && s.comite.asesoria.nombre ? 'Con la asesoría científica de la ' + esc(s.comite.asesoria.nombre) + '.<br>' : '') +
      (f.enlace ? '<a href="' + esc(f.enlace) + '" target="_blank" rel="noopener">Formación continua – POLIANDES</a>' : '') +
      '</div><div class="sky">' + SKY + '<span>Plataforma desarrollada por SkyNet Genesis<br><a href="mailto:contacto@skynetgenesis.com">contacto@skynetgenesis.com</a> · WhatsApp 304 437 5758</span></div></div></footer>';
  }
  function documento(s, op) {
    var titulo = op.titulo ? op.titulo + ' | ' + s.nombre : s.nombre;
    var wa = soloNumeros((s.contacto && s.contacto.whatsappSoporte) || '3044375758');
    return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(titulo) + '</title>\n' +
      '<meta name="description" content="' + esc(op.descripcion) + '">\n' +
      (op.noindex ? '<meta name="robots" content="noindex">\n' : '') +
      (op.meta || '') +
      '<link rel="canonical" href="' + SITIO + op.ruta + '">\n' +
      '<meta property="og:type" content="' + (op.tipo || 'website') + '">\n' +
      '<meta property="og:site_name" content="' + esc(s.nombre) + '">\n' +
      '<meta property="og:title" content="' + esc(op.titulo || s.nombre) + '">\n' +
      '<meta property="og:description" content="' + esc(op.descripcion) + '">\n' +
      '<meta property="og:url" content="' + SITIO + op.ruta + '">\n' +
      '<meta property="og:locale" content="es_CO">\n' +
      '<meta name="theme-color" content="#0B4F8A">\n' +
      '<link rel="icon" href="/assets/img/icono.svg" type="image/svg+xml">\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="/assets/css/estilo.css?v=' + VERSION + '">\n' +
      '</head>\n<body>\n' + cabecera(s) + '\n' + (op.antes || '') + '<main id="contenido">\n' + op.cuerpo + '\n</main>\n' + pie(s) + '\n' +
      '<a class="wa" href="https://wa.me/57' + wa + '?text=' + encodeURIComponent(WA_SOPORTE_TXT) + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">💬 WhatsApp</a>\n' +
      '<script src="/assets/js/sitio.js?v=' + VERSION + '" defer></script>\n' +
      '<script data-goatcounter="https://revistacolombianademedicina.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>\n' +
      '</body>\n</html>\n';
  }
  function cabezaSeccion(titulo, meta, h) {
    h = h || 'h2';
    return '<div class="issue"><' + h + '>' + esc(titulo) + '</' + h + '>' + (meta ? '<span class="meta">' + esc(meta) + '</span>' : '') + '</div>';
  }
  function lista(items, ordenada) {
    var t = ordenada ? 'ol' : 'ul';
    return '<' + t + (ordenada ? ' class="n"' : '') + '>' + (items || []).map(function (i) { return '<li>' + enLinea(i) + '</li>'; }).join('') + '</' + t + '>';
  }
  function botonDiplomado(d) {
    return '<a class="btn ' + (d.esWhatsapp ? 'w' : 'p') + '" href="' + esc(d.enlace) + '" target="_blank" rel="noopener">' + esc(d.textoBoton || 'Más información') + '</a>';
  }
  function cajaDiplomado(d) {
    if (!d || !d.mostrar) return '';
    return '<div class="svc"><span class="lbl">Formación relacionada</span><h3>' + esc(d.titulo) + '</h3><p>' + enLinea(d.texto) + '</p>' +
      (d.enlace ? '<div class="btns">' + botonDiplomado(d) + '</div>' : '') + '</div>';
  }

  function tarjetaArticulo(a, numeros) {
    var meta = [a.anio];
    if (rangoPaginas(a)) meta.push('pp. ' + rangoPaginas(a));
    if (a.paginas) meta.push(a.paginas + ' páginas');
    return '<article class="card art"><span class="tag">' + esc(a.tipo) + '</span><span class="meta">' + esc(meta.join(' · ')) + '</span>' +
      '<h3><a href="/articulo/' + esc(a.slug) + '.html">' + esc(a.titulo) + '</a></h3>' +
      '<div class="meta">' + esc(nombresAutores(a)) + (instituciones(a) ? ' — ' + esc(instituciones(a)) : '') + '</div>' +
      (a.resumen ? '<details><summary>Ver resumen</summary><p>' + esc(a.resumen) + '</p>' + (a.palabrasClave ? '<p class="k"><b>Palabras clave:</b> ' + esc(a.palabrasClave) + '</p>' : '') + '</details>' : '') +
      '<div class="btns">' + (a.pdf ? '<a class="btn p" href="' + esc(a.pdf) + '" target="_blank" rel="noopener">⬇ PDF</a>' : '') +
      '<a class="btn s" href="/articulo/' + esc(a.slug) + '.html">Ver artículo</a></div></article>';
  }

  // ---------- Portada ----------
  function paginaInicio(s, numeros, artsDatos) {
    var arts = (artsDatos && artsDatos.articulos) || [];
    var actual = numeroPorId(numeros, s.numeroActual);
    var conv = s.convocatoria || {};
    var avisos = (s.avisos || []).filter(function (x) { return x && x.texto; });
    var chips = '<span class="chip a">' + esc(s.etiquetaEpoca) + '</span>' +
      (conv.mostrar ? '<a class="chip a" href="#autores">' + esc(conv.etiqueta || 'Convocatoria abierta') + '</a>' : '') +
      '<span class="chip">ISSN ' + esc(s.issnLinea) + ' (en línea)</span><span class="chip">ISSN ' + esc(s.issnImpreso) + ' (impreso)</span>' +
      '<span class="chip">Acceso abierto</span><span class="chip">' + esc((s.ciudad || '').split(',')[0]) + ', Colombia</span>';
    var heroe = '<div class="hero"><div class="in"><h1>' + esc(s.nombre) + '</h1><p>' + esc(s.descripcion) + '</p><div class="chips">' + chips + '</div></div></div>';

    var c = '';
    if (avisos.length) c += '<section class="avisos" aria-label="Avisos">' + avisos.map(function (x) {
      return '<div class="aviso-web">' + enLinea(x.texto) + (x.enlace ? ' <a href="' + esc(x.enlace) + '"' + (x.enlace.indexOf(SITIO) === 0 || x.enlace[0] === '/' ? '' : ' target="_blank" rel="noopener"') + '>' + esc(x.textoEnlace || 'Ver más') + ' →</a>' : '') + '</div>';
    }).join('') + '</section>';
    var ed = s.editorial || {};
    if (ed.mostrar && ed.texto) c += '<section class="card"><h2>' + esc(ed.titulo) + '</h2>' + textoAHtml(ed.texto) + (ed.firma ? '<p class="meta">— ' + esc(ed.firma) + '</p>' : '') + '</section>';

    if (actual) {
      var la = articulosDe(arts, actual.id);
      c += '<section id="numero">' + cabezaSeccion(actual.titulo, [actual.periodo, actual.tema ? 'Tema central: ' + actual.tema : ''].filter(Boolean).join(' · ')) +
        (la.length ? la.map(function (a) { return tarjetaArticulo(a, numeros); }).join('') : '<p class="card meta">Los artículos de este número se publicarán pronto.</p>') + '</section>';
    }
    // Archivo: números anteriores + artículos de etapas anteriores
    var anteriores = ordenarNumeros(numeros).filter(function (n) { return !actual || n.id !== actual.id; });
    var sueltos = ordenarArticulos(arts.filter(function (a) { return !a.numero; })).sort(function (a, b) { return (b.anio - a.anio) || ((a.orden || 0) - (b.orden || 0)); });
    if (anteriores.length || sueltos.length) {
      c += '<section id="archivo">' + cabezaSeccion('Archivo', 'Números anteriores y artículos de etapas anteriores de la revista');
      anteriores.forEach(function (n) {
        var la = articulosDe(arts, n.id);
        if (!la.length) return;
        c += '<h3 class="subnum">' + esc(n.titulo) + (n.periodo ? ' <span class="meta">· ' + esc(n.periodo) + '</span>' : '') + '</h3>' + la.map(function (a) { return tarjetaArticulo(a, numeros); }).join('');
      });
      if (sueltos.length) c += (anteriores.length ? '<h3 class="subnum">Etapas anteriores</h3>' : '') + sueltos.map(function (a) { return tarjetaArticulo(a, numeros); }).join('');
      c += '</section>';
    }
    // Formación
    var fm = s.formacion || {}, d = fm.diplomado, cu = fm.cursos;
    if ((d && d.mostrar) || (cu && cu.mostrar)) {
      c += '<section id="servicios">' + cabezaSeccion('Formación continua', 'Programas de instituciones aliadas de la revista');
      if (d && d.mostrar) c += '<div class="svcg">' + cajaDiplomado(d) + '</div>';
      if (cu && cu.mostrar) {
        c += '<div class="card" style="margin-top:14px">' + (cu.etiqueta ? '<span class="tag">' + esc(cu.etiqueta) + '</span>' : '') + '<h3>' + esc(cu.titulo) + '</h3>' + (cu.texto ? '<p>' + enLinea(cu.texto) + '</p>' : '') +
          '<div class="grid">' + (cu.grupos || []).map(function (g) { return '<div><h4>' + esc(g.titulo) + '</h4>' + lista(g.items) + '</div>'; }).join('') + '</div>' +
          (cu.textoGold ? '<div class="cite" id="gold-cursos">' + enLinea(cu.textoGold) + '</div>' : '') +
          (cu.enlace ? '<div class="btns"><a class="btn p" href="' + esc(cu.enlace) + '" target="_blank" rel="noopener">' + esc(cu.textoBoton || 'Ver cursos') + '</a></div>' : '') + '</div>';
      }
      c += '</section>';
    }
    // Para autores
    var au = s.autores || {}, correo = (s.contacto && s.contacto.correo) || '';
    c += '<section id="autores">' + cabezaSeccion('Para autores', 'Convocatoria permanente');
    if (conv.mostrar) {
      var notas = [];
      if (conv.fechaLimite) notas.push('**Fecha límite:** ' + fechaLarga(conv.fechaLimite) + '.');
      if (conv.fechaPublicacion) notas.push('**Publicación prevista:** ' + fechaLarga(conv.fechaPublicacion) + '.');
      notas = notas.concat(conv.notas || []);
      c += '<div class="card destacada"><span class="tag">' + esc(conv.etiqueta ? conv.etiqueta.split('·')[0].trim() : 'Convocatoria abierta') + '</span><h3>' + esc(conv.titulo) + '</h3>' + textoAHtml(conv.texto) + lista(notas) +
        (correo ? '<div class="btns"><a class="btn p" href="mailto:' + esc(correo) + '?subject=' + encodeURIComponent(conv.asuntoCorreo || 'Manuscrito') + '">✉ Enviar manuscrito</a></div>' : '') + '</div>';
    }
    c += '<div class="grid"><div class="card"><h3>Tipos de artículo</h3>' + lista(au.tipos) + '</div><div class="card"><h3>Proceso editorial</h3>' + lista(au.proceso, true) + '</div><div class="card"><h3>Requisitos del manuscrito</h3>' + lista(au.requisitos) + '</div></div>';
    if (au.etica) c += '<div class="card"><h3>Ética y licencia</h3>' + textoAHtml(au.etica) + (correo ? '<div class="btns"><a class="btn p" href="mailto:' + esc(correo) + '?subject=' + encodeURIComponent('Envío de manuscrito - Revista Colombiana de Medicina') + '">✉ Enviar manuscrito</a></div>' : '') + '</div>';
    c += '</section>';
    // Comité
    var co = s.comite || {};
    c += '<section id="comite">' + cabezaSeccion('Comité editorial') + '<div class="grid">';
    if (co.editorJefe && co.editorJefe.nombre) c += '<div class="card"><h3>Editor jefe</h3><p><b>' + esc(co.editorJefe.nombre) + '</b>' + (co.editorJefe.detalle ? '<br><span class="meta">' + esc(co.editorJefe.detalle) + '</span>' : '') + '</p></div>';
    (co.miembros || []).forEach(function (m) { c += '<div class="card"><h3>' + esc(m.cargo || 'Comité científico') + '</h3><p><b>' + esc(m.nombre) + '</b>' + (m.detalle ? '<br><span class="meta">' + esc(m.detalle) + '</span>' : '') + '</p></div>'; });
    if (co.textoCientifico) c += '<div class="card"><h3>Comité científico</h3><p class="meta">' + enLinea(co.textoCientifico) + '</p></div>';
    if (co.asesoria && co.asesoria.nombre) c += '<div class="card"><h3>Asesoría científica</h3><p><b>' + esc(co.asesoria.nombre) + '</b>' + (co.asesoria.detalle ? '<br><span class="meta">' + esc(co.asesoria.detalle) + '</span>' : '') + '</p></div>';
    c += '</div></section>';
    // Contacto
    c += '<section id="contacto">' + cabezaSeccion('Contacto') + '<div class="card"><p><b>' + esc(s.nombre) + '</b><br>' + esc(s.ciudad) + (correo ? '<br>Correo editorial: <a href="mailto:' + esc(correo) + '">' + esc(correo) + '</a>' : '') + '</p></div></section>';

    var ld = { '@context': 'https://schema.org', '@type': 'Periodical', name: s.nombre, issn: [s.issnLinea, s.issnImpreso], url: SITIO + '/', inLanguage: 'es', isAccessibleForFree: true, publisher: { '@type': 'Organization', name: 'Fundación Reina Elizabeth ONG' } };
    return documento(s, { ruta: '/', descripcion: s.nombre + ' — publicación científica de acceso abierto. ISSN ' + s.issnLinea + ' (en línea), ISSN ' + s.issnImpreso + ' (impreso).', antes: heroe,
      meta: '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>\n', cuerpo: c });
  }

  // ---------- Página de artículo ----------
  function paginaArticulo(s, numeros, a) {
    var n = numeroPorId(numeros, a.numero);
    var meta = '';
    meta += '<meta name="citation_title" content="' + esc(a.titulo) + '">\n';
    (a.autores || []).forEach(function (x) {
      meta += '<meta name="citation_author" content="' + esc(x.citacion || x.nombre) + '">\n';
      if (x.institucion) meta += '<meta name="citation_author_institution" content="' + esc(x.institucion) + '">\n';
    });
    meta += '<meta name="citation_publication_date" content="' + esc(a.anio) + '">\n';
    meta += '<meta name="citation_journal_title" content="' + esc(s.nombre) + '">\n';
    meta += '<meta name="citation_issn" content="' + esc(s.issnLinea) + '">\n';
    if (n) meta += '<meta name="citation_volume" content="' + esc(n.volumen) + '">\n<meta name="citation_issue" content="' + esc(n.numero) + '">\n';
    if (a.paginaInicio) meta += '<meta name="citation_firstpage" content="' + esc(a.paginaInicio) + '">\n';
    if (a.paginaFin) meta += '<meta name="citation_lastpage" content="' + esc(a.paginaFin) + '">\n';
    meta += '<meta name="citation_language" content="es">\n';
    if (a.pdf) meta += '<meta name="citation_pdf_url" content="' + SITIO + esc(a.pdf) + '">\n';
    if (a.palabrasClave) meta += '<meta name="citation_keywords" content="' + esc(a.palabrasClave) + '">\n';
    meta += '<meta name="DC.rights" content="CC BY-NC 4.0">\n';

    var autores = (a.autores || []).map(function (x) { return '<b>' + esc(x.nombre) + '</b>' + (x.institucion ? '<br><span class="meta">' + esc(x.institucion) + '</span>' : ''); }).join('<br>');
    var c = '<p class="meta miga"><a href="/">Inicio</a> › ' + esc(n ? n.titulo : 'Archivo · ' + a.anio) + '</p>' +
      '<article class="card"><span class="tag">' + esc(a.tipo) + '</span><h1 class="titulo-art">' + esc(a.titulo) + '</h1>' +
      '<p>' + autores + '</p><p class="meta">' + esc(lineaMeta(a, numeros, true)) + '</p>' +
      (a.resumen ? '<h2>Resumen</h2><p>' + esc(a.resumen) + '</p>' : '') +
      (a.palabrasClave ? '<p class="k"><b>Palabras clave:</b> ' + esc(a.palabrasClave) + '</p>' : '') +
      (a.abstract ? '<h2>Abstract</h2><p lang="en">' + esc(a.abstract) + '</p>' + (a.keywords ? '<p class="k" lang="en"><b>Keywords:</b> ' + esc(a.keywords) + '</p>' : '') : '') +
      (a.pdf ? '<div class="btns"><a class="btn p" href="' + esc(a.pdf) + '" target="_blank" rel="noopener">⬇ Descargar PDF</a></div>' : '') +
      '<h2 style="margin-top:22px">Cómo citar</h2><div class="cite">' + comoCitar(a, numeros, true) + '</div>' +
      '<p class="k" style="margin-top:14px">Licencia: Creative Commons Atribución-NoComercial 4.0 Internacional.</p></article>' +
      (a.diplomado ? cajaDiplomado(s.formacion && s.formacion.diplomado) : '') +
      (a.pdf ? '<object data="' + esc(a.pdf) + '" type="application/pdf" width="100%" height="820" class="visor"><p class="card">Su navegador no muestra el PDF aquí. <a href="' + esc(a.pdf) + '">Descárguelo</a>.</p></object>' : '');
    return documento(s, { ruta: '/articulo/' + a.slug + '.html', titulo: a.titulo, tipo: 'article', descripcion: textoPlano(a.resumen, 300) || a.titulo, meta: meta, cuerpo: c });
  }

  function pagina404(s) {
    var c = '<section class="card" style="text-align:center"><h1>No encontramos esta página</h1><p>Es posible que la dirección haya cambiado.</p><div class="btns" style="justify-content:center"><a class="btn p" href="/">Ir al inicio</a><a class="btn s" href="/#archivo">Ver el archivo</a></div></section>';
    return documento(s, { ruta: '/404.html', titulo: 'Página no encontrada', descripcion: 'Página no encontrada', cuerpo: c, noindex: true });
  }

  function mapaDelSitio(arts) {
    var urls = ['/'];
    ordenarArticulos(arts).forEach(function (a) { urls.push('/articulo/' + a.slug + '.html'); });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(function (u) { return '<url><loc>' + SITIO + u + '</loc></url>'; }).join('\n') + '\n</urlset>\n';
  }

  // Devuelve {ruta: contenido} con TODAS las páginas generadas.
  function generarTodo(s, numeros, artsDatos) {
    var arts = (artsDatos && artsDatos.articulos) || [];
    var out = {};
    out['index.html'] = paginaInicio(s, numeros, artsDatos);
    out['404.html'] = pagina404(s);
    arts.forEach(function (a) { out['articulo/' + a.slug + '.html'] = paginaArticulo(s, numeros, a); });
    out['sitemap.xml'] = mapaDelSitio(arts);
    return out;
  }

  return {
    esc: esc, textoAHtml: textoAHtml, textoPlano: textoPlano, fechaLarga: fechaLarga, slugify: slugify,
    numeroPorId: numeroPorId, ordenarArticulos: ordenarArticulos, ordenarNumeros: ordenarNumeros, articulosDe: articulosDe,
    comoCitar: comoCitar, paginaInicio: paginaInicio, paginaArticulo: paginaArticulo, pagina404: pagina404,
    mapaDelSitio: mapaDelSitio, generarTodo: generarTodo, SITIO: SITIO, VERSION: VERSION
  };
});
