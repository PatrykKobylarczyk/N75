# Placeholdery do uzupełnienia

Wszystko poniżej zostało wpisane jako rozsądne założenie, żeby strona była kompletna. Przed publikacją trzeba to potwierdzić lub podmienić.

## Dane inwestycji
- [x] Liczba kondygnacji: **7** (`index.html`, sekcja 01)
- [x] Liczba apartamentów: **50**, metraże **31,89–166,67 m²** (z rzutów projektu budowlanego, grudzień 2025)
- [ ] Harmonogram: pozwolenie II kw. 2025, start IV kw. 2025, stan surowy IV kw. 2026, oddanie IV kw. 2027
- [x] Teksty: misja, architektura, udogodnienia, adres i sąsiedztwo, manifest pochodzą z dokumentu Uniqum_www
- [ ] Teksty sekcji Wnętrza i opisy zespołu (Inwestor, Design Lab, kuratorka): skrócone, do akceptacji; filmy zespołu do dodania
- [x] Zdjęcia zespołu: czarno-białe w stylu portretów Platona (mocny kontrast, głęboka czerń), ujednolicona jasność, kadr 4:5 (`assets/img/zespol-*.webp`)
- [ ] Godziny pracy lobby i zakres obsługi

## Lokale (`assets/js/units.js`)
- [x] Numery lokali, pomieszczenia i powierzchnie: prawdziwe, z rzutów pięter (N75A-PB-AR-102…108)
- [x] Ceny brutto i powierzchnie z cennika z 25.08.2026; wszystkie lokale oznaczone jako wolne
- [ ] Statusy i historia cen: przy każdej zmianie cennika dopisać nowy wpis do `history`
- [ ] Lokale usługowe U.0.1–U.0.3 z cennika nie są pokazane na stronie (strona prezentuje mieszkania)
- [ ] Obrysy lokali (`shape`) odrysowane ręcznie z rzutów budowlanych, z dokładnością do kilkunastu cm; warto je sprawdzić z architektem
- [ ] Rzuty pięter (`assets/img/plany/pietro-N.webp`) są oczyszczone z osi, wymiarów, opisów i mebli (widok piętra); widok pojedynczego lokalu i kafle korzystają z wycinków w wysokiej rozdzielczości z meblami (`assets/img/plany/lokale/ID-piętro.webp`, miniatury `-sm`). Przy automatycznym czyszczeniu część cienkich ścianek i krawędzi mebli mogła zniknąć. Docelowo najlepsze będą rzuty sprzedażowe od architekta
- [x] Kafle w wyszukiwarce pokazują prawdziwy rzut lokalu z meblami
- [ ] Zdjęcie w karcie lokalu: dla M2.03 i M2.04 prawdziwe wizualizacje, dla pozostałych poglądowe

## Architektura
- [x] Cytat z manifestu

## Lokalizacja
- [x] Współrzędne budynku na mapie: 51°46′20,0″N 19°28′37,3″E (51.77222, 19.47703), z Google Maps; znacznik przypięty do współrzędnych
- [x] Lista miejsc z tekstu „Sąsiedztwo”, bez wymyślonych czasów dojścia

## Kontakt i formalności
- [x] Telefon +48 799 278 344 i dane inwestora (UNIQUM 5 sp. z o.o.)
- [ ] E-mail `sprzedaz@n75.pl` i adres biura sprzedaży
- [ ] Link do katalogu PDF
- [ ] Formularz nie wysyła danych: podpiąć do CRM / API (miejsce oznaczone `TODO` w `assets/js/main.js`)
- [ ] Polityka prywatności, prospekt informacyjny
- [ ] Treść zgody RODO

## Media
- [ ] Hero: statyczna wieczorna panorama (`okolica-lotnicze.webp`, 1448 px); na duże ekrany przyda się wersja ok. 2400–2800 px
- [x] Zdjęcie sąsiedztwa przy „Misja”: ujęcie z lotu ptaka o zmierzchu (`okolica-lotnicze.webp`) jako hero i panorama na całą szerokość w sekcji 01. Plik ma 1448 px szerokości; na bardzo dużych ekranach przyda się wersja ok. 2400 px
- [ ] Dawny film `assets/video/n75-hero.mp4` nie jest już używany
- [ ] Obraz OG do udostępniania (`og:image`) i favicon: tymczasowe
- [ ] Logo (`assets/img/logo-n75.svg`) jest odrysowane wektorowo z prezentacji strategii; jeśli istnieje oryginalny plik od projektanta, warto go podmienić

## Fonty
- [ ] Futura PT i Avenir Next są krojami płatnymi. Do licencji webowej (np. projekt Adobe Fonts) wystarczy dodać `<link>` z kitem; CSS używa już nazw `futura-pt` i `avenir-next`. Do tego czasu Mac pokazuje systemowe Futura/Avenir Next, a inne systemy Jost i Nunito Sans

## Z dokumentu Uniqum_www_claimy (06.11.2026), jeszcze nie wdrożone
- [ ] Wybór claimu: na stronie roboczo „Styl, w którym najlepiej się mieszka”
- [ ] Podstrony zespołu (inwestorzy, architekci, kuratorka) z minutowymi filmami i wywiadami, wzorem park-meadows.nl
- [ ] Podstrona „Budynek” (adres, architektura, udogodnienia, sąsiedztwo z „Odkryj +”) i menu według propozycji z dokumentu
- [ ] Podstrona manifestu w lżejszej, dynamicznej oprawie (wzór ceci.amsterdam), wybór wersji tekstu
- [ ] Lokalizacja: kategoria „Gastronomia” (lista lokali do ustalenia) i statyczna mapka
- [ ] Odręczny rysunek DesignLabu przy cytacie z manifestu, folder/storybook inwestycji do pobrania

## Do rozważenia później
- [ ] Wersja angielska (klienci zagraniczni z prezentacji strategii)
- [ ] Dziennik budowy ze zdjęciami
- [ ] Wybór lokalu z rzutu piętra lub elewacji
