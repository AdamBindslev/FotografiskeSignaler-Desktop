/**
 * index.ts - Hjemmeskærm controller for Fotografiske Signaler (§4.2)
 */

import { ModuleInstance } from '../../app/ModuleRegistry.ts';
import { Router } from '../../app/Router.ts';
import { LocationService, GeoLocation } from '../../shared/services/LocationService.ts';
import { TimeService } from '../../shared/services/TimeService.ts';
import { StorageService } from '../../shared/services/StorageService.ts';
import { AstroCore } from '../../shared/astronomy/AstroCore.ts';
import { LocationBar } from '../../shared/components/LocationBar.ts';

export default class HomeModule implements ModuleInstance {
  private container!: HTMLElement;
  private currentLocation: GeoLocation = LocationService.getLocation();
  private locationBar: LocationBar | null = null;
  private unsubLocation: (() => void) | null = null;

  public mount(container: HTMLElement): void {
    this.container = container;
    this.currentLocation = LocationService.getLocation();
    this.render();

    this.unsubLocation = LocationService.subscribe((loc) => {
      this.currentLocation = loc;
      this.render();
    });
  }

  public onActivate(): void {
    this.currentLocation = LocationService.getLocation();
    this.render();
  }

  public destroy(): void {
    if (this.unsubLocation) {
      this.unsubLocation();
      this.unsubLocation = null;
    }
    if (this.locationBar) {
      this.locationBar.destroy();
      this.locationBar = null;
    }
  }

  private static escapeHtml(str: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private render(): void {
    const settings = StorageService.getSettings();
    const now = new Date();
    const sunPos = AstroCore.getSunPosition(now, this.currentLocation.lat, this.currentLocation.lng);
    const sunTimes = AstroCore.getSunTimes(now, this.currentLocation.lat, this.currentLocation.lng);
    const lightPhase = AstroCore.getLightPhase(sunPos.altitude);
    const lastMod = settings.lastModule !== 'home' ? settings.lastModule : null;
    const safeLocName = HomeModule.escapeHtml(this.currentLocation.name);

    if (this.locationBar) {
      this.locationBar.destroy();
      this.locationBar = null;
    }

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4); width: 100%;">
        <!-- VELKOMST HERO -->
        <div class="fs-card" style="padding: var(--space-5); text-align: center; border-color: var(--border-highlight); background: linear-gradient(180deg, rgba(22, 27, 34, 0.95) 0%, rgba(15, 18, 23, 0.9) 100%);">
          <div style="display: flex; justify-content: center; margin-bottom: 12px;">
            <img src="fotografiske-signaler-wordmark.png" alt="Fotografiske Signaler" style="max-height: 48px; width: auto;" onerror="this.style.display='none'">
          </div>
          <h1 style="font-size: 1.4rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px;">
            Fotografisk værktøjskasse
          </h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 480px; margin: 0 auto; line-height: 1.45;">
            Professionel fotografisk værktøjskasse. Vejranalyse, sol- og lysretning, optiske DOF-beregninger samt eksponering og ND-filter samlet i én mobiloptimeret PWA.
          </p>

          <!-- Aktuel status bar med solinfo -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 14px; font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); border-top: 1px solid var(--border-subtle); padding-top: 12px; flex-wrap: wrap;">
            <span style="color: ${lightPhase.color}; font-weight: 700;">● ${lightPhase.name}</span>
            <span>•</span>
            <span>Sol ${sunPos.altitude >= 0 ? '+' : ''}${sunPos.altitude.toFixed(0)}° (${sunPos.azimuth.toFixed(0)}° ${AstroCore.getCompassDirection(sunPos.azimuth)})</span>
            <span>•</span>
            <span>Solnedgang: ${TimeService.formatTime(sunTimes.sunset)}</span>
          </div>
        </div>

        <!-- FÆLLES LOKATIONSVÆLGER (§4.2, §9.1) -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: -6px; padding: 0 2px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
            Valgt lokation
          </span>
          <span style="font-size: 11px; color: var(--text-dim);">
            Søg adresse eller brug GPS
          </span>
        </div>
        <div id="homeLocationMount"></div>

        ${
          lastMod
            ? `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-elevated); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <span style="font-size:12px; color:var(--text-muted);">Sidst anvendte værktøj:</span>
            <button class="fs-btn" id="btnResumeLast" style="padding:4px 12px; font-size:12px; min-height:28px;">
              Gå til ${this.getModuleName(lastMod)} →
            </button>
          </div>
        `
            : ''
        }

        <!-- MODUL 1: VEJR -->
        <div class="fs-card" style="border-left: 3px solid var(--accent-weather); cursor: pointer;" id="cardGoWeather">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--accent-weather-glow); display: flex; align-items: center; justify-content: center; color: var(--accent-weather);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
              </div>
              <div>
                <h2 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Vejr</h2>
                <span style="font-size: 11px; color: var(--accent-weather); font-weight: 600; text-transform: uppercase;">Atmosfære & Fotovinduer</span>
              </div>
            </div>
            <span class="fs-badge badge-weather">Vejr</span>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
            7-døgns fotografisk vejranalyse for ${safeLocName}. Beregner morgentåge, gylden time-kvalitet, skydække i 3 lag og stjerneklart astro-vindue.
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 8px; font-size: 11px; color: var(--text-dim);">
            <span>Solopgang: ${TimeService.formatTime(sunTimes.sunrise)} • Solnedgang: ${TimeService.formatTime(sunTimes.sunset)}</span>
            <span style="color: var(--accent-weather); font-weight: 600;">Åbn Vejr →</span>
          </div>
        </div>

        <!-- MODUL 2: SOL -->
        <div class="fs-card" style="border-left: 3px solid var(--accent-sun); cursor: pointer;" id="cardGoSun">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--accent-sun-glow); display: flex; align-items: center; justify-content: center; color: var(--accent-sun);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                </svg>
              </div>
              <div>
                <h2 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Sol</h2>
                <span style="font-size: 11px; color: var(--accent-sun); font-weight: 600; text-transform: uppercase;">Sol, Skygge & Lysretning</span>
              </div>
            </div>
            <span class="fs-badge badge-sun">3D & Kort</span>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
            Interaktiv 3D-søger og satellitkort for ${safeLocName}. Simulerer solhøjde, azimut, skyggelængde for person/træ/bygning og farvetemperatur gennem døgnet.
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 8px; font-size: 11px; color: var(--text-dim);">
            <span>Aktuel retning: ${sunPos.azimuth.toFixed(0)}° ${AstroCore.getCompassDirection(sunPos.azimuth)}</span>
            <span style="color: var(--accent-sun); font-weight: 600;">Åbn Sol →</span>
          </div>
        </div>

        <!-- MODUL 3: DOF -->
        <div class="fs-card" style="border-left: 3px solid var(--accent-dof); cursor: pointer;" id="cardGoDof">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--accent-dof-glow); display: flex; align-items: center; justify-content: center; color: var(--accent-dof);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                  <line x1="12" y1="2" x2="12" y2="4"></line>
                  <line x1="12" y1="20" x2="12" y2="22"></line>
                </svg>
              </div>
              <div>
                <h2 style="font-size: 15px; font-weight: 700; color: var(--text-main);">DOF</h2>
                <span style="font-size: 11px; color: var(--accent-dof); font-weight: 600; text-transform: uppercase;">Optik, Fokus & Bokeh</span>
              </div>
            </div>
            <span class="fs-badge badge-dof">100% Offline</span>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
            Præcisionsberegner for dybdeskarphed, hyperfokalafstand, diffraktionsgrænser og bokeh med simuleret EVF-søger og optisk målestok.
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 8px; font-size: 11px; color: var(--text-dim);">
            <span>Understøtter Mellemformat, Full Frame, APS-C, MFT & Mobil</span>
            <span style="color: var(--accent-dof); font-weight: 600;">Åbn DOF →</span>
          </div>
        </div>

        <!-- MODUL 4: EKSPONERING -->
        <div class="fs-card" style="border-left: 3px solid var(--accent-exposure); cursor: pointer;" id="cardGoExposure">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--accent-exposure-glow); display: flex; align-items: center; justify-content: center; color: var(--accent-exposure);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                </svg>
              </div>
              <div>
                <h2 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Eksponering</h2>
                <span style="font-size: 11px; color: var(--accent-exposure); font-weight: 600; text-transform: uppercase;">Trekant, ND & Bulb-Timer</span>
              </div>
            </div>
            <span class="fs-badge badge-exposure">100% Offline</span>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
            Interaktiv eksponeringstrekant med EV-lysmåler og dynamisk histogram. Beregner sikker håndholdt lukkertid, astro 500-reglen, ND-filter stacking og integreret Bulb-nedtællingstimer med Dark Frame.
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 8px; font-size: 11px; color: var(--text-dim);">
            <span>EV-lås, ND2–ND1000000 & Dark Frame (LENR)</span>
            <span style="color: var(--accent-exposure); font-weight: 600;">Åbn Eksponering →</span>
          </div>
        </div>

        <!-- OM PROJEKTET & ASTRO NAT INFO -->
        <div class="fs-card" style="font-size: 12px; color: var(--text-dim); line-height: 1.5;">
          <strong style="color: var(--text-main); display: block; margin-bottom: 4px;">Om Fotografiske Signaler PWA</strong>
          Appen kører 100% lokalt i din browser og kan installeres på startskærmen af din mobil. Tryk på måne-ikonet øverst til højre for at aktivere rød nattilstand (skåner nattesynet ved astro- og aftenfotografering).
        </div>
      </div>
    `;

    // Monter fælles LocationBar
    const mountEl = this.container.querySelector('#homeLocationMount') as HTMLElement | null;
    if (mountEl) {
      this.locationBar = new LocationBar({
        container: mountEl,
        accentClass: 'fs-btn-accent-sun'
      });
    }

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Navigation til moduler
    this.container.querySelector('#cardGoWeather')?.addEventListener('click', () => {
      Router.navigate('#/vejr');
    });

    this.container.querySelector('#cardGoSun')?.addEventListener('click', () => {
      Router.navigate('#/sol');
    });

    this.container.querySelector('#cardGoDof')?.addEventListener('click', () => {
      Router.navigate('#/dof');
    });

    this.container.querySelector('#cardGoExposure')?.addEventListener('click', () => {
      Router.navigate('#/eksponering');
    });

    this.container.querySelector('#btnResumeLast')?.addEventListener('click', () => {
      const settings = StorageService.getSettings();
      if (settings.lastModule === 'weather') Router.navigate('#/vejr');
      else if (settings.lastModule === 'sun') Router.navigate('#/sol');
      else if (settings.lastModule === 'dof') Router.navigate('#/dof');
      else if (settings.lastModule === 'exposure') Router.navigate('#/eksponering');
    });
  }

  private getModuleName(id: string): string {
    if (id === 'weather') return 'Vejr';
    if (id === 'sun') return 'Sol';
    if (id === 'dof') return 'DOF';
    if (id === 'exposure') return 'Eksponering';
    return id;
  }
}
