# Placeholdery do uzupełnienia

Wszystko poniżej zostało wpisane jako rozsądne założenie, żeby strona była kompletna. Przed publikacją trzeba to potwierdzić lub podmienić.

## Dane inwestycji
- [x] Liczba kondygnacji: **7** (`index.html`, sekcja 01)
- [x] Liczba apartamentów: **50**, metraże **31,89–166,67 m²** (z rzutów projektu budowlanego, grudzień 2025)
- [ ] Harmonogram: pozwolenie II kw. 2025, start IV kw. 2025, stan surowy IV kw. 2026, oddanie IV kw. 2027
- [x] Teksty: misja, architektura, udogodnienia, adres i sąsiedztwo, manifest pochodzą z dokumentu Uniqum_www
- [ ] Teksty sekcji Wnętrza i opisy zespołu (Inwestor, Design Lab, kuratorka): skrócone, do akceptacji; filmy zespołu do dodania
- [x] Zdjęcia zespołu: czarno-białe, miękki kontrast i subtelny ciepły ton, ujednolicona jasność, kadr 4:5 (`assets/img/zespol-*.webp`)
- [ ] Godziny pracy lobby i zakres obsługi

## Lokale (`assets/js/units.js`)
- [x] Numery lokali, pomieszczenia i powierzchnie: prawdziwe, z rzutów pięter (N75A-PB-AR-102…108)
- [x] Ceny brutto i powierzchnie z cennika z 15.09.2026; wszystkie lokale oznaczone jako wolne
- [ ] Statusy i historia cen: przy każdej zmianie cennika dopisać nowy wpis do `history`
- [x] Lokale usługowe U.0.1–U.0.3 na makiecie (parter, rzut N75A-PB-AR-101 rew. 11)
- [x] Ceny lokali usługowych z cennika z 15.09.2026
- [ ] Statusy lokali: cennik ich nie zawiera, wszystkie nadal „wolne”
- [ ] Obrysy lokali (`shape`) odrysowane ręcznie z rzutów budowlanych, z dokładnością do kilkunastu cm; warto je sprawdzić z architektem
- [ ] Rzuty pięter (`assets/img/plany/pietro-N.webp`) są oczyszczone z osi, wymiarów, opisów i mebli (widok piętra); widok pojedynczego lokalu i kafle korzystają z wycinków w wysokiej rozdzielczości z meblami (`assets/img/plany/lokale/ID-piętro.webp`, miniatury `-sm`). Przy automatycznym czyszczeniu część cienkich ścianek i krawędzi mebli mogła zniknąć. Docelowo najlepsze będą rzuty sprzedażowe od architekta
- [x] Kafle w wyszukiwarce pokazują prawdziwy rzut lokalu z meblami
- [ ] Zdjęcie w karcie lokalu: jedna wizualizacja poglądowa (salon) dla wszystkich mieszkań

## Architektura
- [x] Cytat z manifestu

## Lokalizacja
- [x] Współrzędne budynku na mapie: 51°46′20,0″N 19°28′37,3″E (51.77222, 19.47703), z Google Maps; znacznik przypięty do współrzędnych
- [x] Lista miejsc z tekstu „Sąsiedztwo”, bez wymyślonych czasów dojścia

## Kontakt i formalności
- [x] Telefon +48 799 278 344 i dane inwestora (UNIQUM 5 sp. z o.o.)
- [x] Adres biura sprzedaży: Dworzec Łódź Fabryczna (dokładne miejsce na dworcu do uzupełnienia)
- [ ] E-mail `sprzedaz@n75.pl`
- [ ] Link do katalogu PDF
- [ ] Formularz nie wysyła danych: podpiąć do CRM / API (miejsce oznaczone `TODO` w `assets/js/main.js`)
- [ ] Polityka prywatności, prospekt informacyjny
- [ ] Treść zgody RODO

## Media
- [ ] **Zdjęcia okolicy (`assets/img/okolica/`) mają znak wodny fotografa (Rafał Tomczyk, 4wymiar.com)**: poprosić autora o licencję i pliki bez znaku, potem podmienić pod tymi samymi nazwami
- [x] Szkic budynku (`szkic-n75.webp`, przezroczysty) przy cytacie „Architektura nie jest miejscem na kompromisy” z linkiem do manifestu
- [x] Wizualizacje ujednolicone tonalnie (jasność, kontrast, nasycenie); oryginały w historii repozytorium
- [ ] Hero: statyczna wieczorna panorama (`okolica-lotnicze.webp`, 1448 px); na duże ekrany przyda się wersja ok. 2400–2800 px
- [x] Zdjęcie sąsiedztwa przy „Misja”: ujęcie z lotu ptaka o zmierzchu (`okolica-lotnicze.webp`) jako hero i panorama na całą szerokość w sekcji 01. Plik ma 1448 px szerokości; na bardzo dużych ekranach przyda się wersja ok. 2400 px
- [ ] Dawny film `assets/video/n75-hero.mp4` nie jest już używany
- [ ] Obraz OG do udostępniania (`og:image`) i favicon: tymczasowe
- [ ] Logo (`assets/img/logo-n75.svg`) jest odrysowane wektorowo z prezentacji strategii; jeśli istnieje oryginalny plik od projektanta, warto go podmienić

## Fonty
- [ ] **Fonty**: Futura PT jest w Adobe Fonts (wystarczy kit z projektu webowego: jeden `<link>` w `<head>` każdej strony; CSS używa już nazwy `futura-pt`). Avenir Next nie jest w Adobe Fonts: licencja webowa przez Monotype Fonts / MyFonts (nazwa `avenir-next` jest już w CSS). Do tego czasu Windows i Android pokazują Jost i Nunito Sans (prawdziwa kursywa, grubość i odstępy dostrojone pod Futurę i Avenir; włączane automatycznie, gdy urządzenie nie ma oryginałów)

## Z dokumentu Uniqum_www_claimy (06.11.2026), jeszcze nie wdrożone
- [ ] Wybór claimu: na stronie roboczo „Styl, w którym najlepiej się mieszka”
- [ ] Podstrony zespołu (inwestorzy, architekci, kuratorka) z minutowymi filmami i wywiadami, wzorem park-meadows.nl
- [ ] Podstrona „Budynek” (adres, architektura, udogodnienia, sąsiedztwo z „Odkryj +”) i menu według propozycji z dokumentu
- [ ] Podstrona manifestu w lżejszej, dynamicznej oprawie (wzór ceci.amsterdam), wybór wersji tekstu
- [ ] Lokalizacja: kategoria „Gastronomia” (lista lokali do ustalenia) i statyczna mapka
- [ ] Odręczny rysunek DesignLabu przy cytacie z manifestu, folder/storybook inwestycji do pobrania

## Sprzedaż: do uzupełnienia danymi
- [ ] **Strony świata i widok z okien** w karcie lokalu: dopisać w `assets/js/units.js` pola `"orient": "południe, zachód"` i `"view": "park i ulica Narutowicza"` dla każdego lokalu (pola puste nie są wyświetlane). Potrzebna informacja od architekta
- [ ] **Dziennik budowy**: dopisywać wpisy w `assets/js/dziennik.js`, zdjęcia do `assets/img/budowa/`. Sekcja pojawia się automatycznie przy pierwszym wpisie
- [ ] Ulubione są zapamiętywane w przeglądarce użytkownika (bez logowania); „Zapytaj o te lokale” wypełnia formularz listą lokali
- [ ] Podstrony zespołu (inwestor, architekci, kuratorka): czekają na minutowe filmy, wywiady i biogramy
- [ ] Wersja angielska: do decyzji (tłumaczenie całości czy tylko najważniejszych sekcji)

## Do rozważenia później
- [ ] Wersja angielska (klienci zagraniczni z prezentacji strategii)
- [ ] Dziennik budowy ze zdjęciami
- [ ] Wybór lokalu z rzutu piętra lub elewacji

## Rzuty wektorowe i wersja 3D (z plików DWG Design Lab, 2026-04-28)
- Rzuty pięter 1–7, wycinki lokali i modele 3D (`assets/data/3d/`) generowane z DWG. Parter (rzut 0) nadal ze skanu.
- Do weryfikacji z architektem: układ **M1.08** i **M2.09** w DWG różni się od listy pomieszczeń z cennika (inne powierzchnie pokoi). Na rzutach tych lokali opisane są tylko pomieszczenia zgodne z cennikiem.
- Wyposażenie w 3D jest przykładowe (bryły wg bloków mebli z rzutu, styl quiet luxury).
