/**
 * LocationBar.ts - Fælles, ensartet lokationskomponent for Hjem, Vejr og Sol (§4.2, §9.1)
 * Indeholder lokationsvisning, GPS-knap, adresse- og stedsøgning (Photon OSM + Open-Meteo),
 * samt oprettelse, valg og administration af brugerens egne gemte fotospots.
 */

import { LocationService, GeoLocation, PhotoSpot } from '../services/LocationService.ts';

export interface LocationBarOptions {
  container: HTMLElement;
  onLocationChange?: (loc: GeoLocation) => void;
  accentClass?: string;
}

export class LocationBar {
  private container: HTMLElement;
  private onLocationChange?: (loc: GeoLocation) => void;
  private accentClass: string;
  private currentLocation: GeoLocation;
  private searchOpen: boolean = false;
  private showSaveInput: boolean = false;
  private unsubLocation: (() => void) | null = null;
  private debounceTimer: any = null;

  private static escapeHtml(str: string): string {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  constructor(options: LocationBarOptions) {
    this.container = options.container;
    this.onLocationChange = options.onLocationChange;
    this.accentClass = options.accentClass || 'fs-btn-accent-sun';
    this.currentLocation = LocationService.getLocation();

    this.render();

    this.unsubLocation = LocationService.subscribe((loc) => {
      this.currentLocation = loc;
      this.render();
      if (this.onLocationChange) {
        this.onLocationChange(loc);
      }
    });
  }

  public destroy(): void {
    if (this.unsubLocation) {
      this.unsubLocation();
      this.unsubLocation = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  public render(): void {
    const savedSpots: PhotoSpot[] = LocationService.getSavedSpots();
    const safeName = LocationBar.escapeHtml(this.currentLocation.name);

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-2); width: 100%;">
        <!-- LOKATIONS-BJÆLKE -->
        <div class="location-bar">
          <div class="loc-info-group" id="locBarToggle" title="Tryk for at søge adresse eller vælge lokation" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="loc-main-name">📍 ${safeName}</span>
              <span class="loc-search-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 2px 8px; border-radius: 12px; background: var(--bg-surface-elevated); border: 1px solid var(--border-highlight); color: var(--accent-sun); font-weight: 600;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Søg adresse
              </span>
            </div>
            <span class="loc-sub-coords">${this.currentLocation.lat.toFixed(4)}°N, ${this.currentLocation.lng.toFixed(4)}°Ø • Tryk for at skifte</span>
          </div>
          <div class="loc-actions">
            <button class="fs-btn-icon ${this.searchOpen ? 'active' : ''}" id="locBarSearchBtn" title="Søg adresse, vejnavn eller by" aria-label="Søg adresse" style="color: var(--accent-sun);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <button class="fs-btn-icon" id="locBarGpsBtn" title="Brug aktuel GPS-position" aria-label="Brug GPS">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="8"></circle>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- SØGEPANEL & GEMTE FOTOSPOTS -->
        <div id="locBarDropdown" class="fs-card location-dropdown-panel" style="display: ${this.searchOpen ? 'block' : 'none'}; margin-bottom: 0;">
          <!-- Søgefelt for konkrete adresser og steder -->
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label for="locBarSearchInput" style="font-size: 12px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Indtast konkret adresse, vejnavn eller by:
              </label>
              <button id="locBarCloseDropdown" style="background: none; border: none; color: var(--text-muted); font-size: 12px; cursor: pointer; padding: 2px 6px;">Luk ✕</button>
            </div>
            <div style="position: relative; display: flex; align-items: center;">
              <input type="text" id="locBarSearchInput" placeholder="F.eks. Nørrebrogade 10, Strandvejen 42, Tisvilde Hegn..." autocomplete="off" style="width: 100%; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-highlight); background: var(--bg-surface); color: var(--text-main); font-size: 14px;">
            </div>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
              Tip: Søg på fuld gadeadresse med husnummer, by, seværdighed eller direkte GPS-koordinater.
            </div>
            <div id="locBarSearchResults" style="display: flex; flex-direction: column; gap: 4px; margin-top: 8px;"></div>
          </div>

          <!-- Gem aktuel position som nyt spot -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-bottom: 12px;">
            ${
              this.showSaveInput
                ? `
              <div style="display: flex; flex-direction: column; gap: 8px; background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--accent-sun);">
                <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Navngiv fotospot:</label>
                <input type="text" id="locBarInputSpotName" value="${safeName}" style="padding: 8px; border-radius: var(--radius-xs); border: 1px solid var(--border-highlight); background: var(--bg-surface-elevated); color: var(--text-main); font-size: 13px;">
                <div style="display: flex; gap: 6px; justify-content: flex-end;">
                  <button class="fs-btn" id="locBarBtnCancelSaveSpot" style="padding: 4px 10px; font-size: 11px; min-height: 28px;">Annuller</button>
                  <button class="fs-btn ${this.accentClass}" id="locBarBtnConfirmSaveSpot" style="padding: 4px 12px; font-size: 11px; min-height: 28px;">Gem spot</button>
                </div>
              </div>
            `
                : `
              <button class="fs-btn" id="locBarBtnTriggerSaveSpot" style="width: 100%; justify-content: center; gap: 6px; background: var(--bg-surface-elevated); border: 1px dashed var(--accent-sun); color: var(--accent-sun); font-size: 12px; min-height: 36px;">
                ⭐ Gem aktuel lokation som fotospot
              </button>
            `
            }
          </div>

          <!-- Brugerens gemte fotospots -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Dine Gemte Fotospots (${savedSpots.length}):</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${
                savedSpots.length === 0
                  ? `
                <div style="font-size: 12px; color: var(--text-dim); text-align: center; padding: 12px 6px; line-height: 1.4;">
                  Ingen gemte fotospots endnu.<br>Tryk på <em>"Gem aktuel lokation"</em> herover for at tilføje dit første spot.
                </div>
              `
                  : savedSpots
                      .map(
                        (spot) => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); transition: border-color 0.15s ease;">
                  <div style="cursor: pointer; flex: 1; overflow: hidden;" data-select-spot="${LocationBar.escapeHtml(spot.id)}">
                    <strong style="color: var(--text-main); font-size: 13px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📍 ${LocationBar.escapeHtml(spot.name)}</strong>
                    <span style="color: var(--text-muted); font-size: 11px; font-family: var(--font-mono);">${spot.lat.toFixed(4)}°N, ${spot.lng.toFixed(4)}°Ø</span>
                  </div>
                  <button class="fs-btn-icon" data-delete-spot="${LocationBar.escapeHtml(spot.id)}" title="Slet spot" style="width: 28px; height: 28px; border: none; color: var(--text-dim); background: transparent; cursor: pointer;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              `
                      )
                      .join('')
              }
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const toggleSearch = () => {
      this.searchOpen = !this.searchOpen;
      this.render();
      if (this.searchOpen) {
        setTimeout(() => {
          (this.container.querySelector('#locBarSearchInput') as HTMLInputElement)?.focus();
        }, 50);
      }
    };

    // Åbn/luk dropdown via bjælke eller søgeknap
    this.container.querySelector('#locBarToggle')?.addEventListener('click', toggleSearch);
    this.container.querySelector('#locBarSearchBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSearch();
    });

    this.container.querySelector('#locBarCloseDropdown')?.addEventListener('click', () => {
      this.searchOpen = false;
      this.render();
    });

    // GPS knap
    this.container.querySelector('#locBarGpsBtn')?.addEventListener('click', async () => {
      const btn = this.container.querySelector('#locBarGpsBtn') as HTMLElement;
      if (btn) btn.style.opacity = '0.5';
      try {
        this.searchOpen = false;
        await LocationService.requestGpsLocation();
      } catch (err) {
        alert((err as Error).message);
      } finally {
        if (btn) btn.style.opacity = '1';
      }
    });

    // Søgefelt for adresser, steder og koordinater
    const searchInput = this.container.querySelector('#locBarSearchInput') as HTMLInputElement | null;
    const resultsContainer = this.container.querySelector('#locBarSearchResults') as HTMLElement | null;

    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (this.debounceTimer) clearTimeout(this.debounceTimer);

      if (q.length < 2) {
        if (resultsContainer) resultsContainer.innerHTML = '';
        return;
      }

      this.debounceTimer = setTimeout(async () => {
        if (resultsContainer) {
          resultsContainer.innerHTML = `
            <div style="font-size:12px;color:var(--text-muted);padding:8px;text-align:center;">
              Søger efter adresser og steder...
            </div>
          `;
        }
        const matches = await LocationService.search(q);
        if (!resultsContainer) return;

        if (matches.length === 0) {
          resultsContainer.innerHTML = `
            <div style="font-size:12px;color:var(--text-dim);padding:8px;text-align:center;">
              Ingen adresser eller steder fundet for "${LocationBar.escapeHtml(q)}"
            </div>
          `;
          return;
        }

        resultsContainer.innerHTML = matches
          .map(
            (m, i) => `
          <div class="search-result-item" data-idx="${i}" style="display:flex;flex-direction:column;padding:8px 10px;background:var(--bg-surface-elevated);border-radius:var(--radius-xs);cursor:pointer;border:1px solid var(--border-subtle);transition:all 0.1s ease;">
            <strong style="color:var(--text-main);font-size:13px;">📍 ${LocationBar.escapeHtml(m.name)}</strong>
            <span style="color:var(--text-muted);font-size:11px;">${LocationBar.escapeHtml(m.sub)} • <span style="font-family:var(--font-mono);">${m.lat.toFixed(4)}°N, ${m.lng.toFixed(4)}°Ø</span></span>
          </div>
        `
          )
          .join('');

        resultsContainer.querySelectorAll('.search-result-item').forEach((item) => {
          item.addEventListener('click', () => {
            const idx = Number((item as HTMLElement).dataset.idx);
            const chosen = matches[idx];
            if (chosen) {
              this.searchOpen = false;
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
      }, 250);
    });

    // Trigger gem fotospot
    this.container.querySelector('#locBarBtnTriggerSaveSpot')?.addEventListener('click', () => {
      this.showSaveInput = true;
      this.render();
      setTimeout(() => {
        const input = this.container.querySelector('#locBarInputSpotName') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }, 50);
    });

    this.container.querySelector('#locBarBtnCancelSaveSpot')?.addEventListener('click', () => {
      this.showSaveInput = false;
      this.render();
    });

    this.container.querySelector('#locBarBtnConfirmSaveSpot')?.addEventListener('click', () => {
      const input = this.container.querySelector('#locBarInputSpotName') as HTMLInputElement | null;
      const spotName = input?.value || this.currentLocation.name;
      LocationService.saveSpot(spotName, this.currentLocation.lat, this.currentLocation.lng);
      this.showSaveInput = false;
      this.render();
    });

    // Vælg gemt fotospot
    this.container.querySelectorAll('[data-select-spot]').forEach((el) => {
      el.addEventListener('click', () => {
        const spotId = el.getAttribute('data-select-spot');
        const spots = LocationService.getSavedSpots();
        const found = spots.find((s) => s.id === spotId);
        if (found) {
          this.searchOpen = false;
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

    // Slet gemt fotospot
    this.container.querySelectorAll('[data-delete-spot]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const spotId = btn.getAttribute('data-delete-spot');
        if (spotId && confirm('Vil du slette dette gemte fotospot?')) {
          LocationService.deleteSpot(spotId);
          this.render();
        }
      });
    });
  }
}
