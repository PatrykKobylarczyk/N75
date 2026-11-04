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
assets/js/main.js       Menu, animacje, galeria, wyszukiwarka i makieta, formularz
assets/js/plan.js       Interaktywny rzut piętra: obrysy lokali, podświetlenie, przybliżenie lokalu
assets/js/units.js      Dane lokali (PRZYKŁADOWE, do podmiany)
assets/img/plany/       Oczyszczone rzuty pięter (bez osi, wymiarów i opisów)
assets/video/           Dawny film w hero (nieużywany)
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
| | Hero | Statyczna wieczorna panorama z parkiem i budynkiem; claim i „Sprawdź mieszkania” |
| | Modernizm to… | Zmieniające się słowo (luksus, wyrafinowanie, etos, filozofia) i zajawka narracji |
| | Menu | Wysuwany panel z prawej (hamburger) na wszystkich ekranach |
| 01 | Inwestycja | Misja, zdjęcie budynku i sąsiedztwa, liczby |
| 02 | Architektura | Elewacje, cytat architekta, materiały |
| 03 | Wnętrza | Foyer, korytarze, klatka, mieszkania (karuzela) |
| 04 | Udogodnienia | Lobby, atrium, basen i wellness, detale, dostępność |
| 05 | Mieszkania | Makieta budynku (piętro → rzut z podświetlanymi lokalami → przybliżony rzut wybranego lokalu) i wyszukiwarka |
| 06 | Lokalizacja | Adres, rozwijane kategorie sąsiedztwa („Odkryj”), mapa OpenStreetMap |
| | Cytat | Cytat z manifestu z linkiem do podstrony |
| 07 | Zespół | Inwestor, architekci, kuratorka |
| | Harmonogram | Oś czasu budowy |
| 08 | Kontakt | Formularz zapytania (bez backendu), biuro sprzedaży, dane inwestora |

Podstrony: `manifest.html` (sam tekst) i `mieszkanie.html?id=M1.01` (karta mieszkania, `assets/js/unit.js`: przybliżony rzut lokalu z przełącznikiem na całe piętro, pomieszczenia, cena, historia ceny, druk). Przycisk „Zapytaj o ten lokal” prowadzi do `index.html?lokal=ID#kontakt` i wybiera lokal w formularzu.

## Dane lokali

`assets/js/units.js` ustawia `window.N75_UNITS`: tablicę obiektów
`{ id, floor, levels, rooms, area, shape, label, roomsList, price, status, history }`.
Powierzchnie i ceny brutto z cennika z 25.08.2026, pomieszczenia z rzutów projektu budowlanego. `shape` to obrys lokalu na każdej kondygnacji w pikselach rzutu `assets/img/plany/pietro-N.webp` (1504×1925), `label` to punkt podpisu.
Statusy: `wolne`, `rezerwacja`, `sprzedane`. Docelowo plik można generować z CRM lub arkusza sprzedaży.
