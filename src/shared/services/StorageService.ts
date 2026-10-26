/**
 * StorageService.ts - Sikker centraliseret lokal lagring for Fotografiske Signaler (§11)
 */

export interface AppSettings {
  nightMode: boolean;
  units: 'metric' | 'imperial';
  lastModule: string;
  version: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  nightMode: false,
  units: 'metric',
  lastModule: 'home',
  version: 1
};

const SETTINGS_KEY = 'fs_app_settings_v1';
const RECENT_LOCATIONS_KEY = 'fs_recent_locations_v1';

export class StorageService {
  public static getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Fejl under læsning af indstillinger fra localStorage:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Fejl under gemning af indstillinger i localStorage:', e);
    }
    return updated;
  }

  public static getItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch (e) {
      console.warn(`Fejl ved læsning af ${key}:`, e);
    }
    return defaultValue;
  }

  public static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Fejl ved lagring af ${key}:`, e);
    }
  }

  public static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Fejl ved sletning af ${key}:`, e);
    }
  }
}
