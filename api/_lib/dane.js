/* Raport cen N75 dla dane.gov.pl: zestawienie CSV (48 pól, rozporządzenie MC z 10.11.2026), plik XML dla harvestera,
   suma md5, historia cen i wykaz zmian między dniami.
   Źródło cen: zmienna N75_PRICES_URL (JSON z CRM) albo assets/js/units.js (cennik na stronie). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const C = require('./dane-config');

// Nagłówki 48 kolumn = „Nazwa pola” z załącznika do rozporządzenia MC z 10.11.2026 (Dz.U. 2026 poz. 1489), grupy A–H, w tej kolejności.
// Te same nazwy generuje zakładka „Ceny” w CRM (wspólny wzorzec).
const SIEDZ = 'adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej';
const SPRZ = 'adresu lokalu, w którym jest prowadzona sprzedaż';
const INW = 'lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego';
const LOK = 'lokalu mieszkalnego albo domu jednorodzinnego';
const OPP = 'o którym mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali';
const SW = 'innego świadczenia pieniężnego, które nabywca jest zobowiązany spełnić na rzecz podmiotu obowiązanego w wykonaniu umowy przenoszącej własność';
const ADR = ['Województwo', 'Powiat', 'Gmina', 'Miejscowość', 'Ulica', 'Numer nieruchomości', 'Numer lokalu', 'Kod pocztowy'];
const HEAD = [].concat(
  ['Firma', 'Numer identyfikacji podatkowej (NIP)'],
  ADR.map(a => a + ' ' + SIEDZ),
  ADR.map(a => a + ' ' + SPRZ),
  ['Dodatkowe lokalizacje, w których jest prowadzona sprzedaż', 'Sposób kontaktu nabywcy z podmiotem obowiązanym'],
  ['Województwo', 'Powiat', 'Gmina', 'Miejscowość', 'Ulica', 'Numer nieruchomości', 'Kod pocztowy'].map(a => a + ' ' + INW),
  ['Długość geograficzna punktu określającego lokalizację przestrzenną przedsięwzięcia deweloperskiego lub zadania inwestycyjnego',
   'Szerokość geograficzna punktu określającego lokalizację przestrzenną przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'],
  ['Rodzaj nieruchomości', 'Identyfikator ' + LOK, 'Cena 1 m2 powierzchni użytkowej ' + LOK,
   'Data i czas, od których obowiązuje cena 1 m2 powierzchni użytkowej ' + LOK,
   'Cena ' + LOK + ' lub ich części będących przedmiotem umowy', 'Data i czas, od których obowiązuje cena ' + LOK + ' lub ich części'],
  ['Rodzaj pomieszczenia przynależnego, ' + OPP, 'Identyfikator pomieszczenia przynależnego, ' + OPP, 'Cena pomieszczenia przynależnego, ' + OPP,
   'Data i czas, od których obowiązuje cena pomieszczenia przynależnego, ' + OPP, 'Identyfikator ' + LOK],
  ['Wyszczególnienie praw niezbędnych do korzystania z ' + LOK, 'Wartość praw niezbędnych do korzystania z ' + LOK,
   'Data i czas, od których obowiązuje wartość praw niezbędnych do korzystania z ' + LOK, 'Identyfikator ' + LOK],
  ['Wyszczególnienie rodzaju ' + SW, 'Wartość ' + SW, 'Data i czas, od których obowiązuje wartość ' + SW, 'Identyfikator ' + LOK]
);
if (HEAD.length !== 48) throw new Error('Struktura: ' + HEAD.length + ' kolumn zamiast 48');

const X = 'X';
const money = v => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
const coord = v => v.toFixed(6).replace('.', ',');
// data i czas RRRR-MM-DD GG:MM:SS; historia z CRM niesie godzinę zmiany ceny, cennik ze strony – samą datę (00:00:00)
const when = d => { d = String(d).replace('T', ' ').slice(0, 19); return d.length === 10 ? d + ' 00:00:00' : d.length === 16 ? d + ':00' : d; };
const cell = v => { v = String(v == null || v === '' ? X : v); return /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };

function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date()); }
function addDays(d, n) { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }

// lokale: [{ id, area, status, history: [[RRRR-MM-DD, cena brutto], …] }]
let cache = null;
async function units() {
  if (process.env.N75_PRICES_URL) {
    const r = await fetch(process.env.N75_PRICES_URL, { headers: process.env.N75_PRICES_TOKEN ? { Authorization: 'Bearer ' + process.env.N75_PRICES_TOKEN } : {} });
    if (!r.ok) throw new Error('CRM: HTTP ' + r.status);
    const j = await r.json(); return (Array.isArray(j) ? j : j.units).map(norm);
  }
  if (!cache) {
    const src = fs.readFileSync(path.join(process.cwd(), 'assets/js/units.js'), 'utf8');
    const box = { window: {} }; vm.runInNewContext(src, box);
    cache = box.window.N75_UNITS.map(norm);
  }
  return cache;
}
function norm(u) { return { id: u.id, area: +u.area, status: String(u.status || 'wolne').toLowerCase(), sold: u.sold ? String(u.sold).slice(0, 10) : null, history: (u.history || []).map(h => [String(h[0]).replace('T', ' ').slice(0, 19), +h[1]]).sort((a, b) => a[0] < b[0] ? -1 : 1) }; }

// cena obowiązująca w danym dniu (ostatnia zmiana nie późniejsza niż dzień raportu)
function priceAt(u, day) { let p = null; u.history.forEach(h => { if (h[0].slice(0, 10) <= day) p = h; }); return p; }
const residential = u => /^M/i.test(u.id);   // lokale usługowe (U…) nie są lokalami mieszkalnymi

async function snapshot(day) {
  const list = await units();
  // sold: data sprzedaży/wycofania z oferty (z CRM) – lokal znika z raportów od tego dnia; bez daty decyduje bieżący status
  return list.filter(u => residential(u) && (u.sold ? u.sold > day : !C.pominStatusy.includes(u.status))).map(u => {
    const p = priceAt(u, day); if (!p) return null;
    return { id: u.id, area: u.area, price: p[1], perM2: p[1] / u.area, since: p[0] };
  }).filter(Boolean);
}

function baseCols() {
  const s = C.siedziba, b = C.sprzedaz, i = C.inwestycja;
  return [C.firma, C.nip,
    s.wojewodztwo, s.powiat, s.gmina, s.miejscowosc, s.ulica, s.nr, s.lokal, s.kod,
    b.wojewodztwo, b.powiat, b.gmina, b.miejscowosc, b.ulica, b.nr, b.lokal, b.kod, C.dodatkoweLokalizacje, C.kontakt,
    i.wojewodztwo, i.powiat, i.gmina, i.miejscowosc, i.ulica, i.nr, i.kod, coord(i.dlugosc), coord(i.szerokosc)];
}
const blank = n => Array(n).fill(X);

async function csv(day) {
  const rows = [HEAD], base = baseCols(), snap = await snapshot(day);
  // F/G/H w wierszu lokalu, do którego są przypisane (pola E są wymagane w każdym wierszu);
  // kilka pomieszczeń przy jednym lokalu = kolejne wiersze z tymi samymi danymi lokalu.
  const active = list => list.filter(e => String(e.od || '').slice(0, 10) <= day);
  const F = active(C.pomieszczeniaPrzynalezne), G = active(C.prawa), H = active(C.inneSwiadczenia);
  snap.forEach(r => {
    const E = ['lokal mieszkalny', r.id, money(r.perM2), when(r.since), money(r.price), when(r.since)];
    const f = F.filter(e => e.lokal === r.id).map(e => [e.rodzaj, e.oznaczenie || X, money(e.cena), when(e.od), r.id]);
    const g = G.filter(e => e.lokal === r.id).map(e => [e.rodzaj, money(e.cena), when(e.od), r.id]);
    const h = H.filter(e => e.lokal === r.id).map(e => [e.rodzaj, money(e.cena), when(e.od), r.id]);
    for (let k = 0; k < Math.max(1, f.length, g.length, h.length); k++) rows.push(base.concat(E, f[k] || blank(5), g[k] || blank(4), h[k] || blank(4)));
  });
  // pozycje nieprzypisane do konkretnego lokalu (lokal: 'X') – osobne wiersze, jak dotąd
  const loose = (list, block) => list.filter(e => !e.lokal || e.lokal === X).forEach(e => rows.push(base.concat(blank(6), block(e))));
  loose(F, e => [e.rodzaj, e.oznaczenie || X, money(e.cena), when(e.od), X].concat(blank(8)));
  loose(G, e => blank(5).concat([e.rodzaj, money(e.cena), when(e.od), X], blank(4)));
  loose(H, e => blank(9).concat([e.rodzaj, money(e.cena), when(e.od), X]));
  return '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

// pełna historia zmian cen (do publikacji na stronie)
async function historyCsv() {
  const list = (await units()).filter(residential);
  const out = [['Identyfikator lokalu', 'Powierzchnia użytkowa [m2]', 'Data i godzina, od której obowiązuje cena', 'Cena lokalu [zł]', 'Cena 1 m2 [zł]', 'Zmiana względem poprzedniej ceny [%]', 'Status']];
  list.forEach(u => u.history.forEach((h, k) => {
    const prev = k ? u.history[k - 1][1] : null;
    out.push([u.id, money(u.area), when(h[0]), money(h[1]), money(h[1] / u.area), prev ? money((h[1] - prev) / prev * 100) : X, u.status]);
  }));
  return '﻿' + out.map(r => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LAW_PL = 'zgodnie z art. 19b ust. 1 ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym';
const LAW_EN = 'in accordance with art. 19b(1) of the Act of 20 May 2021 on the protection of the rights of the buyer of a residential unit or a single-family house and the Developer Guarantee Fund';

function xml(base, day) {
  const name = C.firma, inv = C.inwestycja.nazwa;
  const res = [];
  for (let d = C.start; d <= day; d = addDays(d, 1)) {
    res.push(`      <resource status="published">
        <extIdent>${C.extResource + d.replace(/-/g, '')}</extIdent>
        <url>${esc(base + '/dane-gov/' + C.plik + d + '.csv')}</url>
        <title>
          <polish>${esc(`Ceny ofertowe mieszkań dewelopera ${name} – ${inv} – ${d}`)}</polish>
          <english>${esc(`Offer prices of apartments of developer ${name} – ${inv} – ${d}`)}</english>
        </title>
        <description>
          <polish>${esc(`Dane dotyczące cen ofertowych mieszkań dewelopera ${name} w inwestycji ${inv} (ul. Narutowicza 75A, Łódź) udostępnione ${d} ${LAW_PL}.`)}</polish>
          <english>${esc(`Data on offer prices of apartments of the developer ${name} in the ${inv} development (Narutowicza 75A, Łódź) made available on ${d} ${LAW_EN}.`)}</english>
        </description>
        <availability>local</availability>
        <dataDate>${d}</dataDate>
        <specialSigns>
          <specialSign>X</specialSign>
        </specialSigns>
        <hasDynamicData>false</hasDynamicData>
        <hasHighValueData>true</hasHighValueData>
        <hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
        <hasResearchData>false</hasResearchData>
        <containsProtectedData>false</containsProtectedData>
      </resource>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dataset status="published">
    <extIdent>${C.extDataset}</extIdent>
    <title>
      <polish>${esc(`Ceny ofertowe mieszkań dewelopera ${name}`)}</polish>
      <english>${esc(`Offer prices of apartments of developer ${name}`)}</english>
    </title>
    <description>
      <polish>${esc(`Zbiór danych zawiera informacje o cenach ofertowych mieszkań dewelopera ${name} udostępniane ${LAW_PL}.`)}</polish>
      <english>${esc(`The dataset contains information on offer prices of apartments of the developer ${name} made available ${LAW_EN}.`)}</english>
    </description>
    <url>${esc(base + '/stara/')}</url>
    <updateFrequency>daily</updateFrequency>
    <hasDynamicData>false</hasDynamicData>
    <hasHighValueData>true</hasHighValueData>
    <hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
    <hasResearchData>false</hasResearchData>
    <categories>
      <category>ECON</category>
    </categories>
    <resources>
${res.join('\n')}
    </resources>
    <tags>
      <tag lang="pl">deweloper</tag>
      <tag lang="pl">mieszkania</tag>
      <tag lang="pl">ceny ofertowe</tag>
    </tags>
  </dataset>
</ns2:datasets>
`;
}
const md5 = s => crypto.createHash('md5').update(s, 'utf8').digest('hex');

// zmiany między dwoma dniami: nowe lokale w ofercie, zmiany cen, lokale wycofane
async function changes(day) {
  const a = await snapshot(addDays(day, -1)), b = await snapshot(day);
  const A = new Map(a.map(r => [r.id, r])), B = new Map(b.map(r => [r.id, r]));
  const out = [];
  b.forEach(r => { const p = A.get(r.id); if (!p) out.push({ id: r.id, type: 'nowy w ofercie', to: r.price }); else if (p.price !== r.price) out.push({ id: r.id, type: 'zmiana ceny', from: p.price, to: r.price }); });
  a.forEach(r => { if (!B.has(r.id)) out.push({ id: r.id, type: 'wycofany z oferty', from: r.price }); });
  return { day, offered: b.length, changes: out };
}

// ceny pomieszczeń przynależnych, praw i innych świadczeń (do publikacji na stronie, art. 19b)
function extrasCsv() {
  const out = [['Rodzaj', 'Oznaczenie', 'Cena [zł]', 'Data i godzina, od której obowiązuje cena', 'Przypisane do lokalu']];
  const add = (list, kind) => list.forEach(e => out.push([e.rodzaj, e.oznaczenie || X, money(e.cena), when(e.od), e.lokal && e.lokal !== X ? e.lokal : 'do dowolnego lokalu']));
  add(C.pomieszczeniaPrzynalezne); add(C.prawa); add(C.inneSwiadczenia);
  return '\ufeff' + out.map(r => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

module.exports = { HEAD, today, addDays, units, snapshot, csv, historyCsv, extrasCsv, xml, md5, changes, config: C };
