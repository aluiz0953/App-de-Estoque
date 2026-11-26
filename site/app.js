// Reads the releases straight from GitHub, so a new APK shows up here as soon as the release workflow publishes it.
(function () {
  var REPO = 'aluiz0953/App-de-Estoque';
  var list = document.getElementById('releases');
  var button = document.getElementById('download');
  var label = document.getElementById('download-label');
  var meta = document.getElementById('release-meta');

  var dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  var mb = function (bytes) { return (bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB'; };
  var apkOf = function (r) { return (r.assets || []).filter(function (a) { return /\.apk$/i.test(a.name); })[0]; };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Release notes are markdown from --generate-notes; show the bullet lines as plain text (never as HTML).
  function notes(body) {
    var box = el('div', 'notes');
    var lines = String(body || '').split('\n').map(function (l) { return l.trim(); })
      .filter(function (l) { return l && !/^#|^\*\*Full Changelog|^<!--/.test(l); });
    var bullets = lines.filter(function (l) { return /^[-*] /.test(l); }).map(function (l) {
      return l.replace(/^[-*] /, '').replace(/ by @\S+ in https?:\/\/\S+$/, '').replace(/\*\*/g, '');
    });
    if (!bullets.length) { box.appendChild(el('p', null, lines[0] || '—')); return box; }
    var ul = el('ul');
    bullets.slice(0, 5).forEach(function (b) { ul.appendChild(el('li', null, b)); });
    box.appendChild(ul);
    return box;
  }

  function render(releases) {
    list.textContent = '';
    var withApk = releases.filter(function (r) { return !r.draft && apkOf(r); });
    if (!withApk.length) {
      list.appendChild(el('p', 'empty', 'Nenhuma versão publicada ainda.'));
      meta.textContent = 'Nenhuma versão publicada ainda.';
      return;
    }
    var latest = withApk.filter(function (r) { return !r.prerelease; })[0] || withApk[0];
    var apk = apkOf(latest);
    button.href = apk.browser_download_url;
    label.textContent = 'Baixar a versão ' + latest.tag_name.replace(/^v/, '');
    meta.textContent = 'APK · ' + mb(apk.size) + ' · publicado em ' + dateFmt.format(new Date(latest.published_at)) + ' · Android 5 ou mais novo';

    withApk.forEach(function (r, i) {
      var a = apkOf(r);
      var row = el('div', 'release');
      row.setAttribute('role', 'row');
      row.style.setProperty('--i', Math.min(i, 10));
      var v = el('span', 'version', r.tag_name.replace(/^v/, ''));
      if (r === latest) v.appendChild(el('span', 'stamp', 'atual'));
      var file = el('span', 'file');
      var link = el('a', null, 'Baixar · ' + mb(a.size));
      link.href = a.browser_download_url;
      link.setAttribute('aria-label', 'Baixar a versão ' + r.tag_name.replace(/^v/, ''));
      file.appendChild(link);
      [v, el('span', 'date', dateFmt.format(new Date(r.published_at))), notes(r.body), file].forEach(function (c) {
        c.setAttribute('role', 'cell');
        row.appendChild(c);
      });
      list.appendChild(row);
    });
  }

  fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=30', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(render)
    .catch(function () {
      list.textContent = '';
      var p = el('p', 'empty', 'Não deu para carregar as versões agora. ');
      var a = el('a', null, 'Ver no GitHub');
      a.href = 'https://github.com/' + REPO + '/releases';
      p.appendChild(a);
      list.appendChild(p);
      meta.textContent = 'O botão leva à versão mais recente no GitHub.';
    });
})();
