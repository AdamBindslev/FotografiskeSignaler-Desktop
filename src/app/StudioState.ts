/**
 * StudioState.ts - Samlet fysisk, astronomisk, meteorologisk og optisk motor
 * for Fotografiske Signaler – Desktop Studio ("Studio Canvas & Inspector").
 *
 * I stedet for 4 adskilte moduler (Vejr, Sol, DOF, Eksponering) arbejder hele
 * desktop-applikationen ud fra én samlet, reaktiv tilstand:
 *  - Lokation (Kamera-pin) + Motiv-position (Motiv-pin: afstand i meter + sigtelinje i grader)
 *  - Dato & Klokkeslæt + 7-døgns Open-Meteo Vejrudsigt & Fotovinduer
 *  - Kamera & Optik (Sensorformat, Brændvidde, Blænde, Fokusafstand, Lukkertid, ISO, IBIS, ND-filtre)
 *  - Live beregnede resultater (Sol/Måne/Skygge, FOV-vinkel, Dybdeskarphed Dn/Df/H, EV, Histogram, ND-tid)
 */

import { AstroCore, SunPosition, SunTimes, ShadowCalculation, MoonPosition, MoonIllumination, MoonTimes } from '../shared/astronomy/AstroCore.ts';
import { LocationService, GeoLocation } from '../shared/services/LocationService.ts';
import { TimeService } from '../shared/services/TimeService.ts';
import { DofEngine, DofResult, SENSOR_PRESETS } from '../modules/dof/calculations/dof-engine.ts';
import {
  ExposureEngine,
  STANDARD_APERTURES,
  STANDARD_SHUTTERS,
  STANDARD_ISOS,
  STANDARD_ND_FILTERS
} from '../modules/exposure/calculations/exposure-engine.ts';
import { WeatherEngine, DayForecast } from '../modules/weather/calculations/weather-engine.ts';

export type CanvasViewMode = 'map' | '3d' | 'evf' | 'split';

export interface StudioSnapshot {
  // Visning
  canvasView: CanvasViewMode;

  // Geografi & Motiv-geometri
  location: GeoLocation;
  cameraAzimuthDeg: number;     // Retning kameraet peger mod motivet (0-360°)
  subjectDistanceM: number;     // Afstand fra kamera til motiv i meter (= fokusafstand)
  subjectType: 'person' | 'tree' | 'building' | 'custom';
  subjectHeightM: number;

  // Tid & Astronomi
  date: Date;
  sunPos: SunPosition;
  sunTimes: SunTimes;
  shadow: ShadowCalculation;
  kelvin: { kelvin: number; label: string };
  moonPos: MoonPosition;
  moonIllum: MoonIllumination;
  moonTimes: MoonTimes;

  // Vejr (7 dage + valgt dag)
  days: DayForecast[];
  selectedDayIndex: number;
  selectedDay: DayForecast | null;
  currentHourWeather: {
    cloudTotal: number;
    temp: number;
    windSpeed: number;
    humidity: number;
    visibilityKm: number;
    weatherIcon: string;
    weatherDesc: string;
  };
  isLoadingWeather: boolean;

  // Samlet Kamera, Optik & Eksponering
  sensorId: string;
  focalLengthMm: number;
  aperture: number;
  shutter: number;
  iso: number;
  ibisStops: number;
  autoEvFromSky: boolean;       // Når aktiv, låses EV-målet til solhøjde + skydække
  evLocked: boolean;
  lockedTargetEv: number;
  selectedNdIds: string[];

  // Beregnede Optiske & Eksponerings-resultater
  dof: DofResult;
  horizontalFovDeg: number;     // Horisontal billedvinkel på kortet i grader
  fovWidthAtSubjectM: number;   // Bredde af billedfeltet ved motivafstanden i meter
  ambientSkyEv100: number;
  ambientSkyLabel: string;
  cameraEv100: number;
  cameraEvIso: number;
  targetEv: number;
  deltaEv: number;
  handheldSafeShutter: string;
  astro500Shutter: string;
  ndTotalStops: number;
  ndResultShutterSec: number;
  ndResultDisplay: string;
}

type StudioListener = (snap: StudioSnapshot) => void;

const STUDIO_STORAGE_KEY = 'fs_studio_state_v2';

export class StudioState {
  private static canvasView: CanvasViewMode = 'split';
  private static cameraAzimuthDeg: number = 135; // SØ som standard sigtelinje
  private static subjectDistanceM: number = 12.0;
  private static subjectType: 'person' | 'tree' | 'building' | 'custom' = 'person';
  private static subjectHeightM: number = 1.75;

  private static sensorId: string = 'full_frame';
  private static focalLengthMm: number = 35;
  private static aperture: number = 5.6;
  private static shutter: number = 1 / 125;
  private static iso: number = 100;
  private static ibisStops: number = 3;
  private static autoEvFromSky: boolean = true;
  private static evLocked: boolean = true;
  private static lockedTargetEv: number = 12.0;
  private static selectedNdIds: string[] = [];

  private static days: DayForecast[] = [];
  private static selectedDayIndex: number = 0;
  private static isLoadingWeather: boolean = false;

  private static listeners: Set<StudioListener> = new Set();
  private static initialized = false;

  public static async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    this.loadPersisted();

    LocationService.subscribe(async () => {
      await this.fetchWeatherForCurrentLocation(false);
      this.recalculateAndNotify();
    });

    TimeService.subscribe((d) => {
      this.syncSelectedDayFromDate(d);
      this.recalculateAndNotify();
    });

    await this.fetchWeatherForCurrentLocation(false);
    this.recalculateAndNotify();
  }

  private static loadPersisted(): void {
    try {
      const raw = localStorage.getItem(STUDIO_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.canvasView) this.canvasView = p.canvasView;
        if (typeof p.cameraAzimuthDeg === 'number') this.cameraAzimuthDeg = p.cameraAzimuthDeg;
        if (typeof p.subjectDistanceM === 'number') this.subjectDistanceM = p.subjectDistanceM;
        if (p.subjectType) this.subjectType = p.subjectType;
        if (typeof p.subjectHeightM === 'number') this.subjectHeightM = p.subjectHeightM;
        if (p.sensorId && SENSOR_PRESETS[p.sensorId]) this.sensorId = p.sensorId;
        if (typeof p.focalLengthMm === 'number') this.focalLengthMm = p.focalLengthMm;
        if (typeof p.aperture === 'number') this.aperture = p.aperture;
        if (typeof p.shutter === 'number') this.shutter = p.shutter;
        if (typeof p.iso === 'number') this.iso = p.iso;
        if (typeof p.ibisStops === 'number') this.ibisStops = p.ibisStops;
        if (typeof p.autoEvFromSky === 'boolean') this.autoEvFromSky = p.autoEvFromSky;
        if (Array.isArray(p.selectedNdIds)) this.selectedNdIds = p.selectedNdIds;
      }
    } catch {
      // Brug standardværdier
    }
  }

  private static savePersisted(): void {
    try {
      localStorage.setItem(
        STUDIO_STORAGE_KEY,
        JSON.stringify({
          canvasView: this.canvasView,
          cameraAzimuthDeg: this.cameraAzimuthDeg,
          subjectDistanceM: this.subjectDistanceM,
          subjectType: this.subjectType,
          subjectHeightM: this.subjectHeightM,
          sensorId: this.sensorId,
          focalLengthMm: this.focalLengthMm,
          aperture: this.aperture,
          shutter: this.shutter,
          iso: this.iso,
          ibisStops: this.ibisStops,
          autoEvFromSky: this.autoEvFromSky,
          selectedNdIds: this.selectedNdIds
        })
      );
    } catch {
      // Ignorer storage fejl
    }
  }

  public static subscribe(listener: StudioListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ==================== MUTATORS ====================

  public static setCanvasView(view: CanvasViewMode): void {
    this.canvasView = view;
    this.savePersisted();
    this.recalculateAndNotify();
  }

  /**
   * Opdateres når brugeren flytter Motiv-pin på kortet eller ændrer fokusafstand/sigtevinkel
   */
  public static setTargetVector(distanceM: number, azimuthDeg?: number): void {
    this.subjectDistanceM = Math.max(0.2, Math.min(5000, Number(distanceM.toFixed(2))));
    if (typeof azimuthDeg === 'number' && !isNaN(azimuthDeg)) {
      this.cameraAzimuthDeg = ((Math.round(azimuthDeg) % 360) + 360) % 360;
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setSubjectModel(type: 'person' | 'tree' | 'building' | 'custom', heightM?: number): void {
    this.subjectType = type;
    if (typeof heightM === 'number' && heightM > 0) {
      this.subjectHeightM = heightM;
    } else if (type === 'person') {
      this.subjectHeightM = 1.75;
    } else if (type === 'tree') {
      this.subjectHeightM = 5.0;
    } else if (type === 'building') {
      this.subjectHeightM = 12.0;
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setSensor(sensorId: string): void {
    if (SENSOR_PRESETS[sensorId]) {
      this.sensorId = sensorId;
      this.savePersisted();
      this.recalculateAndNotify();
    }
  }

  public static setFocalLength(mm: number): void {
    this.focalLengthMm = Math.max(10, Math.min(600, Math.round(mm)));
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setAperture(fStop: number): void {
    this.aperture = ExposureEngine.findClosestValue(fStop, STANDARD_APERTURES);
    if (this.autoEvFromSky || this.evLocked) {
      const targetEv = this.autoEvFromSky ? this.computeCurrentAmbientEv().ev100 : this.lockedTargetEv;
      const solvedS = ExposureEngine.solveShutter(this.aperture, this.iso, targetEv);
      this.shutter = ExposureEngine.findClosestValue(solvedS, STANDARD_SHUTTERS);
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setShutter(seconds: number): void {
    this.shutter = ExposureEngine.findClosestValue(seconds, STANDARD_SHUTTERS);
    if (this.autoEvFromSky || this.evLocked) {
      const targetEv = this.autoEvFromSky ? this.computeCurrentAmbientEv().ev100 : this.lockedTargetEv;
      const solvedA = ExposureEngine.solveAperture(this.shutter, this.iso, targetEv);
      this.aperture = ExposureEngine.findClosestValue(solvedA, STANDARD_APERTURES);
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setIso(isoVal: number): void {
    this.iso = ExposureEngine.findClosestValue(isoVal, STANDARD_ISOS);
    if (this.autoEvFromSky || this.evLocked) {
      const targetEv = this.autoEvFromSky ? this.computeCurrentAmbientEv().ev100 : this.lockedTargetEv;
      const solvedS = ExposureEngine.solveShutter(this.aperture, this.iso, targetEv);
      this.shutter = ExposureEngine.findClosestValue(solvedS, STANDARD_SHUTTERS);
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setIbisStops(stops: number): void {
    this.ibisStops = Math.max(0, Math.min(6, stops));
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setAutoEvFromSky(enabled: boolean): void {
    this.autoEvFromSky = enabled;
    if (enabled) {
      this.evLocked = true;
    } else {
      this.lockedTargetEv = ExposureEngine.calculateEV(this.aperture, this.shutter, this.iso);
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static toggleEvLock(): void {
    if (this.autoEvFromSky) {
      this.autoEvFromSky = false;
      this.evLocked = false;
    } else {
      this.evLocked = !this.evLocked;
      if (this.evLocked) {
        this.lockedTargetEv = ExposureEngine.calculateEV(this.aperture, this.shutter, this.iso);
      }
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static setFocusToHyperfocal(): void {
    const dof = DofEngine.calculateDOF({
      sensor: this.sensorId,
      focalLength: this.focalLengthMm,
      aperture: this.aperture,
      distance: this.subjectDistanceM
    });
    this.subjectDistanceM = Math.max(0.3, Math.min(2000, Number(dof.hyperfocalM.toFixed(2))));
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static toggleNdFilter(ndId: string): void {
    const idx = this.selectedNdIds.indexOf(ndId);
    if (idx >= 0) {
      this.selectedNdIds.splice(idx, 1);
    } else {
      this.selectedNdIds.push(ndId);
    }
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static clearNdFilters(): void {
    this.selectedNdIds = [];
    this.savePersisted();
    this.recalculateAndNotify();
  }

  public static selectDayIndex(idx: number): void {
    this.selectedDayIndex = Math.max(0, Math.min(6, idx));
    const day = this.days[this.selectedDayIndex];
    if (day) {
      const cur = TimeService.getDate();
      const next = new Date(day.date);
      next.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
      TimeService.setDate(next);
    } else {
      this.recalculateAndNotify();
    }
  }

  public static async refreshWeather(): Promise<void> {
    await this.fetchWeatherForCurrentLocation(true);
    this.recalculateAndNotify();
  }

  // ==================== INTERNE BEREGNINGER ====================

  private static syncSelectedDayFromDate(d: Date): void {
    if (this.days.length === 0) return;
    const idx = this.days.findIndex(
      (day) =>
        day.date.getFullYear() === d.getFullYear() &&
        day.date.getMonth() === d.getMonth() &&
        day.date.getDate() === d.getDate()
    );
    if (idx !== -1) {
      this.selectedDayIndex = idx;
    }
  }

  private static async fetchWeatherForCurrentLocation(force: boolean): Promise<void> {
    if (this.isLoadingWeather) return;
    this.isLoadingWeather = true;
    const loc = LocationService.getLocation();

    try {
      const res = await WeatherEngine.fetchForecast(loc.lat, loc.lng, force);
      const parsed: DayForecast[] = [];
      for (let i = 0; i < 7; i++) {
        const d = WeatherEngine.parseDayData(res.forecast, i, loc.lat, loc.lng);
        if (d) parsed.push(d);
      }
      this.days = parsed;
      this.syncSelectedDayFromDate(TimeService.getDate());
    } catch (err) {
      console.warn('Kunne ikke hente vejrdata:', err);
    } finally {
      this.isLoadingWeather = false;
    }
  }

  private static computeCurrentAmbientEv(): { ev100: number; label: string; cloudTotal: number } {
    const loc = LocationService.getLocation();
    const date = TimeService.getDate();
    const sunPos = AstroCore.getSunPosition(date, loc.lat, loc.lng);
    const alt = sunPos.altitude;

    const selDay = this.days[this.selectedDayIndex] || null;
    const hourEntry = selDay?.hourly?.find((h) => h.hour === date.getHours());
    const clouds = hourEntry ? hourEntry.cloudTotal : 25;

    let baseEv = 15;
    let label = 'Fuldt dagslys';

    if (alt >= 30) {
      baseEv = 15.0;
      label = 'Høj sol (Sunny 16)';
    } else if (alt >= 15) {
      baseEv = 14.0 + (alt - 15) / 15;
      label = 'Moderat sol';
    } else if (alt >= 6) {
      baseEv = 12.5 + ((alt - 6) / 9) * 1.5;
      label = 'Lav sol';
    } else if (alt >= 0) {
      baseEv = 9.5 + (alt / 6) * 3.0;
      label = 'Gylden time';
    } else if (alt >= -4) {
      baseEv = 6.0 + ((alt + 4) / 4) * 3.5;
      label = 'Blå time';
    } else if (alt >= -6) {
      baseEv = 4.0 + ((alt + 6) / 2) * 2.0;
      label = 'Sen blå time';
    } else if (alt >= -12) {
      baseEv = 1.0 + ((alt + 12) / 6) * 3.0;
      label = 'Tusmørke';
    } else {
      baseEv = -2.0;
      label = 'Nattehimmel';
    }

    const penalty = alt > -4 ? (clouds / 100) * 2.5 : (clouds / 100) * 1.0;
    const ev100 = Math.round((baseEv - penalty) * 2) / 2;

    return { ev100, label, cloudTotal: clouds };
  }

  public static getSnapshot(): StudioSnapshot {
    const loc = LocationService.getLocation();
    const date = TimeService.getDate();

    const sunPos = AstroCore.getSunPosition(date, loc.lat, loc.lng);
    const sunTimes = AstroCore.getSunTimes(date, loc.lat, loc.lng);
    const shadow = AstroCore.calculateShadow(sunPos.altitude, sunPos.azimuth, this.subjectHeightM);
    const kelvin = AstroCore.getEstimatedKelvin(sunPos.altitude);
    const moonPos = AstroCore.getMoonPosition(date, loc.lat, loc.lng);
    const moonIllum = AstroCore.getMoonIllumination(date);
    const moonTimes = AstroCore.getMoonTimes(date, loc.lat, loc.lng);

    const selectedDay = this.days[this.selectedDayIndex] || null;
    const hMatch = selectedDay?.hourly?.find((h) => h.hour === date.getHours()) || selectedDay?.hourly?.[12];

    const currentHourWeather = {
      cloudTotal: hMatch ? hMatch.cloudTotal : 25,
      temp: hMatch ? Math.round(hMatch.temp) : 12,
      windSpeed: hMatch ? Number(hMatch.windSpeed.toFixed(1)) : 3.5,
      humidity: hMatch ? hMatch.humidity : 75,
      visibilityKm: hMatch ? Number((hMatch.visibility / 1000).toFixed(1)) : 20,
      weatherIcon: hMatch ? hMatch.weatherIcon : '🌤️',
      weatherDesc: hMatch ? hMatch.weatherDesc : 'Klar luft'
    };

    const dof = DofEngine.calculateDOF({
      sensor: this.sensorId,
      focalLength: this.focalLengthMm,
      aperture: this.aperture,
      distance: this.subjectDistanceM
    });

    // Horisontal FOV-vinkel = 2 * atan(sensorWidth / (2 * focalLength))
    const fovRad = 2 * Math.atan(dof.sensor.width / (2 * this.focalLengthMm));
    const horizontalFovDeg = (fovRad * 180) / Math.PI;
    const fovWidthAtSubjectM = 2 * this.subjectDistanceM * Math.tan(fovRad / 2);

    const sky = this.computeCurrentAmbientEv();

    // Hvis Auto-EV fra himmel er slået til, tilpasses lukkertiden (og evt. ISO om natten) automatisk
    if (this.autoEvFromSky) {
      if (sky.ev100 <= 1 && this.iso < 1600) this.iso = 1600;
      else if (sky.ev100 <= 6 && this.iso < 400) this.iso = 400;
      else if (sky.ev100 >= 12 && this.iso > 400) this.iso = 100;

      const idealShutter = ExposureEngine.solveShutter(this.aperture, this.iso, sky.ev100);
      this.shutter = ExposureEngine.findClosestValue(idealShutter, STANDARD_SHUTTERS);
      this.lockedTargetEv = sky.ev100;
    }

    const cameraEv100 = ExposureEngine.calculateEV100(this.aperture, this.shutter);
    const cameraEvIso = ExposureEngine.calculateEV(this.aperture, this.shutter, this.iso);
    const targetEv = this.autoEvFromSky ? sky.ev100 : this.evLocked ? this.lockedTargetEv : cameraEvIso;
    const deltaEv = ExposureEngine.calculateMeterDelta(this.aperture, this.shutter, this.iso, targetEv);

    const handheld = ExposureEngine.calculateHandheldShutter(this.focalLengthMm, dof.sensor.cropFactor, this.ibisStops);
    const astro = ExposureEngine.calculateAstroShutter(this.focalLengthMm, dof.sensor.cropFactor);

    let ndTotalStops = 0;
    for (const id of this.selectedNdIds) {
      const f = STANDARD_ND_FILTERS.find((item) => item.id === id);
      if (f) ndTotalStops += f.stops;
    }
    const ndCalc = ExposureEngine.calculateNdExposure(this.shutter, ndTotalStops);

    return {
      canvasView: this.canvasView,
      location: loc,
      cameraAzimuthDeg: this.cameraAzimuthDeg,
      subjectDistanceM: this.subjectDistanceM,
      subjectType: this.subjectType,
      subjectHeightM: this.subjectHeightM,
      date,
      sunPos,
      sunTimes,
      shadow,
      kelvin,
      moonPos,
      moonIllum,
      moonTimes,
      days: this.days,
      selectedDayIndex: this.selectedDayIndex,
      selectedDay,
      currentHourWeather,
      isLoadingWeather: this.isLoadingWeather,
      sensorId: this.sensorId,
      focalLengthMm: this.focalLengthMm,
      aperture: this.aperture,
      shutter: this.shutter,
      iso: this.iso,
      ibisStops: this.ibisStops,
      autoEvFromSky: this.autoEvFromSky,
      evLocked: this.evLocked,
      lockedTargetEv: this.lockedTargetEv,
      selectedNdIds: [...this.selectedNdIds],
      dof,
      horizontalFovDeg,
      fovWidthAtSubjectM,
      ambientSkyEv100: sky.ev100,
      ambientSkyLabel: sky.label,
      cameraEv100,
      cameraEvIso,
      targetEv,
      deltaEv,
      handheldSafeShutter: handheld.displayStabilized,
      astro500Shutter: astro.display500,
      ndTotalStops,
      ndResultShutterSec: ndCalc.newShutter,
      ndResultDisplay: ndCalc.displayTime
    };
  }

  public static recalculateAndNotify(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((l) => {
      try {
        l(snap);
      } catch (e) {
        console.error('Fejl i StudioState listener:', e);
      }
    });
  }
}
