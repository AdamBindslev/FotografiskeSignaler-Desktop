# Fotografiske Signaler – Desktop Studio (Fase 1)

> **Version:** 1.0.0-desktop  
> **Platform:** Widescreen Desktop Web App / Desktop-PWA (`100vw × 100vh`)  
> **Arkitekturplan:** Se [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) for komplet 4-fase design- og udviklingsplan.

Fotografiske Signaler – Desktop Studio er et dedikeret widescreen planlægningsværktøj til fotografer, hvor alle fire specialværktøjer (**Sol & Satellitkort**, **Vejranalyse**, **DOF & Optik** samt **Eksponering & ND**) arbejder synkront sammen på én stor skærm i realtid.

---

## 🌟 Nyt i Desktop Studio (Fase 1)

1. **Global Master Topbar:**
   - **Global Lokationsvælger & Fotospots:** Skift lokation via adressesøgning (Photon OSM + Open-Meteo), direkte koordinater, GPS eller dine gemte fotospots – opdaterer både Vejr og Sol/Kort simultant.
   - **Global Master Dato & Klokkeslæt Scrubber:** Træk i tidsslideren (eller tryk Play ▶) i topbaren og se solhøjde, skygger på kortet, 3D-søgeren, time-for-time vejret og det beregnede lysniveau (EV) opdatere live på tværs af alle åbne paneler.
   - **Hurtig Workspace-Vælger (eller genvejstasterne `1`, `2`, `3`):**
     - `1` **Dashboard:** 2×2 Bento-grid med alle 4 moduler synlige på samme skærm.
     - `2` **Planlægning:** Stort Split-View med Sol/Satellitkort + Vejranalyse i fuld højde.
     - `3` **Kamera & Optik:** 3-kolonne optisk arbejdsbord med DOF (Diagram + EVF), Eksponering og 3D-søger.
     - `⤢` **Maksimer enkeltpanel:** Hvert panel kan maksimeres til fuld skærm (og gendannes med `Esc`).
2. **Kombineret Sol & Kort (Dual-View):**
   - Viser **interaktivt Leaflet satellit-/gadekort** med sol- og skyggevektorer side-om-side med den roterbare **Retina 3D EVF-søger**.
3. **Intelligente Kryds-koblinger mellem Modulerne (`WorkspaceState`):**
   - **Vejr → Sol & Kort:** Klik på ethvert fotovindue (*Synk Sol til Solopgang / Aftenlys / Morgentåge*) eller klik direkte på en time-kolonne i time-for-time tabellen for øjeblikkeligt at stille Master-Tiden til den valgte time.
   - **Sol & Vejr → Eksponering (`Auto-EV`):** Slå *"Auto-EV fra Sol/Vejr"* til i Eksponerings-panelet, hvorefter kameraets eksponering automatisk følger solens højde og det aktuelle skydække.
   - **DOF → Eksponering:** Når du ændrer blænde, brændvidde eller sensorformat i DOF-panelet, opdateres Eksponerings-panelet og håndholdt/astro-beregneren live.

---

## 🛠️ Kørsel & Udvikling

```bash
# Start lokal udviklingsserver
npm run dev

# Kør automatiske enhedstests (Vitest)
npm run test

# Byg produktionsklar Desktop-PWA
npm run build
```
