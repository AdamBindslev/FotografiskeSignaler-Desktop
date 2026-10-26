/**
 * DesktopShell.ts - "Studio Canvas & Inspector" Desktop Arkitektur
 * Fotografiske Signaler – Desktop Studio (Fase 1.5 - Omtænkt fra bunden til Desktop)
 *
 * 100% fri for interne scrollbars! Opbygget som et ægte desktop-studieværktøj i 3 zoner:
 *  1. Øverste Studio Topbar: Brand, Global Lokation & Fotospots, Dato/Tid-afspiller, Live Sol/Måne/Vejr-telemetri og Nattilstand.
 *  2. Midterste "Studio Canvas" (Hovedscenen):
 *     - View-Switcher øverst: [⚡ Split-View] | [🗺️ Fuldskærms Kort & FOV] | [☀️ 3D Lys & Skygge] | [📷 Optisk EVF Søger]
 *     - På kortet arbejder Kamera-pin (📷) og Motiv-pin (🎯) sammen og tegner FOV-kegle, DOF-skarphedszone (Dn til Df),
 *       sigtelinje, solopgang/solnedgang, solvektor, månevektor og motivets skygge live på satellitkortet!
 *     - I Split-View og 3D/EVF-visningerne synkroniseres 3D Sol/Skygge-scenen og den optiske EVF-søger (med Bokeh & Focus Peaking)
 *       direkte med både kortets Motiv-pin, tidslinjen i bunden og kameraracket til højre.
 *  3. Højre "Studio Camera & Optics Rack" (Fast højde, 0 scrollbars):
 *     - Samler Sensor, IBIS, Brændvidde, Fokusafstand, Blænde, Lukkertid, ISO, Auto-EV, Live Histogram, DOF-analyse,
 *       ND-filter stacking og Bulb-timer i én samlet fysisk kameramotor uden dublerede knapper.
 *  4. Nederste "Studio Timeline & Weather Dock" (Fuld bredde, 0 scrollbars):
 *     - 7-døgns vejr-vælger + De 4 Fotovindue-badges (Morgentåge, Morgenlys, Aftenlys, Stjerner/Nat) + Hurtigspring
 *     - Interaktiv 24-timers HTML5 Canvas lys-, sol-, måne-, sky- og vejrgraf med 60fps trækbar playhead!
 */

import { StudioState, StudioSnapshot, CanvasViewMode } from './StudioState.ts';
import { StudioMapCanvas } from './StudioMapCanvas.ts';
import { StudioTimelineDock } from './StudioTimelineDock.ts';
import { StudioCameraRack } from './StudioCameraRack.ts';
import { ShadowSimulator } from '../modules/sun/visualization/shadow-sim.ts';
import { DofVisualizer } from '../modules/dof/visualization/dof-visualizer.ts';
import { DofEngine } from '../modules/dof/calculations/dof-engine.ts';
import { ExposureEngine } from '../modules/exposure/calculations/exposure-engine.ts';
import { LocationService, PhotoSpot } from '../shared/services/LocationService.ts';
import { TimeService } from '../shared/services/TimeService.ts';
import { StorageService } from '../shared/services/StorageService.ts';
import { AstroCore } from '../shared/astronomy/AstroCore.ts';

export class DesktopShell {
  private static rootEl: HTMLElement;
  private static mapCanvas: StudioMapCanvas;
  private static timelineDock: StudioTimelineDock;
  private static cameraRack: StudioCameraRack;
  private static shadowSim: ShadowSimulator | null = null;
  private static dofVisualizer: DofVisualizer | null = null;

  private static rightSplitTab: '3d' | 'evf' = '3d';
  private static sunSimMode: '3d' | 'compass' = '3d';

  private static isLocPopoverOpen = false;
  private static isSavingSpot = false;
  private static searchDebounce: any = null;
  private static isPlayingTime = false;
  private static playInterval: any = null;

  public static async init(root: HTMLElement): Promise<void> {
    this.rootEl = root;

    this.renderShellSkeleton();
    this.initNightMode();

    // Opret de 3 hovedkomponenter + 3D/EVF visualiseringsmotorer
    const mapEl = this.rootEl.querySelector('#studioMapMount') as HTMLElement;
    const rackEl = this.rootEl.querySelector('#studioRackMount') as HTMLElement;
    const dockEl = this.rootEl.querySelector('#studioDockMount') as HTMLElement;
    const simCanvas = this.rootEl.querySelector('#studioShadowCanvas') as HTMLCanvasElement;
    const dofSvg = this.rootEl.querySelector('#dofSvgDiagram') as SVGSVGElement;
    const evfContainer = this.rootEl.querySelector('#evfContainer') as HTMLElement;

    this.mapCanvas = new StudioMapCanvas(mapEl);
    this.cameraRack = new StudioCameraRack(rackEl);
    this.timelineDock = new StudioTimelineDock(dockEl);

    if (simCanvas) {
      this.shadowSim = new ShadowSimulator(simCanvas, { mode: '3d', subjectType: 'person', subjectHeight: 1.75 });
    }
    this.dofVisualizer = new DofVisualizer(dofSvg, evfContainer);

    this.attachShellEvents();
    this.attachKeyboardShortcuts();

    // Abonner på den samlede StudioState
    StudioState.subscribe((snap) => {
      this.onStudioStateUpdate(snap);
    });

    await StudioState.init();
    const initialSnap = StudioState.getSnapshot();
    await this.mapCanvas.init(initialSnap);
    this.onStudioStateUpdate(initialSnap);
  }

  private static escapeHtml(str: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static renderShellSkeleton(): void {
    const now = TimeService.getDate();

    this.rootEl.innerHTML = `
      <div class="studio-shell">
        <!-- ==================== 1. GLOBAL STUDIO TOPBAR ==================== -->
        <header class="studio-topbar">
          <!-- Brand -->
          <div class="topbar-brand" id="btnStudioBrand" title="Fotografiske Signaler – Desktop Studio">
            <img src="fotografiske-signaler-wordmark.png" alt="Fotografiske Signaler" class="topbar-logo" onerror="this.style.display='none'">
            <div class="topbar-brand-badge">
              <span class="studio-dot"></span>
              <span>STUDIO</span>
            </div>
          </div>

          <!-- Global Lokation & Gemte Fotospots -->
          <div class="topbar-location-wrap">
            <button class="topbar-loc-trigger" id="btnTopbarLocTrigger" title="Søg adresse, by eller vælg gemt fotospot">
              <span class="loc-pin-icon">📍</span>
              <div class="loc-trigger-text">
                <span class="loc-trigger-name" id="topbarLocName">København</span>
                <span class="loc-trigger-coords tabular-nums" id="topbarLocCoords">55.6761°N, 12.5683°Ø</span>
              </div>
              <span class="loc-trigger-chevron">▾</span>
            </button>
            <button class="fs-btn-icon topbar-gps-btn" id="btnTopbarGps" title="Hent aktuel GPS-position">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="8"></circle>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
              </svg>
            </button>

            <div class="topbar-loc-popover hidden" id="topbarLocPopover"></div>
          </div>

          <!-- Dato, Klokkeslæt & Afspiller -->
          <div class="topbar-time-transport">
            <button class="transport-step-btn" id="btnPrevDay" title="Forrige dag (-1 dag)">‹</button>
            <div class="transport-date-wrap" title="Vælg dato">
              <input type="date" id="topbarDatePicker" class="transport-date-input" value="${TimeService.formatIsoDate(now)}">
              <span class="transport-date-label" id="topbarDateLabel">${TimeService.formatShortDate(now)}</span>
            </div>
            <button class="transport-step-btn" id="btnNextDay" title="Næste dag (+1 dag)">›</button>

            <div class="transport-divider"></div>

            <button class="transport-play-btn" id="btnPlayTime" title="Afspil døgnets lys og skygger (Mellemrumstast)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
            <span class="transport-clock tabular-nums" id="topbarClockVal">${TimeService.formatTime(now)}</span>
            <span class="transport-phase-badge" id="topbarPhaseBadge">Dagslys</span>
            <button class="transport-now-btn" id="btnResetNow" title="Spring til aktuel dato og klokkeslæt (Nu)">Nu</button>
          </div>

          <!-- Live Astronomisk & Vejr Telemetri Bar -->
          <div class="topbar-telemetry-strip">
            <div class="tele-pill" title="Solens aktuelle højde, retning og farvetemperatur">
              <span class="tp-lbl">SOL</span>
              <span class="tp-val tabular-nums" id="teleSunVal">+28.4° (180° S)</span>
              <span class="tp-sub tabular-nums" id="teleKelvinVal">5400K</span>
            </div>
            <div class="tele-pill" title="Motivets aktuelle skyggelængde og retning">
              <span class="tp-lbl">SKYGGE</span>
              <span class="tp-val tabular-nums" id="teleShadowVal">3,2 m (0° N)</span>
            </div>
            <div class="tele-pill" title="Månens fase, belysning og højde">
              <span class="tp-lbl">MÅNE</span>
              <span class="tp-val tabular-nums" id="teleMoonVal">🌙 45%</span>
            </div>
            <div class="tele-pill" title="Vejr på den valgte time (Skydække, Temperatur og Vind)">
              <span class="tp-lbl">VEJR</span>
              <span class="tp-val tabular-nums" id="teleWeatherVal">🌤️ 14°C • Sky 25% • 3 m/s</span>
            </div>
          </div>

          <!-- Astro Rød Nattilstand -->
          <div class="topbar-right-tools">
            <button class="fs-btn-icon topbar-night-btn" id="btnNightMode" title="Astro Rød Nattilstand (skåner nattesynet)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </svg>
            </button>
          </div>
        </header>

        <!-- ==================== 2. MIDTERSTE STUDIO ARBEJDSOMRÅDE ==================== -->
        <div class="studio-main-area">
          <!-- VENSTRE / CENTER: INTERAKTIVT STUDIO CANVAS -->
          <main class="studio-stage-wrap">
            <!-- Canvas View-Switcher Bar (Altid øverst på lærredet) -->
            <div class="stage-toolbar">
              <div class="stage-view-switcher" role="tablist">
                <button class="stage-view-btn active" data-canvas-view="split" title="Split-View: Satellitkort med FOV/DOF til venstre + 3D Lys/EVF til højre (Tast 1)">
                  <span>⚡ Split-View</span>
                </button>
                <button class="stage-view-btn" data-canvas-view="map" title="Fuldskærms Satellit- & Landkort med FOV-kegle, DOF-zone, Sol og Skygge (Tast 2)">
                  <span>🗺️ Kort & FOV</span>
                </button>
                <button class="stage-view-btn" data-canvas-view="3d" title="Fuldskærms 3D Lys-, Sol- & Skyggesimulator (Tast 3)">
                  <span>☀️ 3D Lys & Skygge</span>
                </button>
                <button class="stage-view-btn" data-canvas-view="evf" title="Fuldskærms Optisk EVF Søger & Strålediagram (Tast 4)">
                  <span>📷 Optisk EVF Søger</span>
                </button>
              </div>

              <!-- Hurtig-info om Kamera->Motiv vektor på kortet -->
              <div class="stage-vector-hud">
                <span class="sv-item" title="Træk 📷 Kamera-pin eller 🎯 Motiv-pin på kortet">
                  🎯 Motiv: <strong id="hudTargetDist" class="tabular-nums">12,0 m</strong>
                </span>
                <span class="sv-sep">•</span>
                <span class="sv-item">
                  Sigte: <strong id="hudTargetAz" class="tabular-nums">135° SØ</strong>
                </span>
                <span class="sv-sep">•</span>
                <span class="sv-item">
                  Synsfelt (FOV): <strong id="hudFovDeg" class="tabular-nums">54°</strong>
                </span>
                <span class="sv-sep">•</span>
                <span class="sv-item" style="color:var(--accent-dof);">
                  Skarphedszone: <strong id="hudDofSpan" class="tabular-nums">7,2 m → ∞</strong>
                </span>
              </div>
            </div>

            <!-- Selve Lærredet (Skifter mellem Split, Map, 3D og EVF uden scroll!) -->
            <div class="stage-canvas-grid view-split" id="stageCanvasGrid">
              <!-- LÆRRED A: INTERAKTIVT SATELLITKORT MED FOV & DOF-KEGLE -->
              <div class="stage-pane pane-map" id="stagePaneMap">
                <div class="map-viewport" id="studioMapMount"></div>
                <div class="map-legend-overlay">
                  <span class="ml-chip"><i class="ml-dot" style="background:#f59e0b;"></i>📷 Kamera (Træk)</span>
                  <span class="ml-chip"><i class="ml-dot" style="background:#10b981;"></i>🎯 Motiv & Fokus (Træk / Klik)</span>
                  <span class="ml-chip"><i class="ml-dot" style="background:#38bdf8;"></i>FOV & Skygge</span>
                  <span class="ml-chip"><i class="ml-dot" style="background:#10b981;opacity:0.6;"></i>Grønt felt = Skarp DOF-zone</span>
                </div>
              </div>

              <!-- LÆRRED B: 3D LYS/SKYGGE & OPTISK EVF SØGER -->
              <div class="stage-pane pane-visualizer" id="stagePaneVisualizer">
                <!-- Sub-header når man er i Split-View så man kan skifte højre halvdel mellem 3D og EVF -->
                <div class="vis-pane-toolbar">
                  <div class="vis-mode-tabs" id="visSplitTabs">
                    <button class="vis-tab-btn active" data-vis-tab="3d">☀️ 3D Lys & Kompas</button>
                    <button class="vis-tab-btn" data-vis-tab="evf">📷 Optisk EVF & DOF</button>
                  </div>

                  <!-- Kontroller til 3D-visning (Motiv-type + 3D/Kompas + Kameravinkel) -->
                  <div class="vis-context-actions" id="vis3dControls">
                    <div class="vis-mini-group" title="Vælg motiv-model for skyggeberegning">
                      <button class="vis-mini-btn active" data-subj-model="person">👤 1,75m</button>
                      <button class="vis-mini-btn" data-subj-model="tree">🌳 5m</button>
                      <button class="vis-mini-btn" data-subj-model="building">🏢 12m</button>
                    </div>
                    <div class="vis-mini-group">
                      <button class="vis-mini-btn active" data-sim-mode="3d">3D</button>
                      <button class="vis-mini-btn" data-sim-mode="compass">Kompas</button>
                    </div>
                    <div class="vis-mini-group">
                      <button class="vis-mini-btn" data-cam-preset="default" title="3/4 perspektiv">3/4</button>
                      <button class="vis-mini-btn" data-cam-preset="rim" title="Modlys-vinkel">Modlys</button>
                      <button class="vis-mini-btn" data-cam-preset="top" title="Fugleperspektiv">Top</button>
                    </div>
                  </div>

                  <!-- Kontroller til EVF-visning (Focus Peaking & Gitter) -->
                  <div class="vis-context-actions hidden" id="visEvfControls">
                    <button class="vis-mini-btn" id="btnStudioPeaking" title="Fremhæv skarpt motiv med Focus Peaking">✨ Focus Peaking</button>
                    <button class="vis-mini-btn active" id="btnStudioGrid" title="Vis/skjul 3×3 kompositionsgitter">📏 3×3 Gitter</button>
                  </div>
                </div>

                <!-- 1. 3D Sol, Skygge & Kompas Canvas -->
                <div class="vis-content-box" id="visBox3d">
                  <canvas id="studioShadowCanvas" class="studio-shadow-canvas"></canvas>
                </div>

                <!-- 2. Optisk EVF Søger + Strålediagram -->
                <div class="vis-content-box hidden" id="visBoxEvf">
                  <div class="studio-evf-stack">
                    <!-- Simuleret Optisk EVF Søger -->
                    <div class="evf-viewfinder studio-evf-viewfinder" id="evfContainer">
                      <div class="evf-hud-top">
                        <span class="hud-item"><span class="af-dot"></span> AF-C • MOTIV I FOKUS</span>
                        <span class="hud-item hud-bokeh" id="evfBokehQualityLabel">Bokeh</span>
                        <span class="hud-item tabular-nums" id="evfOsdIso">ISO 100</span>
                      </div>

                      <div class="evf-layer evf-bg-scenery" id="evfLayerBackground">
                        <div class="evf-sky" id="studioEvfSky"></div>
                        <div class="evf-mountains"></div>
                        <div class="evf-distant-trees"></div>
                      </div>

                      <div class="evf-bokeh-overlay" id="evfBokehOverlay"></div>

                      <div class="evf-layer evf-subject-wrap" id="evfLayerSubject">
                        <div class="evf-peaking-glow" id="evfPeakingSubject"></div>
                        <div class="evf-subject-figure">
                          <svg width="64" height="150" viewBox="0 0 64 150" fill="none">
                            <circle cx="32" cy="22" r="14" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
                            <path d="M12 55 C12 40, 52 40, 52 55 L56 100 L42 100 L44 145 L34 145 L32 102 L30 145 L20 145 L22 100 L8 100 Z" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
                          </svg>
                        </div>
                        <div class="evf-af-box">
                          <span class="af-dot"></span>
                        </div>
                      </div>

                      <div class="evf-layer evf-foreground-wrap" id="evfLayerForeground">
                        <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                          <path d="M0,80 Q20,30 40,80 Q70,20 90,80 Q130,40 150,80 Q180,10 210,80 Q260,35 290,80 Q340,25 370,80 Q390,45 400,80 Z" fill="#0f172a" opacity="0.85"/>
                        </svg>
                      </div>

                      <div class="evf-grid-overlay" id="evfGridOverlay">
                        <div class="grid-line grid-v1"></div>
                        <div class="grid-line grid-v2"></div>
                        <div class="grid-line grid-h1"></div>
                        <div class="grid-line grid-h2"></div>
                      </div>

                      <div class="evf-hud-bottom">
                        <span id="evfOsdShutter" class="tabular-nums">1/125s</span>
                        <span id="evfOsdAperture" class="tabular-nums" style="color: var(--golden-primary); font-weight: 700;">f/5.6</span>
                        <span id="evfOsdDist" class="tabular-nums">12,0 m</span>
                        <span id="evfOsdFocal" class="tabular-nums">35mm</span>
                      </div>
                    </div>

                    <!-- Optisk Stråle- & Dybdeskarpheds-diagram -->
                    <div class="studio-dof-diagram-box">
                      <svg class="dof-svg-diagram" id="dofSvgDiagram" viewBox="0 0 1000 165" preserveAspectRatio="none"></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <!-- HØJRE: SAMLET KAMERA, OPTIK, DOF, EKSPONERING & ND INSPECTOR RACK -->
          <div class="studio-rack-mount" id="studioRackMount"></div>
        </div>

        <!-- ==================== 3. NEDERSTE TIMELINE & VEJR DOCK ==================== -->
        <footer class="studio-dock-mount" id="studioDockMount"></footer>
      </div>
    `;
  }

  private static attachShellEvents(): void {
    // Klik på Brand -> nulstil til Split-View
    this.rootEl.querySelector('#btnStudioBrand')?.addEventListener('click', () => {
      StudioState.setCanvasView('split');
    });

    // Lokations-popover
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

    document.addEventListener('click', (e) => {
      if (this.isLocPopoverOpen && popover && !popover.contains(e.target as Node) && !locTrigger?.contains(e.target as Node)) {
        this.isLocPopoverOpen = false;
        popover.classList.add('hidden');
      }
    });

    // GPS-knap
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

    // Dato/Tid transport i topbar
    this.rootEl.querySelector('#btnPrevDay')?.addEventListener('click', () => {
      this.pauseTimePlayback();
      const d = TimeService.getDate();
      d.setDate(d.getDate() - 1);
      TimeService.setDate(d);
    });

    this.rootEl.querySelector('#btnNextDay')?.addEventListener('click', () => {
      this.pauseTimePlayback();
      const d = TimeService.getDate();
      d.setDate(d.getDate() + 1);
      TimeService.setDate(d);
    });

    const dateInput = this.rootEl.querySelector('#topbarDatePicker') as HTMLInputElement;
    dateInput?.addEventListener('change', () => {
      this.pauseTimePlayback();
      const parsed = TimeService.parseIsoDate(dateInput.value);
      if (parsed) {
        const cur = TimeService.getDate();
        parsed.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
        TimeService.setDate(parsed);
      }
    });

    this.rootEl.querySelector('#btnPlayTime')?.addEventListener('click', () => {
      if (this.isPlayingTime) this.pauseTimePlayback();
      else this.startTimePlayback();
    });

    this.rootEl.querySelector('#btnResetNow')?.addEventListener('click', () => {
      this.pauseTimePlayback();
      TimeService.setTimeToNow();
    });

    // Canvas View-Switcher (Split | Map | 3D | EVF)
    this.rootEl.querySelectorAll('[data-canvas-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.canvasView as CanvasViewMode;
        StudioState.setCanvasView(mode);
      });
    });

    // Højre Split-pane faner (3D vs EVF når man er i Split-View)
    this.rootEl.querySelectorAll('[data-vis-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.rightSplitTab = (btn as HTMLElement).dataset.visTab as '3d' | 'evf';
        this.syncVisualizerSubPane(StudioState.getSnapshot());
      });
    });

    // 3D Motiv-model knapper (Person / Træ / Bygning)
    this.rootEl.querySelectorAll('[data-subj-model]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const model = (btn as HTMLElement).dataset.subjModel as 'person' | 'tree' | 'building';
        StudioState.setSubjectModel(model);
      });
    });

    // 3D vs Kompas knap i 3D-visningen
    this.rootEl.querySelectorAll('[data-sim-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.sunSimMode = (btn as HTMLElement).dataset.simMode as '3d' | 'compass';
        this.rootEl.querySelectorAll('[data-sim-mode]').forEach((b) => {
          b.classList.toggle('active', (b as HTMLElement).dataset.simMode === this.sunSimMode);
        });
        this.shadowSim?.setMode(this.sunSimMode);
      });
    });

    // Kameravinkel-presets i 3D-visningen
    this.rootEl.querySelectorAll('[data-cam-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = (btn as HTMLElement).dataset.camPreset as 'default' | 'rim' | 'top';
        this.shadowSim?.resetCamera(preset);
      });
    });

    // EVF Focus Peaking & Grid
    const btnPeaking = this.rootEl.querySelector('#btnStudioPeaking');
    btnPeaking?.addEventListener('click', () => {
      const state = this.dofVisualizer?.toggleFocusPeaking();
      btnPeaking.classList.toggle('active', Boolean(state));
    });

    const btnGrid = this.rootEl.querySelector('#btnStudioGrid');
    btnGrid?.addEventListener('click', () => {
      const state = this.dofVisualizer?.toggleGrid();
      btnGrid.classList.toggle('active', Boolean(state));
    });

    // Nattilstand
    this.rootEl.querySelector('#btnNightMode')?.addEventListener('click', () => {
      this.toggleNightMode();
    });
  }

  private static attachKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === '1') StudioState.setCanvasView('split');
      else if (e.key === '2') StudioState.setCanvasView('map');
      else if (e.key === '3') StudioState.setCanvasView('3d');
      else if (e.key === '4') StudioState.setCanvasView('evf');
      else if (e.key === ' ') {
        e.preventDefault();
        if (this.isPlayingTime) this.pauseTimePlayback();
        else this.startTimePlayback();
      }
    });
  }

  private static onStudioStateUpdate(snap: StudioSnapshot): void {
    // 1. Opdater Topbar (Lokation, Dato/Tid, Sol/Skygge/Måne/Vejr telemetri)
    this.updateTopbar(snap);

    // 2. Opdater Center Stage Layout & HUD
    this.applyCanvasLayout(snap);

    // 3. Opdater Kort, 3D-Simulator, EVF-Søger, Højre Kamera-Rack og Bund-Tidslinje
    this.mapCanvas.update(snap);
    this.cameraRack.update(snap);
    this.timelineDock.update(snap);

    // Opdater 3D Sol & Skygge
    if (this.shadowSim) {
      this.rootEl.querySelectorAll('[data-subj-model]').forEach((b) => {
        b.classList.toggle('active', (b as HTMLElement).dataset.subjModel === snap.subjectType);
      });
      const diffFactor = Math.max(0.15, 1 - (snap.currentHourWeather.cloudTotal / 100) * 0.85);
      this.shadowSim.update(snap.sunPos.altitude, snap.sunPos.azimuth, snap.subjectHeightM, {
        subjectType: snap.subjectType,
        diffusionFactor: diffFactor,
        sunTimes: snap.sunTimes,
        lat: snap.location.lat,
        lng: snap.location.lng
      });
    }

    // Opdater Optisk EVF Søger & Strålediagram (med den rigtige lukkertid og ISO fra StudioState!)
    if (this.dofVisualizer) {
      this.dofVisualizer.render(snap.dof);
      const osdShutter = this.rootEl.querySelector('#evfOsdShutter');
      const osdIso = this.rootEl.querySelector('#evfOsdIso');
      if (osdShutter) osdShutter.textContent = ExposureEngine.formatShutterSpeed(snap.shutter);
      if (osdIso) osdIso.textContent = `ISO ${snap.iso}`;
    }
  }

  private static updateTopbar(snap: StudioSnapshot): void {
    const locName = this.rootEl.querySelector('#topbarLocName');
    const locCoords = this.rootEl.querySelector('#topbarLocCoords');
    if (locName) locName.textContent = snap.location.name;
    if (locCoords) locCoords.textContent = `${snap.location.lat.toFixed(4)}°N, ${snap.location.lng.toFixed(4)}°Ø`;

    const dateInput = this.rootEl.querySelector('#topbarDatePicker') as HTMLInputElement;
    const dateLabel = this.rootEl.querySelector('#topbarDateLabel');
    const iso = TimeService.formatIsoDate(snap.date);
    if (dateInput && dateInput.value !== iso) dateInput.value = iso;
    if (dateLabel) {
      dateLabel.textContent = `${TimeService.formatShortDate(snap.date)} (${TimeService.formatRelativeDay(snap.date)})`;
    }

    const clockVal = this.rootEl.querySelector('#topbarClockVal');
    if (clockVal) clockVal.textContent = TimeService.formatTime(snap.date);

    const phase = AstroCore.getLightPhase(snap.sunPos.altitude);
    const phaseBadge = this.rootEl.querySelector('#topbarPhaseBadge') as HTMLElement;
    if (phaseBadge) {
      phaseBadge.textContent = phase.badge;
      phaseBadge.style.color = phase.color;
      phaseBadge.style.borderColor = `${phase.color}55`;
    }

    // Telemetri-piller
    const teleSun = this.rootEl.querySelector('#teleSunVal');
    const teleKelvin = this.rootEl.querySelector('#teleKelvinVal');
    const teleShadow = this.rootEl.querySelector('#teleShadowVal');
    const teleMoon = this.rootEl.querySelector('#teleMoonVal');
    const teleWeather = this.rootEl.querySelector('#teleWeatherVal');

    if (teleSun) {
      const dir = AstroCore.getCompassDirection(snap.sunPos.azimuth);
      teleSun.textContent = `${snap.sunPos.altitude >= 0 ? '+' : ''}${snap.sunPos.altitude.toFixed(1)}° (${snap.sunPos.azimuth.toFixed(0)}° ${dir})`;
    }
    if (teleKelvin) {
      teleKelvin.textContent = snap.kelvin.kelvin > 0 ? `${snap.kelvin.kelvin}K` : 'Nat';
    }
    if (teleShadow) {
      if (snap.shadow.hasDirectShadow) {
        const sDir = AstroCore.getCompassDirection(snap.shadow.shadowAzimuth);
        teleShadow.textContent = `${snap.shadow.shadowLength.toFixed(1).replace('.', ',')} m (${snap.shadow.shadowAzimuth.toFixed(0)}° ${sDir})`;
      } else {
        teleShadow.textContent = 'Ingen direkte skygge';
      }
    }
    if (teleMoon) {
      const pct = Math.round(snap.moonIllum.fraction);
      teleMoon.textContent = `${snap.moonIllum.icon} ${pct}% (${snap.moonPos.altitude >= 0 ? '+' : ''}${snap.moonPos.altitude.toFixed(0)}°)`;
    }
    if (teleWeather) {
      const w = snap.currentHourWeather;
      teleWeather.textContent = `${w.weatherIcon} ${w.temp}°C • Sky ${w.cloudTotal}% • ${w.windSpeed} m/s`;
    }
  }

  private static applyCanvasLayout(snap: StudioSnapshot): void {
    const grid = this.rootEl.querySelector('#stageCanvasGrid') as HTMLElement;
    const splitTabs = this.rootEl.querySelector('#visSplitTabs') as HTMLElement;

    this.rootEl.querySelectorAll('[data-canvas-view]').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.canvasView === snap.canvasView);
    });

    if (grid) {
      grid.className = `stage-canvas-grid view-${snap.canvasView}`;
    }

    // I Split-View kan brugeren skifte højre halvdel mellem 3D og EVF.
    // I dedikeret '3d' eller 'evf' vises den pågældende fuldskærm.
    if (splitTabs) {
      splitTabs.style.display = snap.canvasView === 'split' ? 'flex' : 'none';
    }

    this.syncVisualizerSubPane(snap);

    // Opdater Stage Vector HUD
    const hudDist = this.rootEl.querySelector('#hudTargetDist');
    const hudAz = this.rootEl.querySelector('#hudTargetAz');
    const hudFov = this.rootEl.querySelector('#hudFovDeg');
    const hudDof = this.rootEl.querySelector('#hudDofSpan');

    if (hudDist) hudDist.textContent = DofEngine.formatDistance(snap.subjectDistanceM);
    if (hudAz) hudAz.textContent = `${snap.cameraAzimuthDeg}° ${AstroCore.getCompassDirection(snap.cameraAzimuthDeg)}`;
    if (hudFov) hudFov.textContent = `${snap.horizontalFovDeg.toFixed(0)}° (${snap.focalLengthMm}mm)`;
    if (hudDof) {
      const nearStr = DofEngine.formatDistance(snap.dof.nearLimitM);
      const farStr = snap.dof.isInfinity ? '∞' : DofEngine.formatDistance(snap.dof.farLimitM);
      hudDof.textContent = `${nearStr} → ${farStr}`;
    }

    this.mapCanvas.invalidateSize();
    setTimeout(() => this.shadowSim?.render(), 30);
  }

  private static syncVisualizerSubPane(snap: StudioSnapshot): void {
    const activeSub =
      snap.canvasView === '3d' ? '3d' : snap.canvasView === 'evf' ? 'evf' : this.rightSplitTab;

    this.rootEl.querySelectorAll('[data-vis-tab]').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.visTab === activeSub);
    });

    const box3d = this.rootEl.querySelector('#visBox3d') as HTMLElement;
    const boxEvf = this.rootEl.querySelector('#visBoxEvf') as HTMLElement;
    const ctrl3d = this.rootEl.querySelector('#vis3dControls') as HTMLElement;
    const ctrlEvf = this.rootEl.querySelector('#visEvfControls') as HTMLElement;

    if (box3d && boxEvf) {
      box3d.classList.toggle('hidden', activeSub !== '3d');
      boxEvf.classList.toggle('hidden', activeSub !== 'evf');
    }
    if (ctrl3d && ctrlEvf) {
      ctrl3d.classList.toggle('hidden', activeSub !== '3d');
      ctrlEvf.classList.toggle('hidden', activeSub !== 'evf');
    }

    if (activeSub === '3d') {
      setTimeout(() => this.shadowSim?.render(), 20);
    }
  }

  private static startTimePlayback(): void {
    this.isPlayingTime = true;
    const btn = this.rootEl.querySelector('#btnPlayTime');
    if (btn) {
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      btn.classList.add('active');
    }
    this.playInterval = setInterval(() => {
      const next = new Date(TimeService.getDate().getTime() + 3 * 60 * 1000);
      TimeService.setDate(next);
    }, 60);
  }

  private static pauseTimePlayback(): void {
    if (!this.isPlayingTime) return;
    this.isPlayingTime = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    const btn = this.rootEl.querySelector('#btnPlayTime');
    if (btn) {
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      btn.classList.remove('active');
    }
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
          <input type="text" id="desktopLocSearchInput" placeholder="Søg adresse, by, sted eller koordinat (f.eks. Rubjerg Knude, 55.67, 12.56)..." autocomplete="off">
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
              <button class="fs-btn" id="btnTriggerSaveDesktopSpot" style="width:100%;min-height:30px;font-size:12px;border:1px dashed var(--accent-sun);color:var(--accent-sun);">
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
                ? `<div style="font-size:12px;color:var(--text-dim);padding:6px 0;">Ingen gemte spots endnu.</div>`
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
    const btn = this.rootEl.querySelector('#btnNightMode');
    if (settings.nightMode) {
      document.body.classList.add('theme-night-red');
      btn?.classList.add('active');
    }
  }

  private static toggleNightMode(): void {
    const isNight = document.body.classList.toggle('theme-night-red');
    const btn = this.rootEl.querySelector('#btnNightMode');
    btn?.classList.toggle('active', isNight);
    StorageService.saveSettings({ nightMode: isNight });
    window.dispatchEvent(new CustomEvent('fs-theme-change', { detail: { nightMode: isNight } }));
    StudioState.recalculateAndNotify();
  }
}
