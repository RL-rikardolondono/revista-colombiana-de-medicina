/* Revista Colombiana de Medicina — generador único de páginas.
   Lo usan el panel /admin y el armado inicial: todo lo que convierte datos en HTML está aquí,
   para que el resultado sea siempre igual. Plataforma desarrollada por SkyNet Genesis. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Formato = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  var SITIO = 'https://revistacolombianademedicina.com';
  var VERSION = '4';
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
  var MENU = [['numero', '/#numero', 'Número actual'], ['archivo', '/archivo/', 'Archivo'], ['autores', '/#autores', 'Para autores'], ['enviar', '/enviar/', 'Enviar artículo'], ['politicas', '/politicas/', 'Políticas'], ['comite', '/#comite', 'Comité'], ['servicios', '/#servicios', 'Formación']];

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
      (s.entidadEditora && s.entidadEditora.nombre ? 'Entidad editora: ' + (s.entidadEditora.url ? '<a href="' + esc(s.entidadEditora.url) + '" target="_blank" rel="noopener">' + esc(s.entidadEditora.nombre) + '</a>' : esc(s.entidadEditora.nombre)) + '.<br>' : '') +
      (s.contacto && s.contacto.correo ? 'Correo editorial: <a href="mailto:' + esc(s.contacto.correo) + '">' + esc(s.contacto.correo) + '</a><br>' : '') +
      '<a href="/politicas/">Políticas editoriales</a> · <a href="/archivo/">Archivo</a> · <a href="/enviar/">Enviar artículo</a>' +
      (f.enlace ? ' · <a href="' + esc(f.enlace) + '" target="_blank" rel="noopener">Formación continua – POLIANDES</a>' : '') +
      '</div><div class="sky">' + SKY + '<span>Plataforma desarrollada por SkyNet Genesis<br><a href="mailto:contacto@skynetgenesis.com">contacto@skynetgenesis.com</a> · WhatsApp 304 437 5758</span></div></div>' +
      '<div class="pie-base"><span>© ' + (new Date().getFullYear()) + ' ' + esc(s.nombre) + '</span> · <a class="ingresar" href="/admin/">Ingresar (equipo)</a></div></footer>';
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
      '<meta property="og:image" content="' + SITIO + '/assets/img/compartir.png">\n' +
      '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">\n' +
      '<meta name="twitter:card" content="summary_large_image">\n' +
      '<meta name="theme-color" content="#0B4F8A">\n' +
      '<link rel="icon" href="/assets/img/icono.svg" type="image/svg+xml">\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="/assets/css/estilo.css?v=' + VERSION + '">\n' +
      '</head>\n<body>\n' + cabecera(s) + '\n' + (op.antes || '') + '<main id="contenido">\n' + op.cuerpo + '\n</main>\n' + pie(s) + '\n' +
      '<a class="wa" href="https://wa.me/57' + wa + '?text=' + encodeURIComponent(WA_SOPORTE_TXT) + '" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">💬 WhatsApp</a>\n' +
      '<script src="/assets/js/sitio.js?v=' + VERSION + '" defer></script>\n' + (op.despues || '') +
      ((s.boletin && s.boletin.mostrar && s.boletin.servicio && !/formularios\.js/.test(op.despues || '')) ? '<script src="/assets/js/formularios.js?v=' + VERSION + '" defer></script>\n' : '') +
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

  function rutaNumero(n) { return '/numero/' + n.id + '/'; }
  function membrete(s, a, numeros) {
    var n = numeroPorId(numeros, a.numero);
    var t = (s.abreviatura || 'Rev Colomb Med') + '. ' + a.anio;
    if (n) t += ';' + n.volumen + '(' + n.numero + ')' + (rangoPaginas(a) ? ':' + rangoPaginas(a) : '');
    return t;
  }
  function tarjetaNumero(n, cuantos) {
    return '<a class="card numero-card" href="' + rutaNumero(n) + '"><span class="tag">Volumen ' + esc(n.volumen) + ' · Número ' + esc(n.numero) + '</span><h3>' + esc(n.titulo) + '</h3>' +
      '<p class="meta">' + esc([n.periodo, n.tema ? 'Tema central: ' + n.tema : '', cuantos + (cuantos === 1 ? ' artículo' : ' artículos')].filter(Boolean).join(' · ')) + '</p></a>';
  }
  function cajaBuscar(valor) {
    return '<form class="buscador" action="/archivo/" method="get" role="search"><label class="oculto-visual" for="q">Buscar artículos</label>' +
      '<input type="search" id="q" name="q" value="' + esc(valor) + '" placeholder="Buscar por título, autor, palabra clave o tema…" autocomplete="off">' +
      '<button class="btn p" type="submit">Buscar</button></form>';
  }
  function cajaBoletin(s) {
    var b = s.boletin || {};
    if (!b.mostrar || !b.servicio) return '';
    return '<section class="card boletin" id="boletin"><h2>' + esc(b.titulo || 'Reciba cada número en su correo') + '</h2><p>' + enLinea(b.texto || 'Le avisamos por correo cuando se publique un número nuevo o se abra una convocatoria. Puede darse de baja cuando quiera.') + '</p>' +
      '<form class="form-boletin" data-servicio="' + esc(b.servicio) + '"><label class="oculto-visual" for="bol-correo">Correo</label><input type="email" id="bol-correo" name="correo" required placeholder="su@correo.com">' +
      '<label class="oculto-visual" for="bol-nombre">Nombre</label><input type="text" id="bol-nombre" name="nombre" placeholder="Nombre (opcional)"><input type="text" name="sitioweb" class="trampa" tabindex="-1" autocomplete="off">' +
      '<button class="btn p" type="submit">Suscribirme</button></form><p class="k">Al suscribirse acepta que la revista use su correo solo para enviarle estos avisos (Ley 1581 de 2012). <a href="/politicas/#privacidad">Política de privacidad</a>.</p><div class="estado-form" role="status"></div></section>';
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
        (la.length ? la.map(function (a) { return tarjetaArticulo(a, numeros); }).join('') : '<p class="card meta">Los artículos de este número se publicarán pronto.</p>') +
        (la.length ? '<div class="btns"><a class="btn s" href="' + rutaNumero(actual) + '">Ver la página del número</a></div>' : '') + '</section>';
    }
    // Archivo: números anteriores + artículos de etapas anteriores
    var anteriores = ordenarNumeros(numeros).filter(function (n) { return !actual || n.id !== actual.id; });
    var sueltos = ordenarArticulos(arts.filter(function (a) { return !a.numero; })).sort(function (a, b) { return (b.anio - a.anio) || ((a.orden || 0) - (b.orden || 0)); });
    c += '<section id="archivo">' + cabezaSeccion('Archivo', 'Busque entre todos los artículos publicados') + cajaBuscar('') ;
    if (anteriores.length) c += '<div class="grid">' + anteriores.map(function (n) { return tarjetaNumero(n, articulosDe(arts, n.id).length); }).join('') + '</div>';
    if (sueltos.length) c += '<h3 class="subnum">Etapas anteriores</h3>' + sueltos.slice(0, 3).map(function (a) { return tarjetaArticulo(a, numeros); }).join('');
    c += '<div class="btns"><a class="btn s" href="/archivo/">Ver todo el archivo</a></div></section>';
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
        '<div class="btns"><a class="btn p" href="/enviar/">Enviar manuscrito</a></div></div>';
    }
    c += '<div class="grid"><div class="card"><h3>Tipos de artículo</h3>' + lista(au.tipos) + '</div><div class="card"><h3>Proceso editorial</h3>' + lista(au.proceso, true) + '</div><div class="card"><h3>Requisitos del manuscrito</h3>' + lista(au.requisitos) + '</div></div>';
    if (au.etica) c += '<div class="card"><h3>Ética y licencia</h3>' + textoAHtml(au.etica) + '<div class="btns"><a class="btn p" href="/enviar/">Enviar manuscrito</a><a class="btn s" href="/politicas/">Ver las políticas editoriales</a></div></div>';
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
    c += cajaBoletin(s);
    c += '<section id="contacto">' + cabezaSeccion('Contacto') + '<div class="card"><p><b>' + esc(s.nombre) + '</b><br>' + esc(s.ciudad) + (correo ? '<br>Correo editorial: <a href="mailto:' + esc(correo) + '">' + esc(correo) + '</a>' : '') +
      (s.entidadEditora && s.entidadEditora.nombre ? '<br>Entidad editora: ' + esc(s.entidadEditora.nombre) : '') + '</p></div></section>';

    var ld = { '@context': 'https://schema.org', '@type': 'Periodical', name: s.nombre, issn: [s.issnLinea, s.issnImpreso], url: SITIO + '/', inLanguage: 'es', isAccessibleForFree: true, publisher: { '@type': 'Organization', name: (s.entidadEditora && s.entidadEditora.nombre) || 'Fundación Reina Elizabeth ONG' } };
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
    if (a.doi) meta += '<meta name="citation_doi" content="' + esc(a.doi) + '">\n';
    if (a.resumen) meta += '<meta name="citation_abstract" content="' + esc(textoPlano(a.resumen, 1500)) + '">\n';
    meta += '<meta name="citation_abstract_html_url" content="' + urlArticulo(a) + '">\n';
    meta += '<meta name="citation_publisher" content="' + esc((s.entidadEditora && s.entidadEditora.nombre) || s.nombre) + '">\n';
    meta += '<meta name="DC.rights" content="CC BY-NC 4.0">\n';
    var ld = { '@context': 'https://schema.org', '@type': 'ScholarlyArticle', headline: a.titulo, name: a.titulo, inLanguage: 'es', url: urlArticulo(a), datePublished: String(a.anio),
      author: (a.autores || []).map(function (x) { var o = { '@type': 'Person', name: x.nombre }; if (x.institucion) o.affiliation = { '@type': 'Organization', name: x.institucion }; if (x.orcid) o.sameAs = 'https://orcid.org/' + x.orcid; return o; }),
      isPartOf: { '@type': 'Periodical', name: s.nombre, issn: [s.issnLinea, s.issnImpreso] }, license: 'https://creativecommons.org/licenses/by-nc/4.0/', isAccessibleForFree: true,
      keywords: a.palabrasClave || undefined, abstract: a.resumen || undefined, identifier: a.doi ? 'https://doi.org/' + a.doi : undefined };
    if (a.paginaInicio) ld.pageStart = String(a.paginaInicio);
    if (a.paginaFin) ld.pageEnd = String(a.paginaFin);
    meta += '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n';

    var autores = (a.autores || []).map(function (x) {
      return '<b>' + esc(x.nombre) + '</b>' + (x.orcid ? ' <a class="orcid" href="https://orcid.org/' + esc(x.orcid) + '" target="_blank" rel="noopener" title="ORCID ' + esc(x.orcid) + '">iD</a>' : '') +
        (x.institucion || x.ciudad ? '<br><span class="meta">' + esc([x.institucion, x.ciudad].filter(Boolean).join(' · ')) + '</span>' : '');
    }).join('<br>');
    var fechas = [];
    if (a.fechaRecibido) fechas.push('Recibido: ' + fechaLarga(a.fechaRecibido));
    if (a.fechaAceptado) fechas.push('Aceptado: ' + fechaLarga(a.fechaAceptado));
    if (a.fechaPublicado) fechas.push('Publicado: ' + fechaLarga(a.fechaPublicado));
    var c = '<p class="meta miga"><a href="/">Inicio</a> › ' + (n ? '<a href="' + rutaNumero(n) + '">' + esc(n.titulo) + '</a>' : '<a href="/archivo/">Archivo</a> · ' + esc(a.anio)) + '</p>' +
      '<article class="card"><p class="membrete">' + esc(membrete(s, a, numeros)) + (a.doi ? ' · <a href="https://doi.org/' + esc(a.doi) + '">https://doi.org/' + esc(a.doi) + '</a>' : '') + '</p>' +
      '<span class="tag">' + esc(a.tipo) + '</span><h1 class="titulo-art">' + esc(a.titulo) + '</h1>' +
      (a.tituloIngles ? '<p class="titulo-en" lang="en">' + esc(a.tituloIngles) + '</p>' : '') +
      '<p>' + autores + '</p><p class="meta">' + esc(lineaMeta(a, numeros, true)) + '</p>' +
      (fechas.length ? '<p class="meta fechas">' + esc(fechas.join(' · ')) + '</p>' : '') +
      (a.resumen ? '<h2>Resumen</h2><p>' + esc(a.resumen) + '</p>' : '') +
      (a.palabrasClave ? '<p class="k"><b>Palabras clave:</b> ' + esc(a.palabrasClave) + '</p>' : '') +
      (a.abstract ? '<h2>Abstract</h2><p lang="en">' + esc(a.abstract) + '</p>' + (a.keywords ? '<p class="k" lang="en"><b>Keywords:</b> ' + esc(a.keywords) + '</p>' : '') : '') +
      (a.pdf ? '<div class="btns"><a class="btn p" href="' + esc(a.pdf) + '" target="_blank" rel="noopener">⬇ Descargar PDF</a></div>' : '') +
      '<h2 style="margin-top:22px">Cómo citar</h2><div class="cite">' + comoCitar(a, numeros, true) + '</div>' +
      '<p class="k" style="margin-top:14px">Licencia: <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.es" rel="license" target="_blank">Creative Commons Atribución-NoComercial 4.0 Internacional</a>. Los autores conservan sus derechos. <a href="/politicas/">Políticas editoriales</a>.</p>' +
      '<div class="compartir"><span>Compartir:</span><a class="btn w" href="https://wa.me/?text=' + encodeURIComponent(a.titulo + ' ' + urlArticulo(a)) + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="btn s" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(urlArticulo(a)) + '" target="_blank" rel="noopener">Facebook</a>' +
      '<a class="btn s" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(urlArticulo(a)) + '" target="_blank" rel="noopener">LinkedIn</a></div></article>' +
      (a.diplomado ? cajaDiplomado(s.formacion && s.formacion.diplomado) : '') +
      (a.pdf ? '<object data="' + esc(a.pdf) + '" type="application/pdf" width="100%" height="820" class="visor"><p class="card">Su navegador no muestra el PDF aquí. <a href="' + esc(a.pdf) + '">Descárguelo</a>.</p></object>' : '') +
      cajaBoletin(s);
    return documento(s, { ruta: '/articulo/' + a.slug + '.html', titulo: a.titulo, tipo: 'article', descripcion: textoPlano(a.resumen, 300) || a.titulo, meta: meta, cuerpo: c });
  }

  function pagina404(s) {
    var c = '<section class="card" style="text-align:center"><h1>No encontramos esta página</h1><p>Es posible que la dirección haya cambiado.</p><div class="btns" style="justify-content:center"><a class="btn p" href="/">Ir al inicio</a><a class="btn s" href="/archivo/">Ver el archivo</a></div></section>';
    return documento(s, { ruta: '/404.html', titulo: 'Página no encontrada', descripcion: 'Página no encontrada', cuerpo: c, noindex: true });
  }

  // ---------- Página de un número ----------
  function paginaNumero(s, numeros, artsDatos, n) {
    var la = articulosDe((artsDatos && artsDatos.articulos) || [], n.id);
    var c = '<p class="meta miga"><a href="/">Inicio</a> › <a href="/archivo/">Archivo</a></p>' +
      '<section>' + cabezaSeccion(n.titulo, [n.periodo, n.tema ? 'Tema central: ' + n.tema : ''].filter(Boolean).join(' · '), 'h1') +
      (n.presentacion ? '<div class="card">' + textoAHtml(n.presentacion) + '</div>' : '') +
      (la.length ? la.map(function (a) { return tarjetaArticulo(a, numeros); }).join('') : '<p class="card meta">Los artículos de este número se publicarán pronto.</p>') + '</section>' + cajaBoletin(s);
    var ld = { '@context': 'https://schema.org', '@type': 'PublicationIssue', issueNumber: String(n.numero), datePublished: String(n.anio), name: n.titulo,
      isPartOf: { '@type': 'PublicationVolume', volumeNumber: String(n.volumen), isPartOf: { '@type': 'Periodical', name: s.nombre, issn: [s.issnLinea, s.issnImpreso] } } };
    return documento(s, { ruta: rutaNumero(n), titulo: n.titulo, descripcion: s.nombre + ' — ' + n.titulo + (n.tema ? '. Tema central: ' + n.tema : '') + '. ' + la.length + ' artículos en acceso abierto.',
      meta: '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>\n', cuerpo: c });
  }

  // ---------- Archivo con buscador ----------
  function paginaArchivo(s, numeros, artsDatos) {
    var arts = (artsDatos && artsDatos.articulos) || [];
    var nums = ordenarNumeros(numeros);
    var sueltos = arts.filter(function (a) { return !a.numero; }).sort(function (a, b) { return (b.anio - a.anio) || ((a.orden || 0) - (b.orden || 0)); });
    var c = '<section>' + cabezaSeccion('Archivo de la revista', 'Todos los números y artículos publicados', 'h1') + cajaBuscar('') +
      '<div id="resultados" class="oculto" aria-live="polite"></div><div id="archivo-completo">';
    nums.forEach(function (n) {
      var la = articulosDe(arts, n.id);
      c += '<h2 class="subnum"><a href="' + rutaNumero(n) + '">' + esc(n.titulo) + '</a>' + (n.periodo ? ' <span class="meta">· ' + esc(n.periodo) + '</span>' : '') + '</h2>' +
        (la.length ? la.map(function (a) { return tarjetaArticulo(a, numeros); }).join('') : '<p class="meta">Los artículos de este número se publicarán pronto.</p>');
    });
    if (sueltos.length) c += '<h2 class="subnum">Etapas anteriores de la revista</h2>' + sueltos.map(function (a) { return tarjetaArticulo(a, numeros); }).join('');
    c += '</div></section>';
    return documento(s, { ruta: '/archivo/', titulo: 'Archivo', descripcion: 'Archivo completo de la ' + s.nombre + ': todos los números y artículos en acceso abierto, con buscador.', cuerpo: c,
      despues: '<script src="/assets/js/buscar.js?v=' + VERSION + '" defer></script>\n' });
  }

  // ---------- Políticas editoriales ----------
  function paginaPoliticas(s) {
    var pol = (s.politicas || []).filter(function (x) { return x && x.titulo && x.texto; });
    var c = '<section>' + cabezaSeccion('Políticas editoriales', 'Cómo trabaja la revista', 'h1') +
      '<nav class="card indice" aria-label="Contenido"><b>Contenido</b><ol>' + pol.map(function (x) { return '<li><a href="#' + esc(x.id) + '">' + esc(x.titulo) + '</a></li>'; }).join('') + '</ol></nav>' +
      pol.map(function (x) { return '<article class="card politica" id="' + esc(x.id) + '"><h2>' + esc(x.titulo) + '</h2>' + textoAHtml(x.texto) + '</article>'; }).join('') + '</section>';
    return documento(s, { ruta: '/politicas/', titulo: 'Políticas editoriales', descripcion: 'Políticas editoriales de la ' + s.nombre + ': enfoque y alcance, revisión por pares, ética, plagio, acceso abierto, conservación y privacidad.', cuerpo: c });
  }

  // ---------- Envío de manuscritos ----------
  function paginaEnviar(s) {
    var m = s.manuscritos || {}, au = s.autores || {}, correo = (s.contacto && s.contacto.correo) || '';
    var tipos = (au.tipos || []).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    var form = m.servicio ?
      '<form class="card form-envio" id="form-envio" data-servicio="' + esc(m.servicio) + '">' +
      '<h2>Formulario de envío</h2>' +
      '<label for="e-titulo">Título del manuscrito *</label><input id="e-titulo" name="titulo" required maxlength="400">' +
      '<label for="e-tipo">Tipo de artículo *</label><select id="e-tipo" name="tipo" required>' + tipos + '</select>' +
      '<div class="fila2"><div><label for="e-nombre">Autor de correspondencia *</label><input id="e-nombre" name="nombre" required maxlength="200"></div>' +
      '<div><label for="e-correo">Correo *</label><input id="e-correo" name="correo" type="email" required maxlength="200"></div></div>' +
      '<div class="fila2"><div><label for="e-inst">Institución y ciudad *</label><input id="e-inst" name="institucion" required maxlength="300"></div>' +
      '<div><label for="e-orcid">ORCID (opcional)</label><input id="e-orcid" name="orcid" placeholder="0000-0000-0000-0000" maxlength="19"></div></div>' +
      '<label for="e-coautores">Coautores (nombre, institución y correo de cada uno, uno por renglón)</label><textarea id="e-coautores" name="coautores" maxlength="3000"></textarea>' +
      '<label for="e-resumen">Resumen *</label><textarea id="e-resumen" name="resumen" required maxlength="4000"></textarea>' +
      '<label for="e-claves">Palabras clave *</label><input id="e-claves" name="palabras" required maxlength="400" placeholder="Separadas por punto y coma">' +
      '<label for="e-archivo">Manuscrito en Word o PDF * (máximo 15 MB)</label><input id="e-archivo" name="archivo" type="file" required accept=".doc,.docx,.pdf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">' +
      '<input type="text" name="sitioweb" class="trampa" tabindex="-1" autocomplete="off">' +
      '<label class="chk"><input type="checkbox" name="ineditos" required> Declaro que el manuscrito es inédito y no está en evaluación en otra revista.</label>' +
      '<label class="chk"><input type="checkbox" name="conflictos" required> Declaro los conflictos de interés en el manuscrito y acepto las <a href="/politicas/" target="_blank">políticas editoriales</a>.</label>' +
      '<label class="chk"><input type="checkbox" name="datos" required> Autorizo el tratamiento de mis datos para el proceso editorial (Ley 1581 de 2012).</label>' +
      '<div class="btns"><button class="btn p" type="submit">Enviar manuscrito</button></div><div class="estado-form" role="status"></div></form>' +
      '<div class="card"><h2>¿Ya envió un manuscrito?</h2><p>Escriba el código que le llegó por correo para ver en qué va.</p>' +
      '<form class="form-estado" data-servicio="' + esc(m.servicio) + '"><input name="codigo" required placeholder="Ej.: RCM-2026-0001" maxlength="20"><input name="correo" type="email" required placeholder="Su correo" maxlength="200"><button class="btn s" type="submit">Consultar</button></form><div class="estado-consulta" role="status"></div></div>'
      : '<div class="card"><p>Envíe su manuscrito al correo editorial <a href="mailto:' + esc(correo) + '">' + esc(correo) + '</a>.</p></div>';
    var c = '<section>' + cabezaSeccion('Enviar un artículo', 'Publicación gratuita y en acceso abierto', 'h1') +
      '<div class="grid"><div class="card"><h3>Requisitos</h3>' + lista(au.requisitos) + '</div><div class="card"><h3>Proceso editorial</h3>' + lista(au.proceso, true) + '</div></div>' +
      form + '</section>';
    return documento(s, { ruta: '/enviar/', titulo: 'Enviar un artículo', descripcion: 'Envíe su manuscrito a la ' + s.nombre + '. Publicación gratuita para autores, revisión por pares doble ciego y acceso abierto.', cuerpo: c,
      despues: '<script src="/assets/js/formularios.js?v=' + VERSION + '" defer></script>\n' });
  }

  function mapaDelSitio(arts, numeros) {
    var urls = ['/', '/archivo/', '/politicas/', '/enviar/'];
    ordenarNumeros(numeros).forEach(function (n) { urls.push(rutaNumero(n)); });
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
    ordenarNumeros(numeros).forEach(function (n) { out['numero/' + n.id + '/index.html'] = paginaNumero(s, numeros, artsDatos, n); });
    out['archivo/index.html'] = paginaArchivo(s, numeros, artsDatos);
    out['politicas/index.html'] = paginaPoliticas(s);
    out['enviar/index.html'] = paginaEnviar(s);
    out['sitemap.xml'] = mapaDelSitio(arts, numeros);
    return out;
  }

  return {
    esc: esc, textoAHtml: textoAHtml, textoPlano: textoPlano, fechaLarga: fechaLarga, slugify: slugify,
    numeroPorId: numeroPorId, ordenarArticulos: ordenarArticulos, ordenarNumeros: ordenarNumeros, articulosDe: articulosDe,
    comoCitar: comoCitar, paginaInicio: paginaInicio, paginaArticulo: paginaArticulo, pagina404: pagina404, paginaNumero: paginaNumero,
    paginaArchivo: paginaArchivo, paginaPoliticas: paginaPoliticas, paginaEnviar: paginaEnviar, membrete: membrete, rutaNumero: rutaNumero,
    mapaDelSitio: mapaDelSitio, generarTodo: generarTodo, SITIO: SITIO, VERSION: VERSION
  };
});
