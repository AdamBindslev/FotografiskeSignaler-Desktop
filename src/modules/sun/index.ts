/**
 * index.ts - Sol & Kort Desktop Panel (Dual-View: Interaktivt Satellit-/Gadekort + 3D EVF Søger side-om-side)
 * Synkroniseret i realtid med Global Master-Tid (TimeService) og Lokation (LocationService).
 */

import { ModuleInstance } from '../../app/ModuleRegistry.ts';
import { AstroCore, SunTimes, ShadowCalculation } from '../../shared/astronomy/AstroCore.ts';
import { LocationService, GeoLocation } from '../../shared/services/LocationService.ts';
import { TimeService } from '../../shared/services/TimeService.ts';
import { ShadowSimulator } from './visualization/shadow-sim.ts';
import { MapView } from './visualization/map-view.ts';
import './sun.css';

export default class SunModule implements ModuleInstance {
  private container!: HTMLElement;
  private simulator: ShadowSimulator | null = null;
  private mapView: MapView | null = null;

  // På desktop er 'split' (Kort + 3D side om side) standard!
  private viewLayout: 'split' | '3d' | 'compass' | 'map' = 'split';
  private canvasSubMode: '3d' | 'compass' = '3d';
  private subjectType: 'person' | 'tree' | 'building' | 'custom' = 'person';
  private subjectHeight: number = 1.75;

  private currentDate: Date = TimeService.getDate();
  private currentLocation: GeoLocation = LocationService.getLocation();

  private isPlaying: boolean = false;
  private playSpeed: number = 1;
  private playIntervalId: any = null;

  private unsubLocation: (() => void) | null = null;
  private unsubTime: (() => void) | null = null;
  private isInternalTimeChange = false;

  public async mount(container: HTMLElement): Promise<void> {
    this.container = container;
    this.currentLocation = LocationService.getLocation();
    this.currentDate = TimeService.getDate();

    this.render();
    this.initSimulator();
    await this.initMap();
    this.attachEventListeners();
    this.updateCalculations();

    // Lyt på Global Lokation
    this.unsubLocation = LocationService.subscribe((loc) => {
      this.currentLocation = loc;
      this.updateCalculations();
      if (this.mapView) {
        this.mapView.setCenter(loc.lat, loc.lng);
      }
    });

    // Lyt på Global Master-Tid
    this.unsubTime = TimeService.subscribe((d) => {
      if (this.isInternalTimeChange) return;
      this.currentDate = d;
      const mins = d.getHours() * 60 + d.getMinutes();
      const slider = this.container.querySelector('#sunTimeSlider') as HTMLInputElement | null;
      if (slider && Number(slider.value) !== mins) {
        slider.value = String(mins);
      }
      this.updateCalculations();
    });
  }

  public onActivate(): void {
    this.simulator?.resume();
    this.mapView?.invalidateSize();
    this.updateCalculations();
  }

  public onDeactivate(): void {
    this.pausePlayback();
  }

  private render(): void {
    const minutesOfDay = this.currentDate.getHours() * 60 + this.currentDate.getMinutes();

    this.container.innerHTML = `
      <div class="sun-container desktop-sun-panel">
        <!-- 1. KOMPAKT TELEMETRI TOP-STRIP -->
        <div class="sun-hero-card desktop-sun-telemetry">
          <div class="sun-main-telemetry">
            <div style="display:flex;align-items:baseline;gap:12px;">
              <div class="sun-time-large tabular-nums" id="sunTimeDisplay">${TimeService.formatTime(this.currentDate)}</div>
              <div class="sun-date-sub" id="sunDateDisplay">${TimeService.formatDateDanish(this.currentDate)}</div>
            </div>
            <div class="sun-phase-badge-wrap">
              <span class="fs-badge badge-sun" id="sunLightPhaseBadge">Gylden time</span>
              <span class="sun-kelvin-badge tabular-nums" id="sunKelvinDisplay">3300K</span>
            </div>
          </div>

          <div class="sun-grid-metrics">
            <div class="stat-item">
              <span class="stat-label">Solhøjde</span>
              <span class="stat-num tabular-nums" id="sunAltitudeVal">+0.0°</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Solretning</span>
              <span class="stat-num tabular-nums" id="sunAzimuthVal">180° S</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Skyggelængde (${this.subjectHeight.toFixed(1).replace('.', ',')}m)</span>
              <span class="stat-num tabular-nums" id="sunShadowLengthVal">0,0 m</span>
            </div>
          </div>
        </div>

        <!-- 2. DUAL-VIEW SCENE: KORT + 3D EVF SIDE-OM-SIDE -->
        <div class="sun-scene-card desktop-dual-scene-card">
          <div class="scene-header-row">
            <div class="fs-segmented-control" style="max-width: 390px;">
              <button class="fs-segment-btn ${this.viewLayout === 'split' ? 'active' : ''}" data-layout="split">⚡ Kort + 3D Split</button>
              <button class="fs-segment-btn ${this.viewLayout === 'map' ? 'active' : ''}" data-layout="map">🗺️ Kun Kort</button>
              <button class="fs-segment-btn ${this.viewLayout === '3d' ? 'active' : ''}" data-layout="3d">🎥 Kun 3D</button>
              <button class="fs-segment-btn ${this.viewLayout === 'compass' ? 'active' : ''}" data-layout="compass">🧭 Solur</button>
            </div>

            <!-- Kameragenveje for 3D-søger -->
            <div class="camera-preset-bar desktop-cam-presets" id="cameraPresetsWrap">
              <button class="quick-val-btn" data-cam="default">Standard 3D</button>
              <button class="quick-val-btn" data-cam="top">Top</button>
              <button class="quick-val-btn" data-cam="rim">Modlys</button>
              <button class="quick-val-btn" data-cam="shadow">Medlys</button>
            </div>
          </div>

          <!-- Dual Viewport Container -->
          <div class="desktop-dual-viewport layout-${this.viewLayout}" id="sunDualViewport">
            <!-- Venstre/Første: Interaktivt Leaflet Kort med Sol- & Skyggevektor -->
            <div class="dual-pane pane-map" id="sunMapPane">
              <div id="sunMapContainer" style="width:100%;height:100%;"></div>
              <div class="pane-corner-tag">🗺️ Klik eller træk kamera-pin på kortet</div>
            </div>

            <!-- Højre/Anden: Retina 3D EVF / Solur Canvas -->
            <div class="dual-pane pane-canvas" id="sunCanvasPane">
              <canvas id="sunCanvas"></canvas>
              <div class="pane-corner-tag" id="sunCanvasTag">🎥 3D Søger (træk for at rotere)</div>
            </div>
          </div>
        </div>

        <!-- 3. DØGN-SCRUBBER & HURTIGSPRING TIL SOLTIDER -->
        <div class="timeline-card desktop-sun-timeline">
          <div class="timeline-controls-row">
            <div class="playback-btns">
              <button class="btn-play-pause" id="btnPlayPause" title="Start/Pause tidsanimation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
              <button class="btn-speed-badge" id="btnSpeedToggle">1x</button>
            </div>

            <!-- Hurtige planlægnings-presets -->
            <div class="sun-date-presets-scroll" id="sunDatePresets" style="flex:1;margin:0 8px;">
              <button class="sun-preset-pill active" data-preset="today">I dag</button>
              <button class="sun-preset-pill" data-preset="tomorrow">I morgen</button>
              <button class="sun-preset-pill" data-preset="week">+7 dage</button>
              <button class="sun-preset-pill" data-preset="summer-solstice">☀️ Sommersolhverv</button>
              <button class="sun-preset-pill" data-preset="winter-solstice">❄️ Vintersolhverv</button>
            </div>

            <button class="fs-btn" id="btnJumpNow" style="padding: 4px 10px; font-size: 11px; min-height: 28px;">
              Nu
            </button>
          </div>

          <div class="fs-slider-wrap" style="margin-bottom:6px;">
            <input type="range" id="sunTimeSlider" min="0" max="1439" step="1" value="${minutesOfDay}">
          </div>

          <!-- Hurtige spring til solopgang, gylden time, solmiddag, solnedgang -->
          <div class="sun-jump-scroll" id="sunQuickJumps"></div>
        </div>

        <!-- 4. MOTIVHØJDE & FOTOGRAFISK LYS-TIP -->
        <div class="fs-card" style="margin-bottom:0;">
          <div class="fs-card-header" style="margin-bottom:8px;">
            <span class="fs-card-title">Motiv & Skyggemodel</span>
            <span class="fs-badge" id="subjectHeightBadge">${this.subjectHeight.toFixed(2).replace('.', ',')} m</span>
          </div>

          <div class="subject-selector-row" style="grid-template-columns: repeat(4, 1fr);">
            <button class="subject-btn ${this.subjectType === 'person' ? 'active' : ''}" data-subject="person" data-height="1.75">
              <span class="subject-icon">👤</span>
              <span class="subject-name">Person (1,75m)</span>
            </button>
            <button class="subject-btn ${this.subjectType === 'tree' ? 'active' : ''}" data-subject="tree" data-height="5.0">
              <span class="subject-icon">🌳</span>
              <span class="subject-name">Træ (5m)</span>
            </button>
            <button class="subject-btn ${this.subjectType === 'building' ? 'active' : ''}" data-subject="building" data-height="12.0">
              <span class="subject-icon">🏢</span>
              <span class="subject-name">Bygning (12m)</span>
            </button>
            <button class="subject-btn ${this.subjectType === 'custom' ? 'active' : ''}" data-subject="custom" data-height="${this.subjectHeight}">
              <span class="subject-icon">📏</span>
              <span class="subject-name">Valgfri</span>
            </button>
          </div>

          <div class="fs-slider-wrap" id="customHeightWrap" style="margin-top: 10px; display: ${this.subjectType === 'custom' ? 'flex' : 'none'};">
            <div class="fs-slider-header">
              <span class="fs-slider-label">Brugerdefineret højde</span>
              <span class="fs-slider-val" id="customHeightDisplay">${this.subjectHeight.toFixed(1).replace('.', ',')} m</span>
            </div>
            <input type="range" id="customHeightSlider" min="0.5" max="50" step="0.25" value="${this.subjectHeight}">
          </div>

          <p id="sunShadowTip" style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-top: 10px;"></p>
        </div>
      </div>
    `;
  }

  private initSimulator(): void {
    const canvas = this.container.querySelector('#sunCanvas') as HTMLCanvasElement;
    if (canvas) {
      this.simulator = new ShadowSimulator(canvas, {
        mode: this.canvasSubMode,
        subjectType: this.subjectType,
        subjectHeight: this.subjectHeight
      });
    }
  }

  private async initMap(): Promise<void> {
    const mapContainer = this.container.querySelector('#sunMapContainer') as HTMLElement;
    if (!mapContainer) return;

    this.mapView = new MapView(mapContainer, {
      onLocationChange: async (newLat, newLng) => {
        let placeName = `Kortpunkt (${newLat.toFixed(3)}°N, ${newLng.toFixed(3)}°Ø)`;
        LocationService.setLocation({
          lat: newLat,
          lng: newLng,
          name: placeName,
          source: 'search'
        });

        try {
          const rev = await LocationService.reverseGeocode(newLat, newLng);
          if (rev?.name) {
            LocationService.setLocation({
              lat: newLat,
              lng: newLng,
              name: rev.name,
              sub: rev.sub,
              source: 'search'
            });
          }
        } catch {
          // Behold koordinatnavn ved offline
        }
      }
    });

    await this.mapView.init(this.currentLocation.lat, this.currentLocation.lng);
  }

  private attachEventListeners(): void {
    const dualViewport = this.container.querySelector('#sunDualViewport') as HTMLElement;
    const camPresets = this.container.querySelector('#cameraPresetsWrap') as HTMLElement;
    const canvasTag = this.container.querySelector('#sunCanvasTag');

    // Skift mellem Split, Kun Kort, Kun 3D og Solur
    this.container.querySelectorAll('[data-layout]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const layout = (btn as HTMLElement).dataset.layout as 'split' | '3d' | 'compass' | 'map';
        this.viewLayout = layout;

        this.container.querySelectorAll('[data-layout]').forEach((b) => {
          b.classList.toggle('active', (b as HTMLElement).dataset.layout === layout);
        });

        dualViewport.className = `desktop-dual-viewport layout-${layout}`;

        if (layout === 'compass') {
          this.canvasSubMode = 'compass';
          this.simulator?.setMode('compass');
          if (canvasTag) canvasTag.textContent = '🧭 2D Top-down Solur & Kompas';
          if (camPresets) camPresets.style.display = 'none';
        } else {
          this.canvasSubMode = '3d';
          this.simulator?.setMode('3d');
          if (canvasTag) canvasTag.textContent = '🎥 3D Søger (træk for at rotere)';
          if (camPresets) camPresets.style.display = layout === 'map' ? 'none' : 'flex';
        }

        setTimeout(() => {
          this.mapView?.invalidateSize();
          this.simulator?.render();
        }, 60);
      });
    });

    // 3D Kameragenveje
    this.container.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = (btn as HTMLElement).dataset.cam as any;
        this.simulator?.resetCamera(preset);
      });
    });

    // Hurtige dato-presets
    this.container.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.pausePlayback();
        const preset = (btn as HTMLElement).dataset.preset;
        const now = new Date();
        let target = new Date(this.currentDate);
        switch (preset) {
          case 'today':
            target = new Date();
            break;
          case 'tomorrow':
            target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week':
            target = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 7);
            break;
          case 'summer-solstice':
            target = TimeService.getNextSolsticeOrEquinox('summer-solstice', now);
            break;
          case 'winter-solstice':
            target = TimeService.getNextSolsticeOrEquinox('winter-solstice', now);
            break;
        }
        target.setHours(this.currentDate.getHours(), this.currentDate.getMinutes(), 0, 0);
        this.broadcastDateChange(target);
      });
    });

    // Tidsslider
    const timeSlider = this.container.querySelector('#sunTimeSlider') as HTMLInputElement;
    timeSlider?.addEventListener('input', () => {
      this.pausePlayback();
      const minutes = Number(timeSlider.value);
      const next = new Date(this.currentDate);
      next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      this.broadcastDateChange(next);
    });

    // Play / Pause
    this.container.querySelector('#btnPlayPause')?.addEventListener('click', () => {
      if (this.isPlaying) this.pausePlayback();
      else this.startPlayback();
    });

    const btnSpeed = this.container.querySelector('#btnSpeedToggle');
    btnSpeed?.addEventListener('click', () => {
      this.playSpeed = this.playSpeed === 1 ? 2 : this.playSpeed === 2 ? 4 : 1;
      if (btnSpeed) btnSpeed.textContent = `${this.playSpeed}x`;
      if (this.isPlaying) {
        this.pausePlayback();
        this.startPlayback();
      }
    });

    this.container.querySelector('#btnJumpNow')?.addEventListener('click', () => {
      this.pausePlayback();
      TimeService.setTimeToNow();
    });

    // Motivvælger
    const customHeightWrap = this.container.querySelector('#customHeightWrap') as HTMLElement;
    const customHeightSlider = this.container.querySelector('#customHeightSlider') as HTMLInputElement;
    const customHeightDisplay = this.container.querySelector('#customHeightDisplay');

    this.container.querySelectorAll('[data-subject]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn as HTMLElement;
        const type = target.dataset.subject as any;
        this.subjectType = type;

        if (type !== 'custom') {
          this.subjectHeight = Number(target.dataset.height);
          if (customHeightSlider) customHeightSlider.value = String(this.subjectHeight);
        }
        if (customHeightWrap) customHeightWrap.style.display = type === 'custom' ? 'flex' : 'none';

        this.container.querySelectorAll('[data-subject]').forEach((b) => b.classList.remove('active'));
        target.classList.add('active');

        const badge = this.container.querySelector('#subjectHeightBadge');
        if (badge) badge.textContent = `${this.subjectHeight.toFixed(2).replace('.', ',')} m`;
        if (customHeightDisplay) customHeightDisplay.textContent = `${this.subjectHeight.toFixed(1).replace('.', ',')} m`;

        this.simulator?.setSubjectType(type, this.subjectHeight);
        this.updateCalculations();
      });
    });

    customHeightSlider?.addEventListener('input', () => {
      const val = Number(customHeightSlider.value);
      this.subjectHeight = val;
      const badge = this.container.querySelector('#subjectHeightBadge');
      if (badge) badge.textContent = `${val.toFixed(2).replace('.', ',')} m`;
      if (customHeightDisplay) customHeightDisplay.textContent = `${val.toFixed(2).replace('.', ',')} m`;
      this.simulator?.setSubjectType(this.subjectType, val);
      this.updateCalculations();
    });
  }

  private broadcastDateChange(newDate: Date): void {
    this.currentDate = newDate;
    this.isInternalTimeChange = true;
    TimeService.setDate(newDate);
    this.isInternalTimeChange = false;
    this.updateCalculations();
  }

  private startPlayback(): void {
    this.isPlaying = true;
    const btnPlay = this.container.querySelector('#btnPlayPause');
    if (btnPlay) {
      btnPlay.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    }

    const intervalMs = Math.max(25, Math.floor(100 / this.playSpeed));
    this.playIntervalId = setInterval(() => {
      const next = new Date(this.currentDate.getTime() + 2 * 60 * 1000);
      const mins = next.getHours() * 60 + next.getMinutes();
      const slider = this.container.querySelector('#sunTimeSlider') as HTMLInputElement;
      if (slider) slider.value = String(mins);
      this.broadcastDateChange(next);
    }, intervalMs);
  }

  private pausePlayback(): void {
    this.isPlaying = false;
    if (this.playIntervalId) {
      clearInterval(this.playIntervalId);
      this.playIntervalId = null;
    }
    const btnPlay = this.container.querySelector('#btnPlayPause');
    if (btnPlay) {
      btnPlay.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    }
  }

  private updateCalculations(): void {
    const lat = this.currentLocation.lat;
    const lng = this.currentLocation.lng;

    const sunPos = AstroCore.getSunPosition(this.currentDate, lat, lng);
    const sunTimes = AstroCore.getSunTimes(this.currentDate, lat, lng);
    const shadowCalc: ShadowCalculation = AstroCore.calculateShadow(sunPos.altitude, sunPos.azimuth, this.subjectHeight);
    const kelvin = AstroCore.getEstimatedKelvin(sunPos.altitude);

    const timeEl = this.container.querySelector('#sunTimeDisplay');
    const dateEl = this.container.querySelector('#sunDateDisplay');
    const altEl = this.container.querySelector('#sunAltitudeVal');
    const azEl = this.container.querySelector('#sunAzimuthVal');
    const shadowEl = this.container.querySelector('#sunShadowLengthVal');
    const kelvinEl = this.container.querySelector('#sunKelvinDisplay');
    const phaseBadge = this.container.querySelector('#sunLightPhaseBadge');
    const tipEl = this.container.querySelector('#sunShadowTip');

    if (timeEl) timeEl.textContent = TimeService.formatTime(this.currentDate);
    if (dateEl) {
      const rel = TimeService.formatRelativeDay(this.currentDate);
      dateEl.textContent = `${TimeService.formatShortDate(this.currentDate)} (${rel})`;
    }
    if (altEl) altEl.textContent = `${sunPos.altitude >= 0 ? '+' : ''}${sunPos.altitude.toFixed(1)}°`;
    if (azEl) azEl.textContent = `${sunPos.azimuth.toFixed(0)}° ${AstroCore.getCompassDirection(sunPos.azimuth)}`;
    if (shadowEl) {
      shadowEl.textContent = shadowCalc.hasDirectShadow
        ? `${shadowCalc.shadowLength.toFixed(1).replace('.', ',')} m`
        : 'Ingen (Diffust)';
    }
    if (kelvinEl) kelvinEl.textContent = `${kelvin.kelvin}K`;

    if (phaseBadge) {
      phaseBadge.textContent = shadowCalc.lightPhase.badge;
      phaseBadge.setAttribute('style', `background: ${shadowCalc.lightPhase.color}33; color: ${shadowCalc.lightPhase.color};`);
    }
    if (tipEl) {
      tipEl.textContent = `${shadowCalc.description} ${shadowCalc.cameraTip}`;
    }

    // Opdater 3D Canvas
    this.simulator?.update(sunPos.altitude, sunPos.azimuth, this.subjectHeight, {
      subjectType: this.subjectType,
      sunTimes,
      lat,
      lng
    });

    // Opdater Leaflet Kort live samtidigt!
    if (this.mapView) {
      this.mapView.update(lat, lng, sunPos.altitude, sunPos.azimuth, shadowCalc.shadowAzimuth, shadowCalc.shadowLength);
    }

    this.renderQuickJumps(sunTimes);
  }

  private renderQuickJumps(times: SunTimes): void {
    const jumpsWrap = this.container.querySelector('#sunQuickJumps');
    if (!jumpsWrap) return;

    const events = [
      { name: 'Blå time (morgen)', time: times.blueHourMorning?.start },
      { name: 'Solopgang', time: times.sunrise },
      { name: 'Gylden slut', time: times.goldenHourMorning?.end },
      { name: 'Solmiddag', time: times.solarNoon },
      { name: 'Gylden start', time: times.goldenHourEvening?.start },
      { name: 'Solnedgang', time: times.sunset },
      { name: 'Blå time (aften)', time: times.blueHourEvening?.end }
    ].filter((e) => e.time !== null && e.time !== undefined);

    jumpsWrap.innerHTML = events
      .map(
        (ev) => `
      <button class="sun-jump-btn" data-time="${(ev.time as Date).getTime()}">
        <span class="jump-time">${TimeService.formatTime(ev.time)}</span>
        <span class="jump-name">${ev.name}</span>
      </button>
    `
      )
      .join('');

    jumpsWrap.querySelectorAll('[data-time]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.pausePlayback();
        const t = Number((btn as HTMLElement).dataset.time);
        const next = new Date(t);
        const mins = next.getHours() * 60 + next.getMinutes();
        const slider = this.container.querySelector('#sunTimeSlider') as HTMLInputElement;
        if (slider) slider.value = String(mins);
        this.broadcastDateChange(next);
      });
    });
  }
}
