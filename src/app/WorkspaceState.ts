/**
 * WorkspaceState.ts - Central reaktiv Master-State for Fotografiske Signaler Desktop Edition
 * Koordinerer synkronisering mellem alle åbne paneler i realtid:
 *  - Workspace-mode ('dashboard' | 'planning' | 'optics') & maksimeret panel
 *  - Global Tid & Lokation (via TimeService & LocationService)
 *  - Krydskobling: Naturligt lysniveau (Auto-EV) fra Solhøjde + Vejrets skydække til Eksponering
 *  - Krydskobling: Optik (Blænde, Brændvidde, Sensor) mellem DOF og Eksponering
 */

import { AstroCore } from '../shared/astronomy/AstroCore.ts';
import { LocationService, GeoLocation } from '../shared/services/LocationService.ts';
import { TimeService } from '../shared/services/TimeService.ts';
import { StorageService } from '../shared/services/StorageService.ts';

export type WorkspaceMode = 'dashboard' | 'planning' | 'optics';
export type PanelId = 'sun' | 'weather' | 'dof' | 'exposure';

export interface AmbientLightEstimate {
  ev100: number;
  label: string;
  sunAltitude: number;
  cloudCoverPct: number;
}

export interface OpticsSyncPayload {
  aperture: number;
  focalLength: number;
  cropFactor: number;
  sensorName?: string;
}

type WorkspaceModeListener = (mode: WorkspaceMode, maximizedPanel: PanelId | null) => void;
type AmbientEvListener = (estimate: AmbientLightEstimate, autoEvEnabled: boolean) => void;
type OpticsListener = (payload: OpticsSyncPayload) => void;

const WORKSPACE_STORAGE_KEY = 'fs_desktop_workspace_v1';

export class WorkspaceState {
  private static mode: WorkspaceMode = 'dashboard';
  private static maximizedPanel: PanelId | null = null;
  private static autoEvEnabled: boolean = false;
  private static currentCloudCoverPct: number = 25;

  private static modeListeners: Set<WorkspaceModeListener> = new Set();
  private static ambientListeners: Set<AmbientEvListener> = new Set();
  private static opticsListeners: Set<OpticsListener> = new Set();

  public static init(): void {
    const saved = StorageService.getItem<{ mode?: WorkspaceMode; autoEv?: boolean }>(WORKSPACE_STORAGE_KEY, {});
    if (saved.mode && ['dashboard', 'planning', 'optics'].includes(saved.mode)) {
      this.mode = saved.mode;
    }
    if (typeof saved.autoEv === 'boolean') {
      this.autoEvEnabled = saved.autoEv;
    }

    // Lyt på globale tids- og lokationsændringer for at genberegne naturligt lysniveau (EV)
    TimeService.subscribe(() => {
      this.broadcastAmbientEv();
    });
    LocationService.subscribe(() => {
      this.broadcastAmbientEv();
    });
  }

  public static getMode(): WorkspaceMode {
    return this.mode;
  }

  public static getMaximizedPanel(): PanelId | null {
    return this.maximizedPanel;
  }

  public static setMode(newMode: WorkspaceMode): void {
    this.mode = newMode;
    this.maximizedPanel = null;
    StorageService.setItem(WORKSPACE_STORAGE_KEY, {
      mode: this.mode,
      autoEv: this.autoEvEnabled
    });
    this.notifyModeListeners();
  }

  public static toggleMaximizePanel(panelId: PanelId): void {
    if (this.maximizedPanel === panelId) {
      this.maximizedPanel = null;
    } else {
      this.maximizedPanel = panelId;
    }
    this.notifyModeListeners();
  }

  public static subscribeMode(listener: WorkspaceModeListener): () => void {
    this.modeListeners.add(listener);
    return () => this.modeListeners.delete(listener);
  }

  private static notifyModeListeners(): void {
    this.modeListeners.forEach((l) => {
      try {
        l(this.mode, this.maximizedPanel);
      } catch (e) {
        console.error('Fejl i WorkspaceMode listener:', e);
      }
    });
    // Giv kort og canvas-elementer besked om at opdatere deres dimensioner efter grid-skift
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
  }

  // ================= NATURLIGT LYS (AUTO-EV FRA SOL & VEJR) =================

  public static isAutoEvEnabled(): boolean {
    return this.autoEvEnabled;
  }

  public static setAutoEvEnabled(enabled: boolean): void {
    this.autoEvEnabled = enabled;
    StorageService.setItem(WORKSPACE_STORAGE_KEY, {
      mode: this.mode,
      autoEv: this.autoEvEnabled
    });
    this.broadcastAmbientEv();
  }

  public static setCloudCoverForCurrentTime(cloudPct: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(cloudPct)));
    if (clamped !== this.currentCloudCoverPct) {
      this.currentCloudCoverPct = clamped;
      this.broadcastAmbientEv();
    }
  }

  public static getAmbientLightEstimate(
    date: Date = TimeService.getDate(),
    loc: GeoLocation = LocationService.getLocation()
  ): AmbientLightEstimate {
    const sunPos = AstroCore.getSunPosition(date, loc.lat, loc.lng);
    const alt = sunPos.altitude;
    const clouds = this.currentCloudCoverPct;

    // Fysisk estimat af EV100 ud fra solhøjde (astronomisk belysningsmodel)
    let baseEv = 15;
    let label = 'Fuldt dagslys';

    if (alt >= 30) {
      baseEv = 15.0;
      label = 'Høj sol (Sunny 16)';
    } else if (alt >= 15) {
      baseEv = 14.0 + (alt - 15) / 15;
      label = 'Moderat solhøjde';
    } else if (alt >= 6) {
      baseEv = 12.5 + ((alt - 6) / 9) * 1.5;
      label = 'Lav sol';
    } else if (alt >= 0) {
      baseEv = 9.5 + (alt / 6) * 3.0;
      label = 'Gylden time';
    } else if (alt >= -4) {
      baseEv = 6.0 + ((alt + 4) / 4) * 3.5;
      label = 'Blå time (Civil skumring)';
    } else if (alt >= -6) {
      baseEv = 4.0 + ((alt + 6) / 2) * 2.0;
      label = 'Sen blå time';
    } else if (alt >= -12) {
      baseEv = 1.0 + ((alt + 12) / 6) * 3.0;
      label = 'Nautisk tusmørke';
    } else {
      baseEv = -2.0;
      label = 'Nat / Stjernehimmel';
    }

    // Skydække-reduktion (op til -2.5 stops ved 100% tunge skyer i dagslys)
    const cloudPenalty = alt > -4 ? (clouds / 100) * 2.5 : (clouds / 100) * 1.0;
    const finalEv = Math.round((baseEv - cloudPenalty) * 2) / 2;

    if (clouds > 75 && alt > 0) {
      label += ` • Overskyet (${clouds}%)`;
    } else if (clouds > 35 && alt > 0) {
      label += ` • Let skyet (${clouds}%)`;
    }

    return {
      ev100: finalEv,
      label,
      sunAltitude: alt,
      cloudCoverPct: clouds
    };
  }

  public static subscribeAmbientEv(listener: AmbientEvListener): () => void {
    this.ambientListeners.add(listener);
    return () => this.ambientListeners.delete(listener);
  }

  public static broadcastAmbientEv(): void {
    const est = this.getAmbientLightEstimate();
    this.ambientListeners.forEach((l) => {
      try {
        l(est, this.autoEvEnabled);
      } catch (e) {
        console.error('Fejl i AmbientEv listener:', e);
      }
    });
  }

  // ================= OPTIK SYNKRONISERING (DOF <-> EKSPONERING) =================

  public static emitOpticsSync(payload: OpticsSyncPayload): void {
    this.opticsListeners.forEach((l) => {
      try {
        l(payload);
      } catch (e) {
        console.error('Fejl i OpticsSync listener:', e);
      }
    });
  }

  public static subscribeOpticsSync(listener: OpticsListener): () => void {
    this.opticsListeners.add(listener);
    return () => this.opticsListeners.delete(listener);
  }
}
