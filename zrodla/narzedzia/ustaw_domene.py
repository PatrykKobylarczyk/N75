#!/usr/bin/env python3
"""Przełącza adres strony we wszystkich miejscach, które go zawierają: canonical, Open Graph, dane strukturalne,
sitemap.xml, robots.txt, karta lokalu (assets/js/unit.js) i strona 404.

Użycie (z katalogu głównego repo):
    python3 zrodla/narzedzia/ustaw_domene.py https://n75.pl/
    python3 zrodla/narzedzia/ustaw_domene.py https://n75.pl/ --sprawdz     # tylko pokazuje, co by się zmieniło

Obecny adres bazowy to https://n75.vercel.app/stara/ (strona żyje pod /stara/, a / jest pusty).
Po przeniesieniu strony pod / trzeba też w vercel.json skierować / na start.html (rewrite) i usunąć pusty index.html
albo podmienić go na start.html; strona 404 dostaje wtedy linki do / zamiast /stara/.
"""
import pathlib, re, sys

OLD = 'https://n75.vercel.app/stara/'
ROOT = pathlib.Path(__file__).resolve().parents[2]
FILES = sorted([*ROOT.glob('*.html'), ROOT / 'sitemap.xml', ROOT / 'robots.txt', ROOT / 'assets/js/unit.js'])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1 or not re.match(r'^https://[^/]+/(.+/)?$', args[0]):
        sys.exit('Podaj nowy adres bazowy, np. https://n75.pl/ (z https:// i ukośnikiem na końcu).')
    new, dry = args[0], '--sprawdz' in sys.argv
    old_root, new_root = '/' + OLD.split('/', 3)[3], '/' + new.split('/', 3)[3]   # '/stara/' -> '/'
    robots_old = OLD.split('/stara/')[0] + '/sitemap.xml'
    total = 0
    for f in FILES:
        if not f.exists():
            continue
        s = f.read_text()
        t = s.replace(OLD, new)
        if f.name == 'robots.txt':
            t = t.replace(robots_old, new + 'sitemap.xml')
        if f.name == '404.html':
            t = t.replace('href="' + old_root, 'href="' + new_root)
        if t != s:
            n = sum(1 for a, b in zip(s.splitlines(), t.splitlines()) if a != b)
            total += n
            print(f'{f.relative_to(ROOT)}: {n} linii')
            if not dry:
                f.write_text(t)
    print(('Do zmiany' if dry else 'Zmieniono') + f': {total} linii. Pamiętaj o zgłoszeniu nowej mapy strony w Google Search Console.')


if __name__ == '__main__':
    main()
