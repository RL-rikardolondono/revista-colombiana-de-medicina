/* Formularios públicos — Revista Colombiana de Medicina.
   Boletín (suscripción), envío de manuscritos y consulta del estado.
   Hablan con el servicio de la revista (data-servicio), que guarda los datos y envía los correos por Brevo. */
(function () {
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function aviso(caja, tipo, html) { if (!caja) return; caja.className = caja.className.replace(/\s*(ok|error|espera)\b/g, '') + ' ' + tipo; caja.innerHTML = html; }
  function enviar(url, cuerpo) {
    var op = { method: 'POST', body: cuerpo };
    if (!(cuerpo instanceof FormData)) { op.headers = { 'Content-Type': 'application/json' }; op.body = JSON.stringify(cuerpo); }
    return fetch(url, op).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Respuesta inválida del servidor.' }; }); });
  }
  function bloquear(form, si) { Array.prototype.forEach.call(form.querySelectorAll('button,input,select,textarea'), function (x) { x.disabled = si; }); }
  var FALLA = 'No pudimos conectarnos. Revise su internet e inténtelo de nuevo en unos minutos.';

  // ---------- Boletín ----------
  Array.prototype.forEach.call(document.querySelectorAll('form.form-boletin'), function (f) {
    var caja = f.parentNode.querySelector('.estado-form');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.sitioweb && f.sitioweb.value) return; // trampa para robots
      aviso(caja, 'espera', 'Enviando…'); bloquear(f, true);
      enviar(f.getAttribute('data-servicio'), { accion: 'suscribir', correo: f.correo.value.trim(), nombre: (f.nombre && f.nombre.value.trim()) || '', origen: location.pathname })
        .then(function (r) {
          if (r.ok) { aviso(caja, 'ok', esc(r.mensaje || '¡Listo! Revise su correo para confirmar la suscripción.')); f.reset(); }
          else aviso(caja, 'error', esc(r.error || 'No se pudo completar la suscripción.'));
        }).catch(function () { aviso(caja, 'error', FALLA); }).then(function () { bloquear(f, false); });
    });
  });

  // ---------- Envío de manuscrito ----------
  var fe = document.getElementById('form-envio');
  if (fe) {
    var cajaE = fe.querySelector('.estado-form'), MAX = 15 * 1024 * 1024;
    fe.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fe.sitioweb && fe.sitioweb.value) return;
      var arch = fe.archivo.files[0];
      if (!arch) { aviso(cajaE, 'error', 'Adjunte el manuscrito.'); return; }
      if (arch.size > MAX) { aviso(cajaE, 'error', 'El archivo pesa más de 15 MB. Comprímalo o envíelo al correo editorial.'); return; }
      if (!/\.(docx?|pdf|odt)$/i.test(arch.name)) { aviso(cajaE, 'error', 'El manuscrito debe estar en Word (.doc, .docx), .odt o PDF.'); return; }
      var orcid = fe.orcid.value.trim();
      if (orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid)) { aviso(cajaE, 'error', 'El ORCID debe tener la forma 0000-0000-0000-0000.'); return; }
      var d = new FormData(fe); d.set('accion', 'enviar'); d.delete('sitioweb');
      aviso(cajaE, 'espera', 'Enviando su manuscrito… no cierre esta página.'); bloquear(fe, true);
      enviar(fe.getAttribute('data-servicio'), d).then(function (r) {
        if (r.ok) {
          fe.reset();
          aviso(cajaE, 'ok', '<b>¡Recibimos su manuscrito!</b><br>Su código de seguimiento es <b class="codigo">' + esc(r.codigo) + '</b>. También se lo enviamos a su correo. Con ese código puede consultar en qué va, aquí abajo.');
          cajaE.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else aviso(cajaE, 'error', esc(r.error || 'No se pudo enviar el manuscrito.'));
      }).catch(function () { aviso(cajaE, 'error', FALLA); }).then(function () { bloquear(fe, false); });
    });
  }

  // ---------- Consulta de estado ----------
  Array.prototype.forEach.call(document.querySelectorAll('form.form-estado'), function (f) {
    var caja = f.parentNode.querySelector('.estado-consulta');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      aviso(caja, 'espera', 'Consultando…'); bloquear(f, true);
      enviar(f.getAttribute('data-servicio'), { accion: 'estado', codigo: f.codigo.value.trim().toUpperCase(), correo: f.correo.value.trim() }).then(function (r) {
        if (!r.ok) { aviso(caja, 'error', esc(r.error || 'No encontramos un manuscrito con ese código y correo.')); return; }
        var h = '<p><b>' + esc(r.titulo || '') + '</b></p><p>Estado actual: <span class="tag">' + esc(r.estado) + '</span></p>';
        if (r.historial && r.historial.length) h += '<ol class="historial">' + r.historial.map(function (x) { return '<li><span class="meta">' + esc(x.fecha) + '</span> — ' + esc(x.estado) + (x.nota ? '<br><span class="k">' + esc(x.nota) + '</span>' : '') + '</li>'; }).join('') + '</ol>';
        aviso(caja, 'ok', h);
      }).catch(function () { aviso(caja, 'error', FALLA); }).then(function () { bloquear(f, false); });
    });
  });
})();
