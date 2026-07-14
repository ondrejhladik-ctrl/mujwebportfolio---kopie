# Portfolio — Ondřej Hladík

Statický, ručně postavený portfoliový web pro prezentaci grafických prací.
Bez build kroku, bez frameworků — stačí otevřít `index.html`.

**Minimalistický dark editorial styl:** černé pozadí, krémový text, jediný korálový
akcent, a **brouci** jako vizuální motiv (bílí na černé). Obsah v angličtině.
Dva fonty: **Space Grotesk** (grotesk) + **Georgia** (antikva/serif — stejné jako logo „ho").

```
mujwebportfolio/
├─ index.html        # struktura a obsah
├─ css/styles.css    # design systém (barvy, typografie, layout)
├─ js/main.js        # interakce (scramble, word-reveal, filtry, náhled…)
├─ logo.svg          # logo „ho" (bílé, do navigace)
├─ favicon.svg       # favicon (černo-bílý)
└─ img/
   ├─ beetle-1.svg   # brouk 1  ← PLACEHOLDER, vyměň za svůj
   ├─ beetle-2.svg   # brouk 2  ← PLACEHOLDER
   └─ beetle-3.svg   # brouk 3  ← PLACEHOLDER
```

## Spuštění
Dvojklik na `index.html`, nebo lokální server:
```bash
npx serve .          # nebo: python -m http.server
```

## 🪲 Brouci — vyměnit za tvoje
Teď jsou tam moje **placeholdery**. Nahraď je svými:
1. V Illustratoru dej **File → Export → Export As → SVG** (u každého brouka).
   Ideálně černá výplň na průhledném pozadí (web si je sám obarví na bílo).
2. Ulož jako `img/beetle-1.svg`, `img/beetle-2.svg`, `img/beetle-3.svg`
   (přepiš stávající soubory — nemusíš měnit žádný kód).

Brouci se používají na 3 místech (vše řízené v CSS/JS, není potřeba zasahovat):
- **Hero** — velký brouk jako vodoznak vpravo (`.hero__beetle`, průhlednost `opacity: .10`).
- **Náhled u kurzoru** — po najetí na projekt vyjede brouk (cyklí 1 → 2 → 3).
- **Marquee** — malí brouci jako oddělovače.

> Bílé zobrazení dělá CSS `filter: invert(1)` — proto exportuj brouky **černé**.
> (Zdroj `BROUK 1.ai` mám, ale .ai neumím převést — proto potřebuju SVG export.)

## Další úpravy

### Projekty (tabulka)
Každý projekt je řádek `<a class="work-row">` v `index.html`:
```html
<a href="#" class="work-row" data-cat="identita" data-art="art--1">
  <span class="work-row__title">Mangrove</span>
  <span class="work-row__desc">Popis projektu…</span>
  <span class="work-row__cat mono">IDENTITY</span>
  <span class="work-row__arrow">↗</span>
</a>
```
- `data-cat` musí sedět s filtrem nahoře (`identita`, `plakaty`, `editorial`, `web`, `typografie`).
- `data-art` řídí, který brouk vyjede v náhledu (číslo → cyklí přes 3 brouky).

### Barvy
Vše v `:root` na začátku `css/styles.css`:
```css
--coral: #FF5436;   /* jediný akcent */
--bg:    #000000;   /* pozadí */
--fg:    #F4F1EA;   /* text */
```

### Texty a odkazy
- Hero, About, Contact — přímo v HTML.
- Sociální sítě — nahraď `href="#"` skutečnými URL.
- Fotka v About — nahraď `<figure class="about__photo">` za `<img class="about__img" src="img/portrait.jpg">`.

## Funkce
Scramble nadpisy · scroll word-reveal · náhled brouka u kurzoru · filtry projektů ·
vlastní kurzor · magnetická tlačítka · marquee · scroll progress · respektuje
`prefers-reduced-motion` · plně responzivní.

## Nasazení
Statické soubory — **Netlify, Vercel, GitHub Pages, Cloudflare Pages** (drag & drop).
