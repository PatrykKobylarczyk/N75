/* Jawność cen – pliki dla dane.gov.pl i raport e-mail.
   /dane-gov/n75.xml                         plik XML dla harvestera dane.gov.pl (zgłaszany raz na portalu)
   /dane-gov/n75.md5                         suma kontrolna MD5 pliku XML
   /dane-gov/ceny-ofertowe-…-RRRR-MM-DD.csv  zestawienie cen z danego dnia (48 pól, CSV UTF-8, średnik)
   /dane-gov/historia-cen-n75.csv            pełna historia zmian cen lokali
   /dane-gov/raport                          codzienny e-mail (cron Vercel) – wysyła się przy zmianach cen
                                             lub zawsze, gdy REPORT_DAILY=1; ręcznie: ?force=1 (wymaga klucza) */
const D = require('./_lib/dane');

function base(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const h = req.headers['x-forwarded-host'] || req.headers.host;
  return (h && /localhost|127\.0\.0\.1/.test(h) ? 'http://' : 'https://') + h;
}
function send(res, code, type, body, extra) {
  res.statusCode = code;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600');
  Object.entries(extra || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.end(body);
}
const fmt = n => new Intl.NumberFormat('pl-PL').format(n) + ' zł';

async function report(req, res, q) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  const ok = !secret || auth === 'Bearer ' + secret || q.get('key') === secret;
  if (!ok) return send(res, 401, 'application/json', '{"error":"unauthorized"}');
  const day = D.today(), info = await D.changes(day);
  const force = q.get('force') === '1', daily = process.env.REPORT_DAILY === '1';
  const b = base(req), file = D.config.plik + day + '.csv';
  if (!info.changes.length && !force && !daily) return send(res, 200, 'application/json', JSON.stringify({ sent: false, reason: 'brak zmian', ...info }));
  if (!process.env.RESEND_API_KEY || !process.env.REPORT_EMAIL_TO) return send(res, 200, 'application/json', JSON.stringify({ sent: false, reason: 'brak RESEND_API_KEY / REPORT_EMAIL_TO', ...info }));
  const rows = info.changes.map(c => `<tr><td style="padding:6px 12px 6px 0">${c.id}</td><td style="padding:6px 12px 6px 0">${c.type}</td><td style="padding:6px 0">${c.from != null ? fmt(c.from) + ' → ' : ''}${c.to != null ? fmt(c.to) : ''}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#221d18;line-height:1.5">
    <p><strong>N75 – raport cen dla dane.gov.pl, ${day}</strong></p>
    <p>Lokale mieszkalne w ofercie: ${info.offered}. ${info.changes.length ? 'Zmiany od wczoraj: ' + info.changes.length + '.' : 'Bez zmian od wczoraj.'}</p>
    ${rows ? '<table style="border-collapse:collapse;margin:8px 0 16px">' + rows + '</table>' : ''}
    <p>Plik dnia (pobierany automatycznie przez dane.gov.pl): <a href="${b}/dane-gov/${file}">${file}</a><br>
    Plik XML zbioru: <a href="${b}/dane-gov/n75.xml">${b}/dane-gov/n75.xml</a> · MD5: <a href="${b}/dane-gov/n75.md5">n75.md5</a><br>
    Historia cen: <a href="${b}/dane-gov/historia-cen-n75.csv">historia-cen-n75.csv</a></p>
    <p style="color:#6c6a65;font-size:12px">Wiadomość wysłana automatycznie. Zestawienie w załączniku.</p></div>`;
  const csv = await D.csv(day);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.REPORT_EMAIL_FROM || 'N75 <raporty@n75.pl>',
      to: process.env.REPORT_EMAIL_TO.split(',').map(s => s.trim()),
      subject: `N75 · raport cen dane.gov.pl · ${day}${info.changes.length ? ' · zmiany: ' + info.changes.length : ''}`,
      html, attachments: [{ filename: file, content: Buffer.from(csv, 'utf8').toString('base64') }]
    })
  });
  const out = await r.text();
  send(res, r.ok ? 200 : 502, 'application/json', JSON.stringify({ sent: r.ok, resend: out, ...info }));
}

module.exports = async (req, res) => {
  try {
    const q = new URL(req.url, 'http://x').searchParams;
    const f = (q.get('file') || '').replace(/^\/+/, '');
    const day = D.today();
    if (f === 'n75.xml') return send(res, 200, 'application/xml; charset=utf-8', D.xml(base(req), day));
    if (f === 'n75.md5') return send(res, 200, 'text/plain; charset=utf-8', D.md5(D.xml(base(req), day)));
    if (f === 'historia-cen-n75.csv') return send(res, 200, 'text/csv; charset=utf-8', await D.historyCsv(), { 'Content-Disposition': 'inline; filename="historia-cen-n75.csv"' });
    if (f === 'raport' || (!f && /vercel-cron/i.test(req.headers['user-agent'] || ''))) return await report(req, res, q);
    const m = f.match(/^(.+)(\d{4}-\d{2}-\d{2})\.csv$/);
    if (m && m[1] === D.config.plik) {
      if (m[2] > day || m[2] < D.config.start) return send(res, 404, 'text/plain; charset=utf-8', 'Brak zestawienia dla tej daty.');
      return send(res, 200, 'text/csv; charset=utf-8', await D.csv(m[2]), { 'Content-Disposition': `inline; filename="${f}"` });
    }
    send(res, 404, 'text/plain; charset=utf-8', 'Nie znaleziono.');
  } catch (e) {
    send(res, 500, 'text/plain; charset=utf-8', 'Błąd: ' + e.message);
  }
};
