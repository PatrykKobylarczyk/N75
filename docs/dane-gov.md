# Jawność cen N75 – raport dla dane.gov.pl

Strona sama przygotowuje codzienne zestawienie cen w formacie z rozporządzenia Ministra Cyfryzacji z 10.11.2026 (Dz.U. 2026 poz. 1489, 48 pól, grupy A–H).
dane.gov.pl raz na dobę pobiera plik XML i wskazane w nim zestawienia – nie trzeba niczego wysyłać ręcznie.

| Adres | Co to jest |
|---|---|
| `/dane-gov/n75.xml` | plik XML dla harvestera dane.gov.pl (jeden zasób na każdy dzień od `start` w konfiguracji) |
| `/dane-gov/n75.md5` | suma MD5 pliku XML |
| `/dane-gov/ceny-ofertowe-mieszkan-dewelopera-uniqum-5-n75-RRRR-MM-DD.csv` | zestawienie z danego dnia: CSV UTF-8 z BOM, średnik, przecinek dziesiętny, daty `RRRR-MM-DD GG:MM:SS`, „X” w polach, które nie dotyczą oferty |
| `/dane-gov/historia-cen-n75.csv` | pełna historia zmian cen lokali (link w stopce strony) |
| `/dane-gov/raport` | e-mail z raportem (wysyłany automatycznie przez cron Vercel codziennie ok. 6:30) |

## Jednorazowo na dane.gov.pl
1. Konto dewelopera na dane.gov.pl (instytucja: UNIQUM 5 sp. z o.o.).
2. W formularzu zgłoszenia podać adres XML: `https://<domena>/dane-gov/n75.xml` i adres MD5: `https://<domena>/dane-gov/n75.md5`.
3. Nie zmieniać `extDataset` / `extResource` w `api/_lib/dane-config.js` po pierwszym imporcie.

## Konfiguracja (`api/_lib/dane-config.js`)
Dane dewelopera, adres biura sprzedaży (pola UZUPEŁNIJ), lokalizacja WGS-84, pomieszczenia przynależne / prawa / inne świadczenia (jeśli ich cena nie jest wliczona w cenę lokalu), statusy pomijane w raporcie, data startu.
Nagłówki kolumn są w `api/_lib/dane.js` (tablica `HEAD`) – porównać z wzorcowym plikiem ministerstwa.

## Zmienne środowiskowe (Vercel → Settings → Environment Variables)
| Zmienna | Opis |
|---|---|
| `RESEND_API_KEY` | klucz Resend (ten sam co w CRM) |
| `REPORT_EMAIL_TO` | adresy odbiorców raportu, po przecinku |
| `REPORT_EMAIL_FROM` | nadawca z zweryfikowanej domeny, np. `N75 <raporty@n75.pl>` |
| `REPORT_DAILY` | `1` = e-mail codziennie; brak = tylko gdy zmieniły się ceny lub oferta |
| `CRON_SECRET` | chroni `/dane-gov/raport` (Vercel dołącza go do wywołań crona) |
| `PUBLIC_BASE_URL` | docelowa domena, np. `https://n75.pl` (adresy plików w XML) |
| `N75_PRICES_URL` | adres JSON z cenami z CRM (zamiast `assets/js/units.js`) |
| `N75_PRICES_TOKEN` | opcjonalny token Bearer do `N75_PRICES_URL` |

## Połączenie z CRM
CRM (Supabase) wystawia endpoint z listą lokali, np. `GET /api/public/n75/ceny`:
```json
[{ "id": "M2.03", "area": 80.93, "status": "wolne", "sold": null, "history": [["2026-08-25", 1052090], ["2026-12-01", 1072000]] }]
```
`status`: `wolne` / `rezerwacja` / `sprzedane`; `sold`: data sprzedaży (od tego dnia lokal znika z raportu, a e-mail odnotuje wycofanie z oferty). `history`: każda zmiana ceny brutto z datą, od której obowiązuje.
Po zmianie ceny w CRM można od razu wysłać raport: `GET /dane-gov/raport?force=1&key=<CRON_SECRET>`.
