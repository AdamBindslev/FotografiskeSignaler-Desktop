/**
 * DesktopShell.ts - Widescreen Multi-Panel Workspace Shell for Fotografiske Signaler Desktop Edition
 * Indeholder:
 *  - Global Master Topbar (Brand, Lokations-søger + Gemte Spots, Master Dato & Tid Scrubber,
 *    Workspace Mode Switcher: Komplet Dashboard / Planlægning / Kamera & Optik, samt Astro Rød Nattilstand)
 *  - Bento Multi-Panel Grid hvor alle 4 moduler (Sol & Kort, Vejr, DOF, Eksponering) er aktive og synkroniserede samtidigt
 *  - Maksimer/Gendan knap på hvert panel + tastaturgenveje (1, 2, 3, Esc)
 */

import { WorkspaceState, WorkspaceMode, PanelId } from './WorkspaceState.ts';
import { LocationService, GeoLocation, PhotoSpot } from '../shared/services/LocationService.ts';
import { TimeService } from '../shared/services/TimeService.ts';
import { StorageService } from '../shared/services/StorageService.ts';
import { AstroCore } from '../shared/astronomy/AstroCore.ts';

import SunModule from '../modules/sun/index.ts';
import WeatherModule from '../modules/weather/index.ts';
import DofModule from '../modules/dof/index.ts';
import ExposureModule from '../modules/exposure/index.ts';

export class DesktopShell {
  private static rootEl: HTMLElement;
  private static isLocPopoverOpen = false;
  private static isSavingSpot = false;
  private static searchDebounce: any = null;
  private static isPlayingMasterTime = false;
  private static playInterval: any = null;

  private static sunInstance: SunModule;
  private static weatherInstance: WeatherModule;
  private static dofInstance: DofModule;
  private static exposureInstance: ExposureModule;

  public static async init(root: HTMLElement): Promise<void> {
    this.rootEl = root;
    WorkspaceState.init();

    this.renderShell();
    this.initNightMode();
    this.attachTopbarListeners();
    this.attachKeyboardShortcuts();

    await this.mountAllPanels();

    // Lyt på globale ændringer
    LocationService.subscribe(() => {
      this.updateMasterTopbarDisplay();
      if (this.isLocPopoverOpen) {
        this.renderLocationPopoverContent();
      }
    });

    TimeService.subscribe(() => {
      this.updateMasterTopbarDisplay();
    });

    WorkspaceState.subscribeMode((mode, maxPanel) => {
      this.applyWorkspaceGridLayout(mode, maxPanel);
    });

    this.updateMasterTopbarDisplay();
    this.applyWorkspaceGridLayout(WorkspaceState.getMode(), WorkspaceState.getMaximizedPanel());
  }

  private static escapeHtml(str: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static renderShell(): void {
    const now = TimeService.getDate();
    const minsOfDay = now.getHours() * 60 + now.getMinutes();

    this.rootEl.innerHTML = `
      <div class="desktop-app-shell">
        <!-- ==================== GLOBAL MASTER TOPBAR ==================== -->
        <header class="desktop-topbar">
          <!-- 1. Brand -->
          <div class="topbar-brand" id="btnDesktopBrand" title="Nulstil til Komplet Dashboard">
            <img src="fotografiske-signaler-wordmark.png" alt="Fotografiske Signaler" class="topbar-logo" onerror="this.style.display='none'">
            <div class="topbar-brand-badge">
              <span class="studio-dot"></span>
              <span>DESKTOP STUDIO</span>
            </div>
          </div>

          <!-- 2. Global Lokationsvælger med Popover -->
          <div class="topbar-location-wrap">
            <button class="topbar-loc-trigger" id="btnTopbarLocTrigger" title="Skift global lokation, søg adresse eller vælg gemt fotospot">
              <span class="loc-pin-icon">📍</span>
              <div class="loc-trigger-text">
                <span class="loc-trigger-name" id="topbarLocName">København</span>
                <span class="loc-trigger-coords" id="topbarLocCoords">55.6761°N, 12.5683°Ø</span>
              </div>
              <span class="loc-trigger-chevron">▾</span>
            </button>
            <button class="fs-btn-icon topbar-gps-btn" id="btnTopbarGps" title="Hent aktuel GPS-position" aria-label="GPS">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="8"></circle>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
              </svg>
            </button>

            <!-- Lokations-Popover -->
            <div class="topbar-loc-popover hidden" id="topbarLocPopover"></div>
          </div>

          <!-- 3. Global Master Dato & Klokkeslæt Styring -->
          <div class="topbar-master-time">
            <div class="master-date-group">
              <button class="master-step-btn" id="btnMasterPrevDay" title="Forrige dag (-1 dag)">‹</button>
              <div class="master-date-picker-wrap" title="Vælg dato for planlægning">
                <input type="date" id="masterDatePicker" class="master-date-input" value="${TimeService.formatIsoDate(now)}">
                <span class="master-date-label" id="masterDateLabel">${TimeService.formatShortDate(now)}</span>
              </div>
              <button class="master-step-btn" id="btnMasterNextDay" title="Næste dag (+1 dag)">›</button>
            </div>

            <div class="master-clock-scrubber">
              <button class="master-play-btn" id="btnMasterPlay" title="Afspil døgnets sol- og lysbevægelse">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </button>
              <div class="master-slider-col">
                <div class="master-clock-row">
                  <span class="master-time-val tabular-nums" id="masterTimeDisplay">${TimeService.formatTime(now)}</span>
                  <span class="master-phase-pill" id="masterPhaseBadge">Dagslys</span>
                  <span class="master-sun-mini tabular-nums" id="masterSunMini">☀️ +0.0°</span>
                </div>
                <input type="range" id="masterTimeSlider" class="master-time-range" min="0" max="1439" step="1" value="${minsOfDay}" title="Træk for at ændre klokkeslæt på tværs af alle moduler">
              </div>
              <button class="master-now-btn" id="btnMasterNow" title="Spring til aktuel dato og klokkeslæt (Nu)">Nu</button>
            </div>
          </div>

          <!-- 4. Workspace Mode Switcher + Nattilstand -->
          <div class="topbar-right-actions">
            <div class="workspace-switcher" role="tablist" aria-label="Vælg arbejdsområde">
              <button class="ws-mode-btn active" data-ws-mode="dashboard" title="Komplet Dashboard: Alle 4 moduler synlige samtidigt (Tast 1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
                <span>Dashboard</span>
              </button>
              <button class="ws-mode-btn" data-ws-mode="planning" title="Planlægning: Stort Sol & Satellitkort + Vejranalyse side om side (Tast 2)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                  <line x1="9" y1="3" x2="9" y2="18"></line>
                  <line x1="15" y1="6" x2="15" y2="21"></line>
                </svg>
                <span>Planlægning</span>
              </button>
              <button class="ws-mode-btn" data-ws-mode="optics" title="Kamera & Optik: Stort DOF + Eksponering + 3D-Søger (Tast 3)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="9"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Kamera & Optik</span>
              </button>
            </div>

            <button class="fs-btn-icon topbar-night-btn" id="btnDesktopNightMode" title="Astro Rød Nattilstand (skåner nattesynet)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </svg>
            </button>
          </div>
        </header>

        <!-- ==================== MULTI-PANEL WORKSPACE GRID ==================== -->
        <main class="desktop-workspace-grid mode-dashboard" id="desktopWorkspaceGrid">
          <!-- PANEL 1: SOL, SATELLITKORT & 3D SØGER -->
          <section class="workspace-panel panel-sun" id="panel-sun" data-panel="sun">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-sun"></span>
                <span>SOL, SKYGGE & KORT</span>
                <span class="panel-chrome-sub">Dual-View: Interaktivt Kort + 3D EVF Søger</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="sun" title="Maksimer / Gendan Sol-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-sun"></div>
          </section>

          <!-- PANEL 2: VEJR & FOTOVINDUER -->
          <section class="workspace-panel panel-weather" id="panel-weather" data-panel="weather">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-weather"></span>
                <span>VEJRANALYSE & FOTOVINDUER</span>
                <span class="panel-chrome-sub">7-døgns prognose, Tåge, Gylden time & Astro</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="weather" title="Maksimer / Gendan Vejr-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-weather"></div>
          </section>

          <!-- PANEL 3: DOF & OPTISK SIMULATOR -->
          <section class="workspace-panel panel-dof" id="panel-dof" data-panel="dof">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-dof"></span>
                <span>DYBDESKARPHED (DOF) & EVF</span>
                <span class="panel-chrome-sub">Hyperfokal, CoC, Diffraktion & Søger-simulator</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="dof" title="Maksimer / Gendan DOF-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-dof"></div>
          </section>

          <!-- PANEL 4: EKSPONERING, ND-FILTER & BULB -->
          <section class="workspace-panel panel-exposure" id="panel-exposure" data-panel="exposure">
            <div class="panel-chrome-bar">
              <div class="panel-chrome-title">
                <span class="panel-dot dot-exposure"></span>
                <span>EKSPONERING, ND & BULB</span>
                <span class="panel-chrome-sub">Eksponeringstrekant, Auto-EV, ND-Stacking & Timer</span>
              </div>
              <div class="panel-chrome-actions">
                <button class="panel-max-btn" data-maximize="exposure" title="Maksimer / Gendan Eksponerings-panel">
                  <span class="max-icon">⤢</span>
                  <span class="max-label">Maksimer</span>
                </button>
              </div>
            </div>
            <div class="panel-body-scroll" id="mount-exposure"></div>
          </section>
        </main>
      </div>
    `;
  }

  private static async mountAllPanels(): Promise<void> {
    const sunEl = this.rootEl.querySelector('#mount-sun') as HTMLElement;
    const weatherEl = this.rootEl.querySelector('#mount-weather') as HTMLElement;
    const dofEl = this.rootEl.querySelector('#mount-dof') as HTMLElement;
    const expEl = this.rootEl.querySelector('#mount-exposure') as HTMLElement;

    this.sunInstance = new SunModule();
    this.weatherInstance = new WeatherModule();
    this.dofInstance = new DofModule();
    this.exposureInstance = new ExposureModule();

    await Promise.all([
      this.sunInstance.mount(sunEl),
      this.weatherInstance.mount(weatherEl),
      this.dofInstance.mount(dofEl),
      this.exposureInstance.mount(expEl)
    ]);
  }

  private static attachTopbarListeners(): void {
    // Klik på logo -> tilbage til komplet dashboard
    this.rootEl.querySelector('#btnDesktopBrand')?.addEventListener('click', () => {
      WorkspaceState.setMode('dashboard');
    });

    // Lokations-popover toggle
    const locTrigger = this.rootEl.querySelector('#btnTopbarLocTrigger');
    const popover = this.rootEl.querySelector('#topbarLocPopover') as HTMLElement;

    locTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isLocPopoverOpen = !this.isLocPopoverOpen;
      popover.classList.toggle('hidden', !this.isLocPopoverOpen);
      if (this.isLocPopoverOpen) {
        this.renderLocationPopoverContent();
        setTimeout(() => {
          (popover.querySelector('#desktopLocSearchInput') as HTMLInputElement)?.focus();
        }, 40);
      }
    });

    // Luk popover ved klik udenfor
    document.addEventListener('click', (e) => {
      if (this.isLocPopoverOpen && popover && !popover.contains(e.target as Node) && !locTrigger?.contains(e.target as Node)) {
        this.isLocPopoverOpen = false;
        popover.classList.add('hidden');
      }
    });

    // GPS-knap i topbar
    this.rootEl.querySelector('#btnTopbarGps')?.addEventListener('click', async () => {
      const btn = this.rootEl.querySelector('#btnTopbarGps') as HTMLElement;
      btn.style.opacity = '0.5';
      try {
        await LocationService.requestGpsLocation();
      } catch (err) {
        alert((err as Error).message);
      } finally {
        btn.style.opacity = '1';
      }
    });

    // Master Dato-styring
    this.rootEl.querySelector('#btnMasterPrevDay')?.addEventListener('click', () => {
      this.pauseMasterPlayback();
      const d = TimeService.getDate();
      d.setDate(d.getDate() - 1);
      TimeService.setDate(d);
    });

    this.rootEl.querySelector('#btnMasterNextDay')?.addEventListener('click', () => {
      this.pauseMasterPlayback();
      const d = TimeService.getDate();
      d.setDate(d.getDate() + 1);
      TimeService.setDate(d);
    });

    const dateInput = this.rootEl.querySelector('#masterDatePicker') as HTMLInputElement;
    dateInput?.addEventListener('change', () => {
      this.pauseMasterPlayback();
      const parsed = TimeService.parseIsoDate(dateInput.value);
      if (parsed) {
        const cur = TimeService.getDate();
        parsed.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
        TimeService.setDate(parsed);
      }
    });

    // Master Klokkeslæt-slider
    const timeSlider = this.rootEl.querySelector('#masterTimeSlider') as HTMLInputElement;
    timeSlider?.addEventListener('input', () => {
      this.pauseMasterPlayback();
      const mins = Number(timeSlider.value);
      const d = TimeService.getDate();
      d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      TimeService.setDate(d);
    });

    // Master Afspil/Pause knap
    this.rootEl.querySelector('#btnMasterPlay')?.addEventListener('click', () => {
      if (this.isPlayingMasterTime) {
        this.pauseMasterPlayback();
      } else {
        this.startMasterPlayback();
      }
    });

    // Master "Nu" knap
    this.rootEl.querySelector('#btnMasterNow')?.addEventListener('click', () => {
      this.pauseMasterPlayback();
      TimeService.setTimeToNow();
    });

    // Workspace Mode knapper
    this.rootEl.querySelectorAll('[data-ws-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.wsMode as WorkspaceMode;
        WorkspaceState.setMode(mode);
      });
    });

    // Panel Maksimer-knapper
    this.rootEl.querySelectorAll('[data-maximize]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panelId = (btn as HTMLElement).dataset.maximize as PanelId;
        WorkspaceState.toggleMaximizePanel(panelId);
      });
    });

    // Astro Rød Nattilstand
    this.rootEl.querySelector('#btnDesktopNightMode')?.addEventListener('click', () => {
      this.toggleNightMode();
    });
  }

  private static attachKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === '1') {
        WorkspaceState.setMode('dashboard');
      } else if (e.key === '2') {
        WorkspaceState.setMode('planning');
      } else if (e.key === '3') {
        WorkspaceState.setMode('optics');
      } else if (e.key === 'Escape' && WorkspaceState.getMaximizedPanel() !== null) {
        WorkspaceState.toggleMaximizePanel(WorkspaceState.getMaximizedPanel()!);
      }
    });
  }

  private static startMasterPlayback(): void {
    this.isPlayingMasterTime = true;
    const btn = this.rootEl.querySelector('#btnMasterPlay');
    if (btn) {
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      btn.classList.add('active');
    }
    this.playInterval = setInterval(() => {
      const next = new Date(TimeService.getDate().getTime() + 3 * 60 * 1000);
      TimeService.setDate(next);
    }, 60);
  }

  private static pauseMasterPlayback(): void {
    if (!this.isPlayingMasterTime) return;
    this.isPlayingMasterTime = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    const btn = this.rootEl.querySelector('#btnMasterPlay');
    if (btn) {
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      btn.classList.remove('active');
    }
  }

  private static updateMasterTopbarDisplay(): void {
    const loc: GeoLocation = LocationService.getLocation();
    const date: Date = TimeService.getDate();

    const locNameEl = this.rootEl.querySelector('#topbarLocName');
    const locCoordsEl = this.rootEl.querySelector('#topbarLocCoords');
    if (locNameEl) locNameEl.textContent = loc.name;
    if (locCoordsEl) locCoordsEl.textContent = `${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°Ø`;

    const dateInput = this.rootEl.querySelector('#masterDatePicker') as HTMLInputElement;
    const dateLabel = this.rootEl.querySelector('#masterDateLabel');
    const iso = TimeService.formatIsoDate(date);
    if (dateInput && dateInput.value !== iso) dateInput.value = iso;
    if (dateLabel) {
      const rel = TimeService.formatRelativeDay(date);
      dateLabel.textContent = `${TimeService.formatShortDate(date)} (${rel})`;
    }

    const timeDisplay = this.rootEl.querySelector('#masterTimeDisplay');
    const timeSlider = this.rootEl.querySelector('#masterTimeSlider') as HTMLInputElement;
    if (timeDisplay) timeDisplay.textContent = TimeService.formatTime(date);
    const mins = date.getHours() * 60 + date.getMinutes();
    if (timeSlider && Number(timeSlider.value) !== mins) {
      timeSlider.value = String(mins);
    }

    const sunPos = AstroCore.getSunPosition(date, loc.lat, loc.lng);
    const phase = AstroCore.getLightPhase(sunPos.altitude);
    const phaseEl = this.rootEl.querySelector('#masterPhaseBadge') as HTMLElement;
    const sunMiniEl = this.rootEl.querySelector('#masterSunMini');

    if (phaseEl) {
      phaseEl.textContent = phase.badge;
      phaseEl.style.color = phase.color;
      phaseEl.style.borderColor = `${phase.color}55`;
    }
    if (sunMiniEl) {
      const dir = AstroCore.getCompassDirection(sunPos.azimuth);
      sunMiniEl.textContent = `☀️ ${sunPos.altitude >= 0 ? '+' : ''}${sunPos.altitude.toFixed(1)}° (${sunPos.azimuth.toFixed(0)}° ${dir})`;
    }
  }

  private static applyWorkspaceGridLayout(mode: WorkspaceMode, maximizedPanel: PanelId | null): void {
    const grid = this.rootEl.querySelector('#desktopWorkspaceGrid') as HTMLElement;
    if (!grid) return;

    grid.classList.remove('mode-dashboard', 'mode-planning', 'mode-optics', 'has-maximized');
    grid.classList.add(`mode-${mode}`);

    if (maximizedPanel) {
      grid.classList.add('has-maximized');
    }

    // Opdater knapper i topbar
    this.rootEl.querySelectorAll('[data-ws-mode]').forEach((btn) => {
      const m = (btn as HTMLElement).dataset.wsMode;
      btn.classList.toggle('active', m === mode && !maximizedPanel);
    });

    // Opdater paneler
    this.rootEl.querySelectorAll('.workspace-panel').forEach((panel) => {
      const pid = (panel as HTMLElement).dataset.panel as PanelId;
      const isMax = maximizedPanel === pid;
      panel.classList.toggle('is-maximized', isMax);

      const maxBtn = panel.querySelector('[data-maximize]') as HTMLElement;
      if (maxBtn) {
        const label = maxBtn.querySelector('.max-label');
        const icon = maxBtn.querySelector('.max-icon');
        if (label) label.textContent = isMax ? 'Gendan grid' : 'Maksimer';
        if (icon) icon.textContent = isMax ? '⤡' : '⤢';
        maxBtn.classList.toggle('active', isMax);
      }
    });
  }

  private static renderLocationPopoverContent(): void {
    const popover = this.rootEl.querySelector('#topbarLocPopover') as HTMLElement;
    if (!popover) return;

    const loc = LocationService.getLocation();
    const spots: PhotoSpot[] = LocationService.getSavedSpots();
    const safeName = this.escapeHtml(loc.name);

    popover.innerHTML = `
      <div class="loc-popover-inner">
        <div class="loc-popover-header">
          <strong>📍 Global Lokation & Fotospots</strong>
          <button class="loc-popover-close" id="btnCloseLocPopover">✕</button>
        </div>

        <div class="loc-popover-search">
          <input type="text" id="desktopLocSearchInput" placeholder="Søg adresse, by, sted eller koordinat (f.eks. Møns Klint, 55.67, 12.56)..." autocomplete="off">
          <div id="desktopLocSearchResults" class="loc-popover-results"></div>
        </div>

        <div class="loc-popover-save-row">
          ${
            this.isSavingSpot
              ? `
              <div style="display:flex;gap:6px;width:100%;">
                <input type="text" id="desktopSpotNameInput" value="${safeName}" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid var(--accent-sun);background:var(--bg-surface);color:var(--text-main);font-size:12px;">
                <button class="fs-btn fs-btn-accent-sun" id="btnConfirmSaveDesktopSpot" style="padding:4px 12px;min-height:30px;font-size:12px;">Gem</button>
                <button class="fs-btn" id="btnCancelSaveDesktopSpot" style="padding:4px 10px;min-height:30px;font-size:12px;">Annuller</button>
              </div>
              `
              : `
              <button class="fs-btn" id="btnTriggerSaveDesktopSpot" style="width:100%;min-height:32px;font-size:12px;border:1px dashed var(--accent-sun);color:var(--accent-sun);">
                ⭐ Gem "${safeName}" i dine fotospots
              </button>
              `
          }
        </div>

        <div class="loc-popover-spots">
          <div class="loc-spots-heading">Gemte Fotospots (${spots.length})</div>
          <div class="loc-spots-list">
            ${
              spots.length === 0
                ? `<div style="font-size:12px;color:var(--text-dim);padding:8px 0;">Ingen gemte spots endnu. Gem dine favorit-lokationer for hurtigt skift.</div>`
                : spots
                    .map(
                      (s) => `
                  <div class="loc-spot-item">
                    <div class="loc-spot-main" data-pick-spot="${this.escapeHtml(s.id)}">
                      <strong>📍 ${this.escapeHtml(s.name)}</strong>
                      <span>${s.lat.toFixed(4)}°N, ${s.lng.toFixed(4)}°Ø</span>
                    </div>
                    <button class="loc-spot-del" data-del-spot="${this.escapeHtml(s.id)}" title="Slet spot">🗑️</button>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        </div>
      </div>
    `;

    popover.querySelector('#btnCloseLocPopover')?.addEventListener('click', () => {
      this.isLocPopoverOpen = false;
      popover.classList.add('hidden');
    });

    const searchInput = popover.querySelector('#desktopLocSearchInput') as HTMLInputElement;
    const resultsWrap = popover.querySelector('#desktopLocSearchResults') as HTMLElement;

    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (this.searchDebounce) clearTimeout(this.searchDebounce);
      if (q.length < 2) {
        resultsWrap.innerHTML = '';
        return;
      }
      this.searchDebounce = setTimeout(async () => {
        resultsWrap.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:6px;">Søger...</div>`;
        const matches = await LocationService.search(q);
        if (matches.length === 0) {
          resultsWrap.innerHTML = `<div style="font-size:12px;color:var(--text-dim);padding:6px;">Ingen steder fundet</div>`;
          return;
        }
        resultsWrap.innerHTML = matches
          .map(
            (m, idx) => `
          <div class="loc-search-hit" data-hit="${idx}">
            <strong>📍 ${this.escapeHtml(m.name)}</strong>
            <span>${this.escapeHtml(m.sub)} • ${m.lat.toFixed(4)}°N, ${m.lng.toFixed(4)}°Ø</span>
          </div>
        `
          )
          .join('');

        resultsWrap.querySelectorAll('[data-hit]').forEach((el) => {
          el.addEventListener('click', () => {
            const chosen = matches[Number((el as HTMLElement).dataset.hit)];
            if (chosen) {
              this.isLocPopoverOpen = false;
              popover.classList.add('hidden');
              LocationService.setLocation({
                lat: chosen.lat,
                lng: chosen.lng,
                name: chosen.name,
                sub: chosen.sub,
                source: 'search'
              });
            }
          });
        });
      }, 220);
    });

    popover.querySelector('#btnTriggerSaveDesktopSpot')?.addEventListener('click', () => {
      this.isSavingSpot = true;
      this.renderLocationPopoverContent();
    });

    popover.querySelector('#btnCancelSaveDesktopSpot')?.addEventListener('click', () => {
      this.isSavingSpot = false;
      this.renderLocationPopoverContent();
    });

    popover.querySelector('#btnConfirmSaveDesktopSpot')?.addEventListener('click', () => {
      const inp = popover.querySelector('#desktopSpotNameInput') as HTMLInputElement;
      LocationService.saveSpot(inp?.value || loc.name, loc.lat, loc.lng);
      this.isSavingSpot = false;
      this.renderLocationPopoverContent();
    });

    popover.querySelectorAll('[data-pick-spot]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.pickSpot;
        const found = spots.find((s) => s.id === id);
        if (found) {
          this.isLocPopoverOpen = false;
          popover.classList.add('hidden');
          LocationService.setLocation({
            lat: found.lat,
            lng: found.lng,
            name: found.name,
            sub: 'Gemt fotospot',
            source: 'search'
          });
        }
      });
    });

    popover.querySelectorAll('[data-del-spot]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (el as HTMLElement).dataset.delSpot;
        if (id) {
          LocationService.deleteSpot(id);
          this.renderLocationPopoverContent();
        }
      });
    });
  }

  private static initNightMode(): void {
    const settings = StorageService.getSettings();
    const btn = this.rootEl.querySelector('#btnDesktopNightMode');
    if (settings.nightMode) {
      document.body.classList.add('theme-night-red');
      btn?.classList.add('active');
    }
  }

  private static toggleNightMode(): void {
    const isNight = document.body.classList.toggle('theme-night-red');
    const btn = this.rootEl.querySelector('#btnDesktopNightMode');
    btn?.classList.toggle('active', isNight);
    StorageService.saveSettings({ nightMode: isNight });
    window.dispatchEvent(new CustomEvent('fs-theme-change', { detail: { nightMode: isNight } }));
  }
}
