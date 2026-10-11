# Gloop XL

Grotere, rustigere games voor tieners en volwassenen, van de makers van [Gloop](https://www.gloopie.nl).
Statische site: geen build-stap, alles zelf gehost (geen CDN's, geen Google Fonts).

## Mappen
- `index.html`: startpagina met de games
- `little-farm-island/index.html`: spelpagina (het spel in een kader, met uitleg eronder)
- `little-farm-island/spel/index.html`: het spel zelf (Three.js r128, één bestand)
- `inloggen.html`: inloggen met je Gloop-account
- `privacy.html`, `cookies.html`: verklaringen
- `xl.css`, `xl.js`: stijl en account-hulp (gedeeld door alle pagina's)
- `vendor/`, `fonts/`, `icons/`: Three.js, Fredoka/Nunito, app-iconen
- `sw.js` + `manifest.webmanifest`: offline spelen en installeren als app

## Accounts
Er is geen eigen backend. Inloggen gaat via de API van Gloop (`/api/xl/login`, `/me`, `/sync`, `/logout`)
met dezelfde naam en pincode als op Gloop. Het adres van Gloop staat bovenin `xl.js`.
Gloop accepteert alleen verzoeken van het adres in `SITE.xlUrl` (`lib/site.js` in de Gloop-repo)
en van extra adressen in de omgevingsvariabele `GLOOP_XL_ORIGINS`. Verandert het adres van XL
(bijv. een eigen domein)? Pas het dan daar aan.

Het eiland gaat mee in het account (veld `lfi`). Bij twee versies wint: eerst de nieuwste "Opnieuw beginnen",
dan de meeste voortgang (oogsten + vissen), dan de laatst bewaarde. Zelfde regel als `pickLfi` in Gloop.

## Opslag in de browser
`littlefarmisland.save.v1` (eiland), `gloopxl.token` (inlogcode). Voeg je iets toe dat gegevens
verstuurt of opslaat? Pas dan ook `privacy.html` en `cookies.html` aan.

## Lokaal testen
Start Gloop op poort 3100 en deze site met een statische server, bijv. `npx serve -l 4600 .`.
Op localhost praat `xl.js` vanzelf met `http://localhost:3100`.

## Online zetten (Vercel)
Nieuw project → deze repo importeren → Framework "Other", geen build command.
Bij een wijziging in `vendor/`, `fonts/` of `icons/`: verhoog `VERSIE` in `sw.js`.

## Let op: repo openbaar houden
Op het gratis Vercel-abonnement (Hobby) zet Vercel commits uit een **privé** repo alleen live als
de eigenaar ze zelf heeft gemaakt. Commits van anderen worden dan geblokkeerd. Houd deze repo daarom
openbaar; er staan geen geheime gegevens in (sleutels staan alleen in de instellingen van Vercel).
