/* Dane dewelopera i inwestycji do raportu cen dla dane.gov.pl
   (art. 19b ustawy z 20 maja 2021 r. o ochronie praw nabywcy… oraz rozporządzenie MC z 10.11.2026, Dz.U. 2026 poz. 1489).
   Biuro sprzedaży: ul. Gdańska 130, 90-520 Łódź (jak siedziba). */
const CENNIK = '2026-11-21 00:00:00';
// miejsca postojowe wg rzutów (assets/js/units.js → N75_PARKING): P1–P16 w hali na parterze, 15–58 na platformach Parklift w garażu podziemnym
const MIEJSCA = [];
for (let i = 1; i <= 16; i++) MIEJSCA.push({ lokal: 'X', rodzaj: 'prawo do wyłącznego korzystania z miejsca postojowego P' + i + ' (hala garażowa, parter)', cena: 70000, od: CENNIK });
for (let i = 15; i <= 58; i++) MIEJSCA.push({ lokal: 'X', rodzaj: 'prawo do wyłącznego korzystania z miejsca postojowego nr ' + i + ' na platformie parkingowej (garaż podziemny)', cena: 35000, od: CENNIK });
for (let i = 1; i <= 2; i++) MIEJSCA.push({ lokal: 'X', rodzaj: 'prawo do wyłącznego korzystania z miejsca postojowego dla motocykla M' + i + ' (garaż podziemny)', cena: 10000, od: CENNIK });

module.exports = {
  // A – deweloper
  firma: 'UNIQUM 5 SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
  nip: '5272452204',

  // B – siedziba
  siedziba: { wojewodztwo: 'łódzkie', powiat: 'Łódź', gmina: 'Łódź', miejscowosc: 'Łódź', ulica: 'ul. Gdańska', nr: '130', lokal: 'X', kod: '90-520' },

  // C – miejsce prowadzenia sprzedaży (biuro sprzedaży) i kontakt
  sprzedaz: { wojewodztwo: 'łódzkie', powiat: 'Łódź', gmina: 'Łódź', miejscowosc: 'Łódź', ulica: 'ul. Gdańska', nr: '130', lokal: 'X', kod: '90-520' },
  dodatkoweLokalizacje: 'X',
  kontakt: 'tel. +48 799 278 344, e-mail: sprzedaz@n75.pl, www: https://n75.vercel.app/stara/',

  // D – lokalizacja przedsięwzięcia (WGS-84)
  inwestycja: { nazwa: 'N75', wojewodztwo: 'łódzkie', powiat: 'Łódź', gmina: 'Łódź', miejscowosc: 'Łódź', ulica: 'ul. Gabriela Narutowicza', nr: '75A', kod: '90-132', dlugosc: 19.477030, szerokosc: 51.772220 },

  // F/G/H – pomieszczenia przynależne, prawa i inne świadczenia, jeżeli ich cena NIE jest wliczona w cenę lokalu.
  // Przykład: { lokal: 'M2.03', rodzaj: 'komórka lokatorska', oznaczenie: 'K05', cena: 25000, od: '2026-09-15' }
  // lokal: 'X' = oferowane do dowolnego lokalu (wtedy wiersz bez powiązania z konkretnym lokalem)
  // Cennik od 21.11.2026: komórki 5 000 zł/m², miejsca postojowe w hali na parterze 70 000 zł, miejsca na platformach (garaż -1) 35 000 zł, miejsca dla motocykli M1–M2 10 000 zł.
  pomieszczeniaPrzynalezne: [
    { lokal: 'X', rodzaj: 'komórka lokatorska – cena 5 000 zł za m² powierzchni komórki (komórki 2–5 m²)', oznaczenie: 'X', cena: 5000, od: CENNIK },
    { lokal: 'X', rodzaj: 'komórka lokatorska 6,10 m² (5 000 zł/m²)', oznaczenie: 'X', cena: 30500, od: CENNIK }
  ],
  prawa: MIEJSCA,      // { lokal, rodzaj: 'prawo do wyłącznego korzystania z miejsca postojowego', cena, od }
  inneSwiadczenia: [], // { lokal, rodzaj, cena, od }

  // Statusy, które NIE trafiają do raportu (lokal nie jest już oferowany)
  pominStatusy: ['sprzedane', 'strefa'],

  // Pierwszy dzień raportowania – od tego dnia XML zawiera dzienne zasoby (historia na dane.gov.pl)
  start: '2026-11-20',

  // Metadane zbioru na dane.gov.pl (extIdent max 36 znaków, nie zmieniać po pierwszym imporcie)
  extDataset: 'UNIQUM5_N75_CENY_OFERTOWE_MIESZKAN',
  extResource: 'UNIQUM5_N75_CENY_',      // + RRRRMMDD
  plik: 'ceny-ofertowe-mieszkan-dewelopera-uniqum-5-n75-'  // + RRRR-MM-DD.csv
};
