/**
 * AppShell.ts - Overordnet PWA-skal for Fotografiske Signaler (§4, §5)
 */

import { ModuleRegistry, AppModule, ModuleInstance } from './ModuleRegistry.ts';
import { Router, RouteMatch } from './Router.ts';
import { StorageService } from '../shared/services/StorageService.ts';

export class AppShell {
  private static rootEl: HTMLElement;
  private static headerBadgeEl: HTMLElement;
  private static btnNightModeEl: HTMLElement;
  private static mainContentEl: HTMLElement;
  private static bottomNavEl: HTMLElement;
  private static updateToastEl: HTMLElement | null = null;

  private static currentModuleId: string | null = null;
  private static moduleContainers: Map<string, HTMLElement> = new Map();
  private static loadedInstances: Map<string, ModuleInstance> = new Map();

  public static init(root: HTMLElement): void {
    this.rootEl = root;
    this.renderShell();
    this.initNightMode();
    this.setupNavigation();
    this.setupPwaUpdateListener();
  }

  private static renderShell(): void {
    this.rootEl.innerHTML = `
      <header class="app-header">
        <div class="header-brand" id="btnHeaderBrand" role="button" aria-label="Gå til Hjem">
          <img src="fotografiske-signaler-wordmark.png" alt="Fotografiske Signaler" class="header-logo" onerror="this.style.display='none'">
          <span class="header-badge" id="headerModuleBadge" style="display: none;"></span>
        </div>
        <div class="header-actions">
          <button class="fs-btn-icon" id="btnNightMode" title="Astro Rød nattilstand" aria-label="Skift til rød nattilstand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
            </svg>
          </button>
        </div>
      </header>

      <main id="main-content" role="main"></main>

      <nav class="app-bottom-nav" aria-label="Hovednavigation" id="bottomNav"></nav>
    `;

    this.headerBadgeEl = this.rootEl.querySelector('#headerModuleBadge')!;
    this.btnNightModeEl = this.rootEl.querySelector('#btnNightMode')!;
    this.mainContentEl = this.rootEl.querySelector('#main-content')!;
    this.bottomNavEl = this.rootEl.querySelector('#bottomNav')!;

    // Klik på logo navigerer til Hjem
    this.rootEl.querySelector('#btnHeaderBrand')?.addEventListener('click', () => {
      Router.navigate('#/');
    });

    // Rød nattilstand toggle
    this.btnNightModeEl.addEventListener('click', () => {
      this.toggleNightMode();
    });

    this.renderBottomNav();
  }

  private static renderBottomNav(): void {
    const modules = ModuleRegistry.getAll();
    this.bottomNavEl.innerHTML = modules
      .map(
        (mod) => `
      <a href="${mod.route}" class="nav-item" data-module="${mod.id}" id="nav-item-${mod.id}">
        ${mod.iconSvg}
        <span>${mod.shortName}</span>
      </a>
    `
      )
      .join('');
  }

  private static setupNavigation(): void {
    Router.subscribe(async (match: RouteMatch) => {
      await this.handleRoute(match);
    });
  }

  private static async handleRoute(match: RouteMatch): Promise<void> {
    const activeModule = ModuleRegistry.getByRoute(match.route) || ModuleRegistry.get('home');
    if (!activeModule) return;

    const newModuleId = activeModule.id;

    // Opdater topbjælke modul-badge (skjult på Hjem)
    if (newModuleId === 'home') {
      this.headerBadgeEl.style.display = 'none';
    } else {
      this.headerBadgeEl.textContent = activeModule.name;
      this.headerBadgeEl.style.display = 'inline-block';
    }

    // Opdater aktiv fane i bundnavigation
    const allNavItems = this.bottomNavEl.querySelectorAll('.nav-item');
    allNavItems.forEach((item) => {
      const isTarget = item.getAttribute('data-module') === newModuleId;
      item.classList.toggle('active', isTarget);
    });

    // Hvis samme modul er aktivt, send blot nyt kontekst/parametre
    if (this.currentModuleId === newModuleId) {
      const instance = this.loadedInstances.get(newModuleId);
      if (instance?.onActivate) {
        instance.onActivate({ ...match.context, params: match.params });
      }
      return;
    }

    // Deaktiver forrige modul hvis det findes
    if (this.currentModuleId) {
      const prevInstance = this.loadedInstances.get(this.currentModuleId);
      if (prevInstance?.onDeactivate) {
        prevInstance.onDeactivate();
      }
      const prevContainer = this.moduleContainers.get(this.currentModuleId);
      if (prevContainer) {
        prevContainer.classList.add('hidden');
      }
    }

    // Klargør eller hent container for det nye modul
    let container = this.moduleContainers.get(newModuleId);
    let instance = this.loadedInstances.get(newModuleId);

    if (!container) {
      container = document.createElement('div');
      container.id = `view-${newModuleId}`;
      container.className = 'module-view';
      this.mainContentEl.appendChild(container);
      this.moduleContainers.set(newModuleId, container);

      // Vis midlertidig loading-indikator
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:240px;color:var(--text-muted);gap:12px;">
          <div style="width:20px;height:20px;border:2px solid var(--border-subtle);border-top-color:var(--text-main);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
          <span>Indlæser ${activeModule.name}...</span>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;

      try {
        instance = await ModuleRegistry.loadInstance(newModuleId);
        this.loadedInstances.set(newModuleId, instance);
        container.innerHTML = '';
        await instance.mount(container);
      } catch (err) {
        console.error(`Fejl ved indlæsning af modul ${newModuleId}:`, err);
        container.innerHTML = `
          <div class="fs-card" style="border-color:var(--accent-danger);">
            <h3 style="color:var(--accent-danger);margin-bottom:8px;">Kunne ikke indlæse ${activeModule.name}</h3>
            <p style="color:var(--text-muted);">${(err as Error).message}</p>
          </div>
        `;
        return;
      }
    }

    // Vis containeren
    container.classList.remove('hidden');
    this.currentModuleId = newModuleId;

    // Gem senest besøgte modul
    StorageService.saveSettings({ lastModule: newModuleId });

    // Aktiver livscyklus hook med kontekst
    if (instance?.onActivate) {
      instance.onActivate({ ...match.context, params: match.params });
    }

    // Scroll til top ved modulskift
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  private static initNightMode(): void {
    const settings = StorageService.getSettings();
    if (settings.nightMode) {
      document.body.classList.add('theme-night-red');
      this.btnNightModeEl.classList.add('active');
    }
  }

  private static toggleNightMode(): void {
    const isNight = document.body.classList.toggle('theme-night-red');
    this.btnNightModeEl.classList.toggle('active', isNight);
    StorageService.saveSettings({ nightMode: isNight });

    // Opdater meta theme-color i HTML
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isNight ? '#080000' : '#07080a');
    }

    // Notificer aktive canvas/moduler om temaskift
    window.dispatchEvent(new CustomEvent('fs-theme-change', { detail: { nightMode: isNight } }));
  }

  public static showUpdateToast(onUpdate: () => void): void {
    if (this.updateToastEl) return;
    const toast = document.createElement('div');
    toast.className = 'update-toast';
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">✨</span>
        <div style="font-size:13px;line-height:1.3;">
          <strong style="color:var(--text-main);display:block;">Ny version klar</strong>
          <span style="color:var(--text-muted);">Opdatering til Fotografiske Signaler</span>
        </div>
      </div>
      <button class="fs-btn fs-btn-accent-sun" id="btnPwaUpdate" style="padding:6px 12px;font-size:12px;min-height:32px;">Opdater</button>
    `;
    document.body.appendChild(toast);
    this.updateToastEl = toast;

    toast.querySelector('#btnPwaUpdate')?.addEventListener('click', () => {
      onUpdate();
      toast.remove();
      this.updateToastEl = null;
    });
  }

  private static setupPwaUpdateListener(): void {
    window.addEventListener('pwa-update-available', ((e: CustomEvent) => {
      if (e.detail && typeof e.detail.update === 'function') {
        this.showUpdateToast(e.detail.update);
      }
    }) as EventListener);
  }
}
