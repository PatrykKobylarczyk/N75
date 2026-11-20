/* Raport cen N75 dla dane.gov.pl: zestawienie CSV (48 pól, rozporządzenie MC z 10.11.2026), plik XML dla harvestera,
   suma md5, historia cen i wykaz zmian między dniami.
   Źródło cen: zmienna N75_PRICES_URL (JSON z CRM) albo assets/js/units.js (cennik na stronie). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const C = require('./dane-config');

// Nagłówki 48 kolumn w kolejności grup A–H. Brzmienie nagłówków należy porównać ze wzorcowym plikiem ministerstwa na dane.gov.pl.
const ADR = ['Województwo', 'Powiat', 'Gmina', 'Miejscowość', 'Ulica', 'Nr nieruchomości', 'Nr lokalu', 'Kod pocztowy'];
const HEAD = [].concat(
  ['Firma', 'NIP'],
  ADR.map(a => a + ' siedziby lub głównego miejsca wykonywania działalności'),
  ADR.map(a => a + ' miejsca prowadzenia sprzedaży'),
  ['Dodatkowe lokalizacje, w których prowadzona jest sprzedaż', 'Sposób kontaktu nabywcy z deweloperem'],
  ['Województwo', 'Powiat', 'Gmina', 'Miejscowość', 'Ulica', 'Nr nieruchomości', 'Kod pocztowy'].map(a => a + ' lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'),
  ['Długość geograficzna', 'Szerokość geograficzna'],
  ['Rodzaj nieruchomości', 'Identyfikator lokalu mieszkalnego lub domu jednorodzinnego', 'Cena 1 m2 powierzchni użytkowej [zł]', 'Data i godzina, od której obowiązuje cena 1 m2',
   'Cena lokalu mieszkalnego lub domu jednorodzinnego [zł]', 'Data i godzina, od której obowiązuje cena lokalu'],
  ['Rodzaj pomieszczenia przynależnego', 'Oznaczenie pomieszczenia przynależnego', 'Cena pomieszczenia przynależnego [zł]', 'Data i godzina, od której obowiązuje cena pomieszczenia przynależnego', 'Identyfikator lokalu, do którego przynależy pomieszczenie'],
  ['Rodzaj prawa niezbędnego do korzystania z lokalu', 'Cena prawa [zł]', 'Data i godzina, od której obowiązuje cena prawa', 'Identyfikator lokalu, którego dotyczy prawo'],
  ['Rodzaj innego świadczenia pieniężnego', 'Wartość świadczenia [zł]', 'Data i godzina, od której obowiązuje wartość świadczenia', 'Identyfikator lokalu, którego dotyczy świadczenie']
);
if (HEAD.length !== 48) throw new Error('Struktura: ' + HEAD.length + ' kolumn zamiast 48');

const X = 'X';
const money = v => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
const coord = v => v.toFixed(6).replace('.', ',');
const when = d => d + ' 00:00:00';
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
function norm(u) { return { id: u.id, area: +u.area, status: String(u.status || 'wolne').toLowerCase(), sold: u.sold ? String(u.sold).slice(0, 10) : null, history: (u.history || []).map(h => [String(h[0]).slice(0, 10), +h[1]]).sort((a, b) => a[0] < b[0] ? -1 : 1) }; }

// cena obowiązująca w danym dniu (ostatnia zmiana nie późniejsza niż dzień raportu)
function priceAt(u, day) { let p = null; u.history.forEach(h => { if (h[0] <= day) p = h; }); return p; }
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
  snap.forEach(r => rows.push(base.concat(['lokal mieszkalny', r.id, money(r.perM2), when(r.since), money(r.price), when(r.since)], blank(13))));
  const extra = (list, block) => list.filter(e => (e.od || '') <= day).forEach(e => rows.push(base.concat(blank(6), block(e))));
  extra(C.pomieszczeniaPrzynalezne, e => [e.rodzaj, e.oznaczenie || X, money(e.cena), when(e.od), e.lokal || X].concat(blank(8)));
  extra(C.prawa, e => blank(5).concat([e.rodzaj, money(e.cena), when(e.od), e.lokal || X], blank(4)));
  extra(C.inneSwiadczenia, e => blank(9).concat([e.rodzaj, money(e.cena), when(e.od), e.lokal || X]));
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

module.exports = { HEAD, today, addDays, units, snapshot, csv, historyCsv, xml, md5, changes, config: C };
