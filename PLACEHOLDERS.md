# Placeholdery do uzupełnienia

Wszystko poniżej zostało wpisane jako rozsądne założenie, żeby strona była kompletna. Przed publikacją trzeba to potwierdzić lub podmienić.

## Dane inwestycji
- [ ] Liczba kondygnacji: **8** (`index.html`, sekcja 01, przyjęte z wizualizacji)
- [x] Liczba apartamentów: **50**, metraże **31,89–166,67 m²** (z rzutów projektu budowlanego, grudzień 2025)
- [ ] Harmonogram: pozwolenie II kw. 2025, start IV kw. 2025, stan surowy IV kw. 2026, oddanie IV kw. 2027
- [x] Teksty: misja, architektura, udogodnienia, adres i sąsiedztwo, manifest pochodzą z dokumentu Uniqum_www
- [ ] Teksty sekcji Wnętrza i opisy zespołu (Inwestor, Design Lab, kuratorka): skrócone, do akceptacji; filmy zespołu do dodania
- [ ] Godziny pracy lobby i zakres obsługi

## Lokale (`assets/js/units.js`)
- [x] Numery lokali, pomieszczenia i powierzchnie: prawdziwe, z rzutów pięter (N75A-PB-AR-102…108)
- [ ] **Ceny, statusy i historia cen są przykładowe**: do podmiany na dane sprzedażowe
- [ ] Znaczniki lokali na rzutach (`plan`, `pins`) są ustawione automatycznie przy numerach z PDF, część stoi przy obrysie budynku: do poprawienia na środek lokalu
- [ ] Rzuty pięter (`assets/img/plany/`) to wycinki rysunków budowlanych; docelowo lepiej dać rzuty sprzedażowe (uproszczone, z meblami)
- [ ] Kafle w wyszukiwarce pokazują schematyczny rysunek
- [ ] Zdjęcie w karcie lokalu: dla M2.03 i M2.04 prawdziwe wizualizacje, dla pozostałych poglądowe

## Architektura
- [x] Cytat z manifestu

## Lokalizacja
- [ ] Pinezka na mapie jest umieszczona na środku wycinka mapy, nie na dokładnym punkcie: ustawić `bbox` w iframe tak, by budynek wypadał w środku
- [x] Lista miejsc z tekstu „Sąsiedztwo”, bez wymyślonych czasów dojścia

## Kontakt i formalności
- [x] Telefon +48 799 278 344 i dane inwestora (UNIQUM 5 sp. z o.o.)
- [ ] E-mail `sprzedaz@n75.pl` i adres biura sprzedaży
- [ ] Link do katalogu PDF
- [ ] Formularz nie wysyła danych: podpiąć do CRM / API (miejsce oznaczone `TODO` w `assets/js/main.js`)
- [ ] Polityka prywatności, prospekt informacyjny
- [ ] Treść zgody RODO

## Media
- [ ] Film w hero (`assets/video/n75-hero.mp4`, 33 s, bez dźwięku) jest zmontowany z renderów (najazdy kamery i przenikania). Prawdziwy film wystarczy wgrać pod tą samą nazwą; kadr startowy to `assets/img/hero-poster.jpg`
- [ ] Obraz OG do udostępniania (`og:image`) i favicon: tymczasowe
- [ ] Logo (`assets/img/logo-n75.svg`) jest odrysowane wektorowo z prezentacji strategii; jeśli istnieje oryginalny plik od projektanta, warto go podmienić

## Fonty
- [ ] Futura PT i Avenir Next są krojami płatnymi. Do licencji webowej (np. projekt Adobe Fonts) wystarczy dodać `<link>` z kitem; CSS używa już nazw `futura-pt` i `avenir-next`. Do tego czasu Mac pokazuje systemowe Futura/Avenir Next, a inne systemy Jost i Nunito Sans

## Do rozważenia później
- [ ] Wersja angielska (klienci zagraniczni z prezentacji strategii)
- [ ] Dziennik budowy ze zdjęciami
- [ ] Wybór lokalu z rzutu piętra lub elewacji
