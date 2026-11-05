"""Przenosi ceny i powierzchnie z cennika do assets/js/units.js.

Użycie:  python3 zrodla/cennik/aktualizuj_ceny.py cennik_15.09.2026.xls [--data 2026-09-15] [--sprawdz]

- Czyta arkusz „cennik” (kolumny: nr, m2, cena brutto). Plik .xls jest najpierw konwertowany
  do .xlsx przez LibreOffice (soffice), .xlsx czyta się bezpośrednio.
- Dla każdego lokalu z cennika (M… i U…) ustawia area i price (cena brutto, zaokrąglona do zł),
  a gdy cena się zmieniła, dopisuje [data, cena] na końcu history.
- Data cennika: --data albo z nazwy pliku (dd.mm.rrrr).
- --sprawdz: tylko wypisuje różnice, nic nie zapisuje.
Samego cennika nie dodajemy do repo (zawiera dane wewnętrzne: rabaty, marże, ceny netto).
"""
import json, os, re, shutil, subprocess, sys, tempfile
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UNITS = os.path.join(ROOT, 'assets', 'js', 'units.js')


def read_price_list(path):
    if path.lower().endswith('.xls'):
        tmp = tempfile.mkdtemp()
        src = os.path.join(tmp, 'cennik.xls'); shutil.copy(path, src)
        subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx', '--outdir', tmp, src],
                       check=True, capture_output=True)
        path = os.path.join(tmp, 'cennik.xlsx')
    ws = openpyxl.load_workbook(path, data_only=True)['cennik']
    rows = list(ws.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if any(str(v).strip().lower() == 'nr' for v in r if v is not None))
    head = [str(v).strip().lower() if v is not None else '' for v in rows[hi]]
    rows = rows[hi:]
    c_id, c_area, c_price = head.index('nr'), head.index('m2'), head.index('cena brutto')
    out = {}
    for r in rows[1:]:
        nr = r[c_id]
        if isinstance(nr, str) and re.fullmatch(r'[MU]\d?\.\d+\.?\d*', nr.strip()):
            out[nr.strip()] = (round(float(r[c_area]), 2), int(round(float(r[c_price]))))
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    check = '--sprawdz' in sys.argv
    date = None
    if '--data' in sys.argv:
        date = sys.argv[sys.argv.index('--data') + 1]; args.remove(date)
    if not args:
        sys.exit(__doc__)
    if not date:
        m = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', os.path.basename(args[0]))
        if not m: sys.exit('Podaj datę cennika: --data RRRR-MM-DD')
        date = '%s-%s-%s' % (m.group(3), m.group(2), m.group(1))
    prices = read_price_list(args[0])

    lines = open(UNITS, encoding='utf-8').read().split('\n')
    seen, changes = set(), []
    for k, line in enumerate(lines):
        m = re.match(r'^(\s*)(\{"id":.*\})(,?)\s*$', line)
        if not m: continue
        u = json.loads(m.group(2)); uid = u['id']
        if uid not in prices: continue
        seen.add(uid)
        area, price = prices[uid]
        if u.get('area') != area:
            changes.append('%s: metraż %s → %s m²' % (uid, u.get('area'), area)); u['area'] = area
        if u.get('price') != price:
            changes.append('%s: cena %s → %s zł' % (uid, u.get('price'), price)); u['price'] = price
            h = u.setdefault('history', [])
            if h and h[-1][0] == date: h[-1][1] = price
            else: h.append([date, price])
        lines[k] = m.group(1) + json.dumps(u, ensure_ascii=False, separators=(',', ':')) + m.group(3)
    missing = sorted(set(prices) - seen)
    print('\n'.join(changes) or 'Bez zmian.')
    if missing: print('Brak na stronie (pominięte):', ', '.join(missing))
    if check: return
    text = '\n'.join(lines)
    d = '.'.join(reversed(date.split('-')))
    text = re.sub(r'według cennika z \d{2}\.\d{2}\.\d{4}', 'według cennika z ' + d, text)
    open(UNITS, 'w', encoding='utf-8').write(text)
    print('Zapisano units.js (cennik z %s, %d zmian).' % (d, len(changes)))


if __name__ == '__main__':
    main()
