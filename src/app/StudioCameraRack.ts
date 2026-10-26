/**
 * StudioCameraRack.ts - Samlet Kamera-, Optik-, DOF-, Eksponerings- & ND-Filter Rack (Højre Inspector)
 * Designet fra bunden til Desktop Studio (0 scrollbars!):
 *  - Samler Sensor, Brændvidde, Fokusafstand, Blænde, Lukkertid og ISO i ét fysisk kamerastudie.
 *  - Ændrer du Blænde eller Brændvidde én gang, opdaterer både Dybdeskarphed (Dn, Df, Hyperfokal, Diffraktion),
 *    Eksponering (Auto-EV / Låst EV / Histogram / Håndholdt / Astro 500) og Kortets FOV/DOF-kegle øjeblikkeligt!
 *  - Integreret ND-filter-stacking og Bulb-nedtællingstimer direkte i bunden af racket.
 */

import { StudioState, StudioSnapshot } from './StudioState.ts';
import { DofEngine, SENSOR_PRESETS } from '../modules/dof/calculations/dof-engine.ts';
import {
  ExposureEngine,
  STANDARD_APERTURES,
  STANDARD_SHUTTERS,
  STANDARD_ISOS,
  STANDARD_ND_FILTERS
} from '../modules/exposure/calculations/exposure-engine.ts';

const QUICK_FOCALS = [16, 24, 35, 50, 85, 135, 200, 400];
const QUICK_APERTURES = [1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11.0, 16.0];
const QUICK_ND_IDS = ['cpl', 'nd8', 'nd64', 'nd1000', 'nd32000'];

export class StudioCameraRack {
  private container: HTMLElement;
  private bulbRunning = false;
  private bulbRemainingSec = 60;
  private bulbTotalSec = 60;
  private bulbInterval: any = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderSkeleton();
    this.attachEvents();
  }

  private renderSkeleton(): void {
    const sensorOpts = Object.values(SENSOR_PRESETS)
      .map((s) => `<option value="${s.id}">${s.shortName} (${s.cropFactor}×)</option>`)
      .join('');

    this.container.innerHTML = `
      <aside class="studio-camera-rack">
        <!-- SEKTION 1: OPTISK SØGER-HUD & LIVE HISTOGRAM -->
        <div class="rack-section rack-hud-header">
          <div class="rack-title-row">
            <span class="rack-section-title">📷 KAMERA, OPTIK & EKSPONERING</span>
            <button class="rack-auto-ev-pill active" id="btnRackAutoEv" title="Når aktiv, beregnes lyset (EV) automatisk ud fra solens højde og skydækket på det valgte tidspunkt">
              ☀️ Auto-EV: TIL
            </button>
          </div>

          <!-- Kompakt Kamera-Display (F-stop | Shutter | ISO | EV) -->
          <div class="rack-lcd-strip">
            <div class="lcd-cell">
              <span class="lcd-label">BLÆNDE</span>
              <span class="lcd-val val-aperture tabular-nums" id="rackLcdAperture">f/5.6</span>
            </div>
            <div class="lcd-cell">
              <span class="lcd-label">LUKKER</span>
              <span class="lcd-val val-shutter tabular-nums" id="rackLcdShutter">1/125s</span>
            </div>
            <div class="lcd-cell">
              <span class="lcd-label">ISO</span>
              <span class="lcd-val val-iso tabular-nums" id="rackLcdIso">100</span>
            </div>
            <div class="lcd-cell">
              <span class="lcd-label">LYSMÅLER</span>
              <span class="lcd-val tabular-nums" id="rackLcdEv">EV 12.0</span>
            </div>
          </div>

          <!-- Kompakt Histogram + Lysmåler-bar -->
          <div class="rack-hist-row">
            <svg class="rack-hist-svg" id="rackHistSvg" viewBox="0 0 240 42" preserveAspectRatio="none"></svg>
            <div class="rack-ev-status-row">
              <span id="rackSkyEvInfo" class="rack-sky-info">Himmel: EV 12.0 (Dagslys)</span>
              <span id="rackDeltaBadge" class="rack-delta-pill tabular-nums">0.0 EV</span>
            </div>
          </div>
        </div>

        <!-- SEKTION 2: SAMLET OPTIK & EKSPONERINGS-KONTROLLER -->
        <div class="rack-section rack-controls-body">
          <!-- Sensor + IBIS på én kompakt linje -->
          <div class="rack-dual-select-row">
            <div class="rack-field">
              <label>Sensorformat</label>
              <select id="rackSensorSelect" class="rack-select">${sensorOpts}</select>
            </div>
            <div class="rack-field">
              <label>Stabilisering (IBIS)</label>
              <select id="rackIbisSelect" class="rack-select">
                <option value="0">Ingen (0 stops)</option>
                <option value="2">2 stops</option>
                <option value="3" selected>3 stops</option>
                <option value="4">4 stops</option>
                <option value="5">5 stops</option>
              </select>
            </div>
          </div>

          <!-- 1. BRÆNDVIDDE (Styrer både FOV på kortet, DOF og håndholdt/astro lukkertid!) -->
          <div class="rack-control-block">
            <div class="rc-header">
              <span class="rc-label">Brændvidde <small id="rackFovSub" style="color:var(--text-dim);">(FOV 54°)</small></span>
              <span class="rc-val tabular-nums" id="rackFocalVal">35 mm</span>
            </div>
            <input type="range" id="rackFocalSlider" min="10" max="400" step="1" value="35">
            <div class="rack-chips-row" id="rackFocalChips">
              ${QUICK_FOCALS.map((f) => `<button class="rack-chip" data-rfocal="${f}">${f}</button>`).join('')}
            </div>
          </div>

          <!-- 2. FOKUSAFSTAND / MOTIV-PIN (Synkroniseret med Motiv-pin 🎯 på kortet) -->
          <div class="rack-control-block">
            <div class="rc-header">
              <span class="rc-label">🎯 Fokusafstand <small id="rackAzimuthSub" style="color:var(--text-dim);">(Retning 135°)</small></span>
              <div style="display:flex;align-items:center;gap:6px;">
                <button class="rack-mini-action" id="btnRackHyperfocal" title="Sæt fokusafstand og Motiv-pin på kortet til Hyperfokal-afstanden">🎯 Hyperfokal</button>
                <span class="rc-val tabular-nums" id="rackDistVal">12,0 m</span>
              </div>
            </div>
            <input type="range" id="rackDistSlider" min="0.5" max="100" step="0.2" value="12">
          </div>

          <!-- 3. BLÆNDE (Styrer både DOF-skarphedszone og Eksponering!) -->
          <div class="rack-control-block">
            <div class="rc-header">
              <span class="rc-label">Blænde (Aperture)</span>
              <span class="rc-val tabular-nums" style="color:var(--accent-sun);" id="rackApertureVal">f/5.6</span>
            </div>
            <input type="range" id="rackApertureSlider" min="0" max="${STANDARD_APERTURES.length - 1}" step="1" value="13">
            <div class="rack-chips-row" id="rackApertureChips">
              ${QUICK_APERTURES.map((a) => `<button class="rack-chip" data-raperture="${a}">f/${a}</button>`).join('')}
            </div>
          </div>

          <!-- 4. LUKKERTID & ISO (Kompakt 2-kolonne) -->
          <div class="rack-dual-sliders">
            <div class="rack-control-block">
              <div class="rc-header">
                <span class="rc-label">Lukkertid</span>
                <span class="rc-val tabular-nums" style="color:var(--accent-weather);" id="rackShutterVal">1/125s</span>
              </div>
              <input type="range" id="rackShutterSlider" min="0" max="${STANDARD_SHUTTERS.length - 1}" step="1" value="18">
            </div>

            <div class="rack-control-block">
              <div class="rc-header">
                <span class="rc-label">ISO</span>
                <span class="rc-val tabular-nums" style="color:var(--accent-exposure);" id="rackIsoVal">ISO 100</span>
              </div>
              <input type="range" id="rackIsoSlider" min="0" max="${STANDARD_ISOS.length - 1}" step="1" value="3">
            </div>
          </div>
        </div>

        <!-- SEKTION 3: LIVE DYBDESKARPHED (DOF) & LUKKERTIDS-ANALYSE -->
        <div class="rack-section rack-dof-telemetry">
          <div class="rack-title-row" style="margin-bottom:5px;">
            <span class="rack-section-title" style="color:var(--accent-dof);">🎯 DYBDESKARPHED (DOF) & OPTIK</span>
            <span class="rack-diff-pill" id="rackDiffBadge">Optimal skarphed</span>
          </div>

          <div class="rack-dof-grid">
            <div class="dof-cell">
              <span class="dc-lbl">Nærgrænse (Dn)</span>
              <span class="dc-val tabular-nums" id="rackDofNear">--</span>
            </div>
            <div class="dof-cell">
              <span class="dc-lbl">Fjerngrænse (Df)</span>
              <span class="dc-val tabular-nums" style="color:var(--accent-dof);" id="rackDofFar">--</span>
            </div>
            <div class="dof-cell">
              <span class="dc-lbl">Total DOF</span>
              <span class="dc-val tabular-nums" id="rackDofTotal">--</span>
            </div>
            <div class="dof-cell">
              <span class="dc-lbl">Hyperfokal (H)</span>
              <span class="dc-val tabular-nums" style="color:var(--accent-weather);" id="rackDofHyper">--</span>
            </div>
          </div>

          <!-- Foran / Bagved bar -->
          <div class="rack-dof-bar-wrap">
            <div class="rack-dof-bar">
              <div class="rdb-front" id="rackDofFrontBar" style="width:40%;"></div>
              <div class="rdb-rear" id="rackDofRearBar" style="width:60%;"></div>
            </div>
            <div class="rack-dof-sub-row">
              <span id="rackHandheldRule" class="tabular-nums">✋ Håndholdt: 1/15s</span>
              <span id="rackAstroRule" class="tabular-nums">🌌 Astro 500: 14s</span>
            </div>
          </div>
        </div>

        <!-- SEKTION 4: ND-FILTER STACKING & BULB TIMER -->
        <div class="rack-section rack-nd-section">
          <div class="rack-title-row" style="margin-bottom:5px;">
            <span class="rack-section-title" style="color:var(--accent-exposure);">🔲 ND-FILTER & LANGTIDSEKSPONERING</span>
            <button class="rack-mini-action" id="btnRackClearNd">Nulstil ND</button>
          </div>

          <div class="rack-nd-chips" id="rackNdChips">
            ${QUICK_ND_IDS.map((id) => {
              const def = STANDARD_ND_FILTERS.find((x) => x.id === id)!;
              return `<button class="rack-nd-btn" data-nd="${def.id}" title="${def.description}">
                <strong>${def.name.replace(' Polfilter', '')}</strong>
                <span>+${def.stops}st</span>
              </button>`;
            }).join('')}
          </div>

          <div class="rack-nd-result-bar">
            <div class="nd-res-left">
              <span class="nd-res-label" id="rackNdStopsLabel">Uden ND-filter (0 stops)</span>
              <span class="nd-res-val tabular-nums" id="rackNdResultTime">1/125s</span>
            </div>
            <div class="nd-bulb-controls">
              <span class="bulb-countdown tabular-nums" id="rackBulbCountdown" style="display:none;">01:00</span>
              <button class="fs-btn fs-btn-accent-sun rack-bulb-btn" id="btnRackBulbToggle" title="Start nedtællingstimer med den beregnede eksponeringstid">
                ⏳ Timer
              </button>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  private attachEvents(): void {
    // Auto-EV Toggle
    this.container.querySelector('#btnRackAutoEv')?.addEventListener('click', () => {
      const snap = StudioState.getSnapshot();
      StudioState.setAutoEvFromSky(!snap.autoEvFromSky);
    });

    // Sensor & IBIS
    const sensorSel = this.container.querySelector('#rackSensorSelect') as HTMLSelectElement;
    sensorSel?.addEventListener('change', () => {
      StudioState.setSensor(sensorSel.value);
    });

    const ibisSel = this.container.querySelector('#rackIbisSelect') as HTMLSelectElement;
    ibisSel?.addEventListener('change', () => {
      StudioState.setIbisStops(Number(ibisSel.value));
    });

    // Brændvidde
    const focalSlider = this.container.querySelector('#rackFocalSlider') as HTMLInputElement;
    focalSlider?.addEventListener('input', () => {
      StudioState.setFocalLength(Number(focalSlider.value));
    });

    this.container.querySelectorAll('[data-rfocal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        StudioState.setFocalLength(Number((btn as HTMLElement).dataset.rfocal));
      });
    });

    // Fokusafstand + Hyperfokal
    const distSlider = this.container.querySelector('#rackDistSlider') as HTMLInputElement;
    distSlider?.addEventListener('input', () => {
      StudioState.setTargetVector(Number(distSlider.value));
    });

    this.container.querySelector('#btnRackHyperfocal')?.addEventListener('click', () => {
      StudioState.setFocusToHyperfocal();
    });

    // Blænde
    const apSlider = this.container.querySelector('#rackApertureSlider') as HTMLInputElement;
    apSlider?.addEventListener('input', () => {
      const a = STANDARD_APERTURES[Number(apSlider.value)] || 5.6;
      StudioState.setAperture(a);
    });

    this.container.querySelectorAll('[data-raperture]').forEach((btn) => {
      btn.addEventListener('click', () => {
        StudioState.setAperture(Number((btn as HTMLElement).dataset.raperture));
      });
    });

    // Lukkertid
    const shSlider = this.container.querySelector('#rackShutterSlider') as HTMLInputElement;
    shSlider?.addEventListener('input', () => {
      const s = STANDARD_SHUTTERS[Number(shSlider.value)] || 1 / 125;
      StudioState.setShutter(s);
    });

    // ISO
    const isoSlider = this.container.querySelector('#rackIsoSlider') as HTMLInputElement;
    isoSlider?.addEventListener('input', () => {
      const i = STANDARD_ISOS[Number(isoSlider.value)] || 100;
      StudioState.setIso(i);
    });

    // ND-filtre
    this.container.querySelectorAll('[data-nd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.nd!;
        StudioState.toggleNdFilter(id);
      });
    });

    this.container.querySelector('#btnRackClearNd')?.addEventListener('click', () => {
      StudioState.clearNdFilters();
    });

    // Bulb Timer
    this.container.querySelector('#btnRackBulbToggle')?.addEventListener('click', () => {
      this.toggleBulbTimer();
    });
  }

  public update(snap: StudioSnapshot): void {
    // 1. Auto-EV knap
    const autoBtn = this.container.querySelector('#btnRackAutoEv');
    if (autoBtn) {
      autoBtn.classList.toggle('active', snap.autoEvFromSky);
      autoBtn.textContent = snap.autoEvFromSky ? '☀️ Auto-EV: TIL' : '🔓 Manuel EV';
    }

    // 2. Top LCD Strip
    const lcdA = this.container.querySelector('#rackLcdAperture');
    const lcdS = this.container.querySelector('#rackLcdShutter');
    const lcdI = this.container.querySelector('#rackLcdIso');
    const lcdEv = this.container.querySelector('#rackLcdEv');

    if (lcdA) lcdA.textContent = `f/${snap.aperture}`;
    if (lcdS) lcdS.textContent = ExposureEngine.formatShutterSpeed(snap.shutter);
    if (lcdI) lcdI.textContent = String(snap.iso);
    if (lcdEv) lcdEv.textContent = `EV ${snap.cameraEvIso.toFixed(1)}`;

    // 3. Histogram & EV Delta
    const histSvg = this.container.querySelector('#rackHistSvg') as SVGSVGElement;
    if (histSvg) {
      const pathD = ExposureEngine.generateHistogramPath(snap.deltaEv, 240, 42);
      histSvg.innerHTML = `
        <path d="${pathD}" fill="rgba(168, 85, 247, 0.35)" stroke="#a855f7" stroke-width="1.5" />
      `;
    }

    const skyInfo = this.container.querySelector('#rackSkyEvInfo');
    if (skyInfo) {
      skyInfo.textContent = `Naturligt lys: EV ${snap.ambientSkyEv100.toFixed(1)} (${snap.ambientSkyLabel})`;
    }

    const deltaBadge = this.container.querySelector('#rackDeltaBadge');
    if (deltaBadge) {
      const sign = snap.deltaEv >= 0 ? '+' : '';
      deltaBadge.textContent = `${sign}${snap.deltaEv.toFixed(1)} EV`;
      deltaBadge.className = `rack-delta-pill tabular-nums ${Math.abs(snap.deltaEv) <= 0.4 ? 'ok' : 'warn'}`;
    }

    // 4. Synkroniser inputs og chips
    const sensorSel = this.container.querySelector('#rackSensorSelect') as HTMLSelectElement;
    if (sensorSel && sensorSel.value !== snap.sensorId) sensorSel.value = snap.sensorId;

    const focalVal = this.container.querySelector('#rackFocalVal');
    const fovSub = this.container.querySelector('#rackFovSub');
    const focalSlider = this.container.querySelector('#rackFocalSlider') as HTMLInputElement;
    if (focalVal) focalVal.textContent = `${snap.focalLengthMm} mm`;
    if (fovSub) fovSub.textContent = `(FOV ${snap.horizontalFovDeg.toFixed(0)}° • Udsnit ${DofEngine.formatDistance(snap.fovWidthAtSubjectM)})`;
    if (focalSlider && Number(focalSlider.value) !== snap.focalLengthMm) {
      focalSlider.value = String(snap.focalLengthMm);
    }

    this.container.querySelectorAll('[data-rfocal]').forEach((b) => {
      b.classList.toggle('active', Number((b as HTMLElement).dataset.rfocal) === snap.focalLengthMm);
    });

    const distVal = this.container.querySelector('#rackDistVal');
    const azSub = this.container.querySelector('#rackAzimuthSub');
    const distSlider = this.container.querySelector('#rackDistSlider') as HTMLInputElement;
    if (distVal) distVal.textContent = DofEngine.formatDistance(snap.subjectDistanceM);
    if (azSub) azSub.textContent = `(Sigte ${snap.cameraAzimuthDeg}°)`
    if (distSlider && Math.abs(Number(distSlider.value) - snap.subjectDistanceM) > 0.1) {
      distSlider.value = String(Math.min(100, snap.subjectDistanceM));
    }

    const apVal = this.container.querySelector('#rackApertureVal');
    const apSlider = this.container.querySelector('#rackApertureSlider') as HTMLInputElement;
    if (apVal) apVal.textContent = `f/${snap.aperture}`;
    if (apSlider) {
      const idx = STANDARD_APERTURES.indexOf(snap.aperture);
      if (idx !== -1) apSlider.value = String(idx);
    }
    this.container.querySelectorAll('[data-raperture]').forEach((b) => {
      b.classList.toggle('active', Math.abs(Number((b as HTMLElement).dataset.raperture) - snap.aperture) < 0.05);
    });

    const shVal = this.container.querySelector('#rackShutterVal');
    const shSlider = this.container.querySelector('#rackShutterSlider') as HTMLInputElement;
    if (shVal) shVal.textContent = ExposureEngine.formatShutterSpeed(snap.shutter);
    if (shSlider) {
      const idx = STANDARD_SHUTTERS.indexOf(snap.shutter);
      if (idx !== -1) shSlider.value = String(idx);
    }

    const isoVal = this.container.querySelector('#rackIsoVal');
    const isoSlider = this.container.querySelector('#rackIsoSlider') as HTMLInputElement;
    if (isoVal) isoVal.textContent = `ISO ${snap.iso}`;
    if (isoSlider) {
      const idx = STANDARD_ISOS.indexOf(snap.iso);
      if (idx !== -1) isoSlider.value = String(idx);
    }

    // 5. DOF Nøgletal
    const dofNear = this.container.querySelector('#rackDofNear');
    const dofFar = this.container.querySelector('#rackDofFar');
    const dofTotal = this.container.querySelector('#rackDofTotal');
    const dofHyper = this.container.querySelector('#rackDofHyper');
    const diffBadge = this.container.querySelector('#rackDiffBadge');

    if (dofNear) dofNear.textContent = DofEngine.formatDistance(snap.dof.nearLimitM);
    if (dofFar) dofFar.textContent = snap.dof.isInfinity ? '∞ (Uendelig)' : DofEngine.formatDistance(snap.dof.farLimitM);
    if (dofTotal) dofTotal.textContent = snap.dof.isInfinity ? '∞ (Hyperfokal)' : DofEngine.formatDistance(snap.dof.totalDofM);
    if (dofHyper) dofHyper.textContent = DofEngine.formatDistance(snap.dof.hyperfocalM);
    if (diffBadge) {
      diffBadge.textContent = snap.dof.diffractionStatus.label;
      diffBadge.className = `rack-diff-pill ${snap.dof.diffractionStatus.level}`;
    }

    const fBar = this.container.querySelector('#rackDofFrontBar') as HTMLElement;
    const rBar = this.container.querySelector('#rackDofRearBar') as HTMLElement;
    if (fBar && rBar) {
      fBar.style.width = `${snap.dof.frontPercent}%`;
      rBar.style.width = `${snap.dof.rearPercent}%`;
    }

    const hhRule = this.container.querySelector('#rackHandheldRule');
    const astroRule = this.container.querySelector('#rackAstroRule');
    if (hhRule) hhRule.textContent = `✋ Håndholdt: ${snap.handheldSafeShutter}`;
    if (astroRule) astroRule.textContent = `🌌 Astro 500: ${snap.astro500Shutter}`;

    // 6. ND-filter & Bulb
    this.container.querySelectorAll('[data-nd]').forEach((btn) => {
      const id = (btn as HTMLElement).dataset.nd!;
      btn.classList.toggle('active', snap.selectedNdIds.includes(id));
    });

    const ndStopsLbl = this.container.querySelector('#rackNdStopsLabel');
    const ndTimeVal = this.container.querySelector('#rackNdResultTime');
    if (ndStopsLbl) {
      ndStopsLbl.textContent =
        snap.ndTotalStops > 0 ? `Med ND (+${snap.ndTotalStops} stops):` : 'Eksponeringstid (0 stops ND):';
    }
    if (ndTimeVal) {
      ndTimeVal.textContent = snap.ndResultDisplay;
    }

    if (!this.bulbRunning) {
      this.bulbTotalSec = Math.max(1, Math.round(snap.ndResultShutterSec));
      this.bulbRemainingSec = this.bulbTotalSec;
    }
  }

  private toggleBulbTimer(): void {
    const countEl = this.container.querySelector('#rackBulbCountdown') as HTMLElement;
    const btn = this.container.querySelector('#btnRackBulbToggle') as HTMLElement;

    if (this.bulbRunning) {
      this.bulbRunning = false;
      if (this.bulbInterval) clearInterval(this.bulbInterval);
      if (countEl) countEl.style.display = 'none';
      if (btn) btn.textContent = '⏳ Timer';
      return;
    }

    const snap = StudioState.getSnapshot();
    this.bulbTotalSec = Math.max(1, Math.round(snap.ndResultShutterSec));
    this.bulbRemainingSec = this.bulbTotalSec;
    this.bulbRunning = true;

    if (countEl) {
      countEl.style.display = 'inline-block';
      this.renderBulbTime(countEl);
    }
    if (btn) btn.textContent = '⏹ Stop';

    this.bulbInterval = setInterval(() => {
      this.bulbRemainingSec--;
      if (this.bulbRemainingSec <= 0) {
        clearInterval(this.bulbInterval);
        this.bulbRunning = false;
        if (countEl) countEl.textContent = 'FÆRDIG!';
        if (btn) btn.textContent = '⏳ Timer';
        this.playBeep();
      } else if (countEl) {
        this.renderBulbTime(countEl);
      }
    }, 1000);
  }

  private renderBulbTime(el: HTMLElement): void {
    const m = Math.floor(this.bulbRemainingSec / 60);
    const s = this.bulbRemainingSec % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private playBeep(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore
    }
  }
}
