# N75 · Narutowicza 75, Łódź

Strona inwestycji mieszkaniowej N75. „Przestrzeń w dobrym kierunku”.

Statyczna strona (HTML, CSS, czysty JavaScript), bez kroku budowania. Działa po otwarciu `index.html`
w przeglądarce i na każdym hostingu statycznym (GitHub Pages, Netlify, Vercel, zwykły serwer).

## Uruchomienie lokalnie

```bash
python3 -m http.server 8000
# potem http://localhost:8000
```

## Struktura

```
index.html              Cała strona (sekcje 01–07)
manifest.html           Podstrona „Manifest” (pozycja 00 w menu)
assets/js/page.js       Skrypt podstron: menu, animacje, galeria
assets/css/style.css    Style: tokeny kolorów, typografia, układ, responsywność
assets/js/main.js       Menu, slajdy w hero, animacje, galeria, wyszukiwarka i karta lokalu, formularz
assets/js/units.js      Dane lokali (PRZYKŁADOWE, do podmiany)
assets/video/           Film w hero (MP4, H.264, bez dźwięku)
assets/img/logo-n75.svg Logo N75 (wektor; na stronie jako <symbol>, kolor przez currentColor)
assets/img/             Wizualizacje w WebP (pełne i *-sm do miniatur) + zbliżenia materiałów
PLACEHOLDERS.md         Lista treści i danych do uzupełnienia
```

## Kierunek wizualny

- Paleta: kremowy papier `#f7f3ec`, brąz/złoto `#9c7149`, ciemny orzech `#221d18`.
- Typografia wg wytycznych: Futura PT (nagłówki wersalikami 400, etykiety i śródtytuły 500, numeracja) oraz Avenir Next 400 (tekst #44423F, podpisy, cytaty). Gdy kroje nie są zainstalowane, strona używa darmowych zamienników Jost i Nunito Sans. Logo N75 jest w SVG.
- Numerowane sekcje 01–07 z cienkimi liniami, jak w prezentacji strategii.
- Motyw okręgu z drzwi wejściowych i lastryka: kropki osi czasu, usługi, numeracja.

## Sekcje

| Nr | Sekcja | Zawartość |
|---|---|---|
| | Hero | Pełnoekranowy film z przyciskiem pauzy, przezroczysty nagłówek, CTA |
| | Menu | Wysuwany panel z prawej (hamburger) na wszystkich ekranach |
| | Wstęp | Manifest i spis treści |
| 01 | Inwestycja | Opis, liczby, harmonogram budowy |
| 02 | Architektura | Elewacje, cytat architekta, materiały |
| 03 | Wnętrza | Foyer, korytarze, klatka, mieszkania (karuzela) |
| 04 | Udogodnienia | Wellness, siłownia, patio, usługi |
| 05 | Mieszkania | Wyszukiwarka: filtry, sortowanie, lista/kafle, karta lokalu z historią ceny |
| 06 | Lokalizacja | Mapa OpenStreetMap, czasy dojścia |
| 07 | Kontakt | Formularz zapytania (bez backendu), biuro sprzedaży |

## Dane lokali

`assets/js/units.js` ustawia `window.N75_UNITS`: tablicę obiektów
`{ id, floor, rooms, area, loggia, terrace, exp, price, status, history }`.
Statusy: `wolne`, `rezerwacja`, `sprzedane`. Docelowo plik można generować z CRM lub arkusza sprzedaży.
