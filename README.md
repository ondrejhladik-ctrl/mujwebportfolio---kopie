# ohdesign studio — portfolio Ondřeje Hladíka

Statický, ručně postavený portfoliový web (**ohdesign.eu**). Bez build kroku,
bez frameworků — stačí otevřít `index.html`.

Světlý „paper" styl (krémové pozadí, inkoustový text, jediný korálový akcent),
obsah v angličtině. Dva fonty: **Space Grotesk** (self-hosted ve `fonts/`)
+ **Georgia** (stejná jako logo „ho").

```
mujwebportfolio/
├─ index.html            # struktura, obsah, SEO meta + JSON-LD
├─ css/styles.css        # design systém (@font-face, barvy, typografie, layout)
├─ js/main.js            # interakce (intro loader, reveal, menu, modaly projektů + týmu)
├─ fonts/                # Space Grotesk (variable, woff2, latin + latin-ext)
├─ logo.svg / favicon.svg
├─ apple-touch-icon.png / icon-512.png
├─ robots.txt / sitemap.xml
└─ img/
   ├─ og.png             # náhled pro sdílení (Facebook, LinkedIn, iMessage…)
   ├─ <projekt>/*.jpg    # originály
   ├─ <projekt>/*.webp   # zmenšené verze pro web (generované z originálů)
   └─ team/ondrej.webp
```

## Spuštění
Dvojklik na `index.html`, nebo lokální server:
```bash
python -m http.server 8765   # http://127.0.0.1:8765
```

## Přidání projektu
1. Karta v `index.html` uvnitř `.projects__grid` (zkopíruj existující `<article class="pcard">`).
   Do `data-project="slug"` dej klíč projektu.
2. Texty, galerie a odkaz na web patří do objektu `PROJECTS` v `js/main.js`
   (`desc`, `credits`, `shots: [{ img: 'img/slug/foto.webp', wide: true }]`, `web`).
3. Obrázky ukládej jako **WebP** (kvalita ~80, max. 1800 px na šířku) — u karet
   na homepage přidej i varianty 720/900/1200 px do `srcset`.

## SEO (co je hotové a co dělat dál)
- `<title>`, meta description, canonical, Open Graph + Twitter card, JSON-LD
  (`ProfessionalService` ohdesign studio + `Person` Ondřej Hladík), `robots.txt`, `sitemap.xml`.
- Po každém nasazení: v **Google Search Console** → „Kontrola URL" → *Požádat o indexaci*.
- Značku piš všude stejně: **ohdesign studio** (Instagram bio, LinkedIn, e-mailový podpis)
  a odkazuj z nich na https://ohdesign.eu/.

## Barvy
Vše v `:root` na začátku `css/styles.css`:
```css
--coral: #FF5436;   /* jediný akcent */
--bg:    #F4F1EA;   /* pozadí */
--fg:    #17140E;   /* text */
```

## Nasazení
Web běží na **GitHub Pages** z repozitáře `mujwebportfolio---kopie` (složka
`mujwebportfolio - kopie`, `CNAME` = ohdesign.eu). Po úpravách zkopíruj soubory
do této složky (kromě `CNAME` a `.git`) a v GitHub Desktop udělej commit + push.
