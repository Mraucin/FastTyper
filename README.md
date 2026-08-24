# FastTyper

Wieloosobowa gra w szybkie pisanie (battle royale) na tekstach z polskiej kultury. Działa w przeglądarce i nadaje się na **GitHub Pages** — multiplayer przez PeerJS (WebRTC), bez własnego serwera.

## Jak grać

1. **Trening** — solo, bez pokoju (offline).
2. **Host** otwiera stronę → „Utwórz pokój” → pokazuje 4-znakowy kod.
3. **Gracze** (max 30) → „Dołącz z kodem” → kod + nickname.
4. Host ustawia progi eliminacji i startuje mecz.
5. **Runda 1 jest testowa** (wynik się nie liczy, nikt nie odpada).
6. Kolejne rundy (~45 s, ok. 20–25 słów) eliminują najsłabszych według progów.
7. Wyeliminowani mogą dalej pisać, aż zacznie się faza eliminacji pojedynczej (≤4 graczy) — wtedy oglądają finał.
8. Na końcu tabela miejsc i punktów.

### Punkty

- **100** za każdy poprawny znak (zły klawisz nie przesuwa kursora — trzeba pisać dokładnie).
- **+5** za ten znak za każdego przeciwnika, który go jeszcze nie napisał.
- Ranking i eliminacje według sumy punktów rundy.

### Domyślne progi eliminacji

| Aktywni gracze | Odpada |
| --- | --- |
| > 15 | 4 |
| > 8 | 3 |
| > 4 | 2 |
| ≤ 4 | 1 |

## Połączenie / reconnect

- Wyjście **przed** startem meczu usuwa gracza z listy.
- Wyjście **w trakcie** zachowuje statystyki do końca.
- Zerwanie połączenia: „Ponowne dołączenie” przywraca stan **sprzed bieżącej rundy** (ten sam `playerId` w `localStorage`).
- Nickname jest cache’owany w przeglądarce.

## Development

```bash
npm install
npm run dev
```

## Deploy na GitHub Pages

```bash
npm run build
```

W ustawieniach repozytorium: **Settings → Pages → Deploy from a branch** → folder `/docs`, albo wrzuć zawartość `dist/` do `gh-pages` / Actions.

Przykład workflow (opcjonalnie):

```yaml
# .github/workflows/pages.yml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

W repo ustaw Pages source na **GitHub Actions**.

## Uwagi

- Multiplayer wymaga internetu (broker PeerJS + WebRTC).
- Niektóre sieci (np. szkolne firewalle) mogą blokować WebRTC.
- Host musi mieć otwartą kartę przez cały mecz — to on jest sędzią stanu gry.
