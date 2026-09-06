# Skácko Playlist – SK Boršice

Jednoduchá mobile-first PWA (progresivní webová appka) pro puštění gólové
sirény a hudby na tribuně:

- **Velké tlačítko GÓL!** nahoře – jedno klepnutí pustí `assets/gol-song.mp3`,
  druhé klepnutí ho zastaví.
- **Playlist** pod tím – všechny písničky ze složky `assets/songs/`, klepnutím
  se přehrají (a zastaví se tím, co hrálo předtím).
- **Hraje i se zamčenou obrazovkou** díky Media Session API a `<audio>`
  elementu (viz omezení iOS níže).
- **Funguje i offline** – appka i jednou přehrané písničky se uloží do cache
  (service worker), takže je jde pustit znovu i bez signálu na stadionu.

## Jak appku dostat na telefon

1. Appku nasaď na GitHub Pages (viz níže) – dostaneš adresu typu
   `https://<tvůj-github-účet>.github.io/skacko-playlist/`.
2. Otevři tu adresu v telefonu.
3. **Android (Chrome):** klepni na nabídku (⋮) → *Přidat na plochu* /
   *Instalovat aplikaci*.
4. **iPhone (Safari):** klepni na ikonu sdílení (□↑) → *Přidat na plochu*.
5. Appka se pak chová jako normální appka – ikona na ploše, běží na celou
   obrazovku, bez adresního řádku.

## Přehrávání se zamčenou obrazovkou – co čekat

- **Android / Chrome:** funguje spolehlivě – jakmile appka hraje, na
  zamčené obrazovce se objeví přehrávač s ovládáním (play/pauza), hudba hraje
  dál i po zamknutí telefonu.
- **iPhone / Safari:** funguje také, ale je citlivější na to, jak appku
  otevřeš – nejlíp funguje, když si appku přidáš na plochu (viz výše) a
  spustíš písničku z ní. Pokud iPhone hudbu při zamknutí utne, pomůže mít
  appku puštěnou jako přidanou ikonu na ploše (ne jen kartu v Safari).

Tohle je omezení mobilních prohlížečů obecně, ne appky samotné – kdyby to na
konkrétním telefonu dělalo problémy, dej vědět, dá se doladit.

## Nasazení na GitHub Pages

Repozitář `skacko-playlist` už na GitHubu existuje, appka do něj byla
nahraná do větve `main`, do kořenové složky. Stačí zapnout Pages:

1. Na GitHubu otevři repozitář → **Settings** → **Pages**.
2. V sekci *Build and deployment* vyber **Deploy from a branch**.
3. Branch: **main**, složka: **/ (root)** → **Save**.
4. Za chvíli se objeví adresa appky (obvykle
   `https://<účet>.github.io/skacko-playlist/`).

Po každé změně v `main` větvi se stránka do pár minut sama aktualizuje.

## Jak přidat/vyměnit písničky

1. Přetáhni nové `.mp3` soubory do `assets/songs/` (klidně s mezerami a
   diakritikou v názvu, jako doteď).
2. Spusť (potřebuješ [Node.js](https://nodejs.org)):

   ```bash
   npm run generate-playlist
   ```

   Tenhle skript soubory s "obyčejným" názvem přejmenuje na bezpečný tvar
   pro web (bez mezer a diakritiky), z původního názvu udělá hezký titulek
   pro playlist (schová `(Official Video)` apod.) a přegeneruje
   `assets/playlist.json`. Už zpracované soubory nechá být.

3. Commitni změny a pushni – appka se automaticky aktualizuje.

Gólovou sirénu vyměníš tak, že nahradíš soubor `assets/gol-song.mp3` (musí se
jmenovat přesně takhle).

> Pozor: pokud appku aktualizuješ (nový vzhled, nové soubory), zvyš číslo v
> `CACHE_VERSION` na začátku `sw.js` – jinak telefonům, které appku už mají
> uloženou offline, může chvíli trvat, než uvidí novou verzi.

## Lokální vývoj

Service worker potřebuje běžet přes `http(s)`, ne přímo otevřený soubor, proto:

```bash
npm run dev
# otevři http://localhost:8080
```

## Struktura projektu

```
skacko-playlist/
├── index.html              hlavní stránka appky
├── styles.css              vzhled (žluto-zelené téma SK Boršice)
├── app.js                  přehrávání, playlist, Media Session, registrace SW
├── sw.js                   service worker – offline cache
├── manifest.webmanifest    PWA manifest (ikona, název, barvy)
├── icons/                  ikony appky (různé velikosti + maskable + Apple)
├── scripts/
│   └── generate-playlist.js   pomocný skript pro přidávání písniček
└── assets/
    ├── gol-song.mp3         gólová siréna
    ├── playlist.json        seznam písniček (soubor + titulek)
    └── songs/                jednotlivé mp3 z playlistu
```
