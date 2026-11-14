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
assets/js/extras.js     Ulubione, pasek kontaktu na telefonie, płynne przewijanie kółkiem, animacje numerów (wszystkie strony)
assets/js/porownaj.js   Strona porównania lokali
assets/js/dziennik.js   Wpisy dziennika budowy (sekcja ukryta, gdy pusto)
assets/js/units.js      Dane lokali (PRZYKŁADOWE, do podmiany)
assets/img/plany/       Oczyszczone rzuty pięter (bez osi, wymiarów i opisów); pietro-0.webp to parter
zrodla/rzuty/           Rzuty źródłowe (PDF) i skrypt czyszczący rzut parteru (oczysc_rzut.py)
assets/video/           Film w hero: n75-hero-film.mp4 (1080p) i n75-hero-film-720.mp4 (telefony); n75-hero.mp4 to dawny, nieużywany film
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
| | Hero | Film w pętli, bez dźwięku (ok. 18 s, slow motion): przelot nad parkiem od zmierzchu do dnia → spacer w atrium → basen → sauna, przejścia przez wygaszenie; plakat assets/img/hero-film-poster.webp; przy „ogranicz ruch” stoi na plakacie |
| | Modernizm to… | szkic ołówkiem: po wejściu na ekran kreski bryły rysują się jedna po drugiej (assets/img/szkic-modernizm.svg) |
| | Menu | Wysuwany panel z prawej (hamburger) na wszystkich ekranach |
| 01 | Inwestycja | Misja, zdjęcie budynku i sąsiedztwa, liczby |
| 02 | Architektura | Slider wizualizacji (co 3 s albo ręcznie), cytat, materiały, detale / dostępność / garaż |
| 03 | Wnętrza | Foyer, korytarze, klatka (karuzela) |
| 04 | Udogodnienia | Wellness i longevity: basen, jacuzzi i wellness (z sauną), siłownia, atrium; każde ze sliderem zdjęć i opisem |
| 05 | Mieszkania | Panoramiczny slider wnętrz mieszkań, makieta budynku (piętro → rzut z podświetlanymi lokalami → przybliżony rzut wybranego lokalu; parter z lokalami usługowymi U.0.1–U.0.3) i wyszukiwarka |
| 06 | Lokalizacja | Adres, rozwijane kategorie sąsiedztwa („Odkryj”), mapa OpenStreetMap |
| 07 | Zespół | Inwestor, architekci, kuratorka |
| | Harmonogram | Oś czasu budowy |
| 08 | Kontakt | Formularz zapytania (bez backendu), biuro sprzedaży, dane inwestora |

Podstrony: `budynek.html` (adres, architektura, udogodnienia, sąsiedztwo z „Odkryj +”), `porownaj.html` (ulubione i porównanie 2–3 lokali), `manifest.html` (sam tekst) i `mieszkanie.html?id=M1.01` (karta mieszkania, `assets/js/unit.js`: przybliżony rzut lokalu z przełącznikiem na całe piętro, pomieszczenia, cena, historia ceny, druk). Przycisk „Zapytaj o ten lokal” prowadzi do `index.html?lokal=ID#kontakt` i wybiera lokal w formularzu.

## Dane lokali

`assets/js/units.js` ustawia `window.N75_UNITS`: tablicę obiektów
`{ id, floor, levels, rooms, area, shape, label, roomsList, price, status, history }`.
Powierzchnie i ceny brutto z cennika z 15.09.2026, pomieszczenia z rzutów projektu budowlanego. `shape` to obrys lokalu na każdej kondygnacji w pikselach rzutu `assets/img/plany/pietro-N.webp` (1504×1925), `label` to punkt podpisu.
Lokale usługowe z parteru są w osobnej tablicy `window.N75_USLUGI` (ten sam plik), bez pokoi. Są na liście wyszukiwarki (piętro „Parter”, kafel z wycinkiem rzutu `lokale/U.0.N-0-sm.webp`) i prowadzą do formularza kontaktowego; nie mają karty ani ulubionych.
Statusy: `wolne`, `rezerwacja`, `sprzedane`. Ceny i powierzchnie aktualizuje się z cennika (xls/xlsx z arkuszem „cennik”):
`python3 zrodla/cennik/aktualizuj_ceny.py cennik_DD.MM.RRRR.xls` (opcja `--sprawdz` pokazuje tylko różnice). Skrypt dopisuje zmiany cen do `history`. Samego cennika nie dodajemy do repo: zawiera rabaty, marże i ceny netto.
