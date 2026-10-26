/**
 * exposure-engine.ts - Fysiske og fotografiske eksponeringsberegninger
 * Beregner Eksponeringstrekanten (EV, blænde, lukker, ISO), gensidighedsloven,
 * håndholdt rysteregler, astro-lukkertider, ND-filterreduktion og langtidseksponering.
 */

export interface NdFilterDef {
  id: string;
  name: string;
  stops: number;
  ndFactor: number;
  opticalDensity: number;
  description: string;
}

export const STANDARD_ND_FILTERS: NdFilterDef[] = [
  { id: 'nd2', name: 'ND2', stops: 1, ndFactor: 2, opticalDensity: 0.3, description: '1 stop (Let lysdæmpning)' },
  { id: 'cpl', name: 'CPL Polfilter', stops: 1.5, ndFactor: 2.8, opticalDensity: 0.45, description: '~1.5 stops (Refleksioner)' },
  { id: 'nd4', name: 'ND4', stops: 2, ndFactor: 4, opticalDensity: 0.6, description: '2 stops (Mellem)' },
  { id: 'nd8', name: 'ND8', stops: 3, ndFactor: 8, opticalDensity: 0.9, description: '3 stops (Klassisk video/portræt)' },
  { id: 'nd16', name: 'ND16', stops: 4, ndFactor: 16, opticalDensity: 1.2, description: '4 stops (Solskin portræt)' },
  { id: 'nd32', name: 'ND32', stops: 5, ndFactor: 32, opticalDensity: 1.5, description: '5 stops' },
  { id: 'nd64', name: 'ND64', stops: 6, ndFactor: 64, opticalDensity: 1.8, description: '6 stops (Vandfald & bevægelse)' },
  { id: 'nd128', name: 'ND128', stops: 7, ndFactor: 128, opticalDensity: 2.1, description: '7 stops' },
  { id: 'nd256', name: 'ND256', stops: 8, ndFactor: 256, opticalDensity: 2.4, description: '8 stops' },
  { id: 'nd512', name: 'ND512', stops: 9, ndFactor: 512, opticalDensity: 2.7, description: '9 stops' },
  { id: 'nd1000', name: 'ND1000', stops: 10, ndFactor: 1024, opticalDensity: 3.0, description: '10 stops (Big Stopper / Silkevand)' },
  { id: 'nd2000', name: 'ND2000', stops: 11, ndFactor: 2048, opticalDensity: 3.3, description: '11 stops' },
  { id: 'nd4000', name: 'ND4000', stops: 12, ndFactor: 4096, opticalDensity: 3.6, description: '12 stops' },
  { id: 'nd32000', name: 'ND32000', stops: 15, ndFactor: 32768, opticalDensity: 4.5, description: '15 stops (Super Stopper)' },
  { id: 'nd65000', name: 'ND65000', stops: 16, ndFactor: 65536, opticalDensity: 4.8, description: '16 stops' },
  { id: 'nd1000000', name: 'ND1000000', stops: 20, ndFactor: 1048576, opticalDensity: 6.0, description: '20 stops (Solfotografering)' }
];

// Sorteret efter lysmængde (fra mørkest f/32 til lysest f/1.0, så højre altid er mere lys):
export const STANDARD_APERTURES = [
  32.0, 22.0, 20.0, 18.0, 16.0, 14.0, 13.0, 11.0, 10.0, 9.0, 8.0, 7.1, 6.3, 5.6,
  5.0, 4.5, 4.0, 3.5, 3.2, 2.8, 2.5, 2.2, 2.0, 1.8, 1.4, 1.2, 1.0
];

export const FULL_STOP_APERTURES = [22.0, 16.0, 11.0, 8.0, 5.6, 4.0, 2.8, 2.0, 1.4, 1.0];

export const STANDARD_SHUTTERS = [
  1 / 8000, 1 / 6400, 1 / 5000, 1 / 4000, 1 / 3200, 1 / 2500, 1 / 2000,
  1 / 1600, 1 / 1250, 1 / 1000, 1 / 800, 1 / 640, 1 / 500, 1 / 400,
  1 / 320, 1 / 250, 1 / 200, 1 / 160, 1 / 125, 1 / 100, 1 / 80, 1 / 60,
  1 / 50, 1 / 40, 1 / 30, 1 / 25, 1 / 20, 1 / 15, 1 / 13, 1 / 10,
  1 / 8, 1 / 6, 1 / 5, 1 / 4, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.3, 1.6,
  2, 2.5, 3.2, 4, 5, 6, 8, 10, 13, 15, 20, 25, 30
];

export const STANDARD_ISOS = [
  50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800,
  1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000,
  12800, 25600, 51200
];

export interface ShutterScenario {
  id: string;
  category: 'action' | 'creative' | 'handheld' | 'astro';
  title: string;
  recommendedRange: string;
  minShutter: number; // seconds
  maxShutter: number; // seconds
  description: string;
  tip: string;
}

export const SHUTTER_SCENARIOS: ShutterScenario[] = [
  {
    id: 'birds_flight',
    category: 'action',
    title: '🦅 Flyvende fugle & hurtig vildt',
    recommendedRange: '1/2000s – 1/4000s',
    minShutter: 1 / 4000,
    maxShutter: 1 / 2000,
    description: 'Fryser lynhurtige vingeslag og dråber kastes fra vinger.',
    tip: 'Brug blænde f/4 eller f/5.6 og lad Auto-ISO kompensere.'
  },
  {
    id: 'sports_action',
    category: 'action',
    title: '⚽ Sport, løb & action',
    recommendedRange: '1/1000s – 1/2000s',
    minShutter: 1 / 2000,
    maxShutter: 1 / 1000,
    description: 'Fryser intense bevægelser, bolde i luften og atleter.',
    tip: 'Hurtig serieoptagelse og kontinuerlig autofokus (AF-C).'
  },
  {
    id: 'children_pets',
    category: 'action',
    title: '🐕 Børn & kæledyr i leg',
    recommendedRange: '1/500s – 1/1000s',
    minShutter: 1 / 1000,
    maxShutter: 1 / 500,
    description: 'Undgår bevægelsesuskarphed ved uforudsigelig leg.',
    tip: 'Vær i øjenhøjde med motivet for den bedste dynamik.'
  },
  {
    id: 'street_walking',
    category: 'creative',
    title: '🚶 Gadefoto & gående personer',
    recommendedRange: '1/250s – 1/500s',
    minShutter: 1 / 500,
    maxShutter: 1 / 250,
    description: 'Fryser almindelig gang og byliv skarpt.',
    tip: 'Glimrende zonefokus-hastighed ved f/5.6 eller f/8.'
  },
  {
    id: 'portrait_handheld',
    category: 'handheld',
    title: '👤 Stillestående portræt',
    recommendedRange: '1/125s – 1/250s',
    minShutter: 1 / 250,
    maxShutter: 1 / 125,
    description: 'Sikrer mod små mikrobevægelser og øjenblink.',
    tip: 'Kombinér med stor blænde (f/1.4 - f/2.8) for blød bokeh.'
  },
  {
    id: 'water_texture',
    category: 'creative',
    title: '🌊 Vandfald med tekstur & liv',
    recommendedRange: '1/8s – 1/2s',
    minShutter: 0.125,
    maxShutter: 0.5,
    description: 'Bevarer vandets kraft og skumdråber med let slør.',
    tip: 'Kræver stativ eller særdeles effektiv billedstabilisering.'
  },
  {
    id: 'silky_water',
    category: 'creative',
    title: '✨ Silkeblødt hav & kystbølger',
    recommendedRange: '2s – 15s',
    minShutter: 2,
    maxShutter: 15,
    description: 'Udjævner bølger til et drømmende slør omkring klipper.',
    tip: 'Typisk oplagt med ND64 (6-stop) eller ND1000 (10-stop) filter.'
  },
  {
    id: 'stretched_clouds',
    category: 'creative',
    title: '☁️ Strøgne skyer & spejlblankt vand',
    recommendedRange: '30s – 4 min',
    minShutter: 30,
    maxShutter: 240,
    description: 'Total udglatning af vandoverflader og maleriske skytræk.',
    tip: 'Brug kameraets Bulb-tilstand og appens indbyggede timer.'
  },
  {
    id: 'light_trails',
    category: 'creative',
    title: '🚗 Biltrafik lysstriber i mørke',
    recommendedRange: '10s – 30s',
    minShutter: 10,
    maxShutter: 30,
    description: 'Forvandler forlygter og baglygter til ubrudte lysbånd.',
    tip: 'Blænde f/8-f/11 skaber flotte stjerneeffekter (starburst) på gadelamper.'
  }
];

export interface TriangleState {
  aperture: number;
  shutter: number;
  iso: number;
  evLock: boolean;
  lockedEv: number;
}

export class ExposureEngine {
  /**
   * Beregner standard EV ved ISO 100: EV100 = log2(N^2 / t)
   */
  public static calculateEV100(aperture: number, shutter: number): number {
    if (aperture <= 0 || shutter <= 0) return 0;
    return Math.log2((aperture * aperture) / shutter);
  }

  /**
   * Beregner aktuel EV for vilkårlig ISO:
   * EV_S = EV100 - log2(ISO / 100) = log2(N^2 / t) - log2(ISO / 100)
   */
  public static calculateEV(aperture: number, shutter: number, iso: number): number {
    const ev100 = this.calculateEV100(aperture, shutter);
    const isoStops = Math.log2(Math.max(1, iso) / 100);
    return ev100 - isoStops;
  }

  /**
   * Beregner relativ lysmåler-afvigelse (-3 til +3 EV) i forhold til målværdi.
   * Hvis indstillingerne lukker mere lys ind end målet, er delta positiv (overeksponeret).
   */
  public static calculateMeterDelta(
    aperture: number,
    shutter: number,
    iso: number,
    targetEv: number
  ): number {
    const currentEv = this.calculateEV(aperture, shutter, iso);
    // Højere EV = mørkere/kræver mere lys.
    // Hvis currentEv er lavere end targetEv, lukker vi mere lys ind end scenen kræver -> overeksponering (+)
    const delta = targetEv - currentEv;
    return Math.max(-3, Math.min(3, delta));
  }

  /**
   * Beregner stop-forskel i blænde (positiv = mere lys / større åbning)
   */
  public static calculateApertureStopsDiff(baseAperture: number, currentAperture: number): number {
    if (baseAperture <= 0 || currentAperture <= 0) return 0;
    return 2 * Math.log2(baseAperture / currentAperture);
  }

  /**
   * Beregner stop-forskel i lukkertid (positiv = mere lys / længere tid)
   */
  public static calculateShutterStopsDiff(baseShutter: number, currentShutter: number): number {
    if (baseShutter <= 0 || currentShutter <= 0) return 0;
    return Math.log2(currentShutter / baseShutter);
  }

  /**
   * Beregner stop-forskel i ISO (positiv = mere lysfølsomhed / højere ISO)
   */
  public static calculateIsoStopsDiff(baseIso: number, currentIso: number): number {
    if (baseIso <= 0 || currentIso <= 0) return 0;
    return Math.log2(currentIso / baseIso);
  }

  /**
   * Formaterer stop-forskel pædagogisk med fortegn
   */
  public static formatStopsDiff(stops: number): string {
    if (Math.abs(stops) < 0.15) return '0 stops (uændret)';
    const sign = stops > 0 ? '+' : '';
    const rounded = Math.round(stops * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
    return `${sign}${text} stops`;
  }

  /**
   * Løser lukkertid givet blænde, ISO og målt EV
   * t = (N^2 / 2^EV100) * (100 / ISO)
   */
  public static solveShutter(aperture: number, iso: number, targetEv: number): number {
    // targetEv = log2(N^2 / t) - log2(iso / 100)
    // log2(N^2 / t) = targetEv + log2(iso / 100)
    // N^2 / t = 2^(targetEv + log2(iso / 100)) = 2^targetEv * (iso / 100)
    // t = N^2 / (2^targetEv * (iso / 100))
    const denominator = Math.pow(2, targetEv) * (iso / 100);
    if (denominator <= 0) return 1 / 125;
    return (aperture * aperture) / denominator;
  }

  /**
   * Løser blænde givet lukkertid, ISO og målt EV
   * N = sqrt(t * 2^targetEv * (ISO / 100))
   */
  public static solveAperture(shutter: number, iso: number, targetEv: number): number {
    const val = shutter * Math.pow(2, targetEv) * (iso / 100);
    if (val <= 0) return 2.8;
    return Math.sqrt(val);
  }

  /**
   * Løser ISO givet blænde, lukkertid og målt EV
   * ISO = 100 * (N^2 / (t * 2^targetEv))
   */
  public static solveIso(aperture: number, shutter: number, targetEv: number): number {
    const num = aperture * aperture;
    const den = shutter * Math.pow(2, targetEv);
    if (den <= 0) return 100;
    return 100 * (num / den);
  }

  /**
   * Finder den nærmeste fotografiske standardværdi i et array
   */
  public static findClosestValue(val: number, standardArray: number[]): number {
    let closest = standardArray[0];
    let minDiff = Math.abs(val - closest);
    for (const v of standardArray) {
      const diff = Math.abs(val - v);
      if (diff < minDiff) {
        minDiff = diff;
        closest = v;
      }
    }
    return closest;
  }

  /**
   * Sikker håndholdt lukkertid ifølge den reciprokke regel:
   * t_safe = 1 / (focalLength * cropFactor * 2^ibisStops)
   */
  public static calculateHandheldShutter(
    focalLengthMm: number,
    cropFactor: number = 1.0,
    ibisStops: number = 0
  ): {
    baseSafeShutter: number;
    stabilizedSafeShutter: number;
    displayBase: string;
    displayStabilized: string;
    description: string;
  } {
    const effectiveFocal = Math.max(10, focalLengthMm * cropFactor);
    const baseSafe = 1 / effectiveFocal;
    // Billedstabilisering forlænger den sikre eksponeringstid med 2^ibisStops
    const factor = Math.pow(2, Math.max(0, ibisStops));
    const stabilizedSafe = baseSafe * factor;

    return {
      baseSafeShutter: baseSafe,
      stabilizedSafeShutter: stabilizedSafe,
      displayBase: this.formatShutterSpeed(baseSafe),
      displayStabilized: this.formatShutterSpeed(stabilizedSafe),
      description: ibisStops > 0
        ? `Uden stabilisering: ${this.formatShutterSpeed(baseSafe)}. Med ${ibisStops} stops stabilisering kan du håndholde ned til ca. ${this.formatShutterSpeed(stabilizedSafe)}.`
        : `Minimum ca. ${this.formatShutterSpeed(baseSafe)} håndholdt for at undgå rystelser med ${focalLengthMm}mm optik.`
    };
  }

  /**
   * Astro 500-reglen (og den nyere 300-regel til højtaler/højopløste sensorer):
   * t = 500 / (brændvidde * cropfaktor)
   */
  public static calculateAstroShutter(
    focalLengthMm: number,
    cropFactor: number = 1.0
  ): {
    rule500: number;
    rule300: number;
    display500: string;
    display300: string;
    tip: string;
  } {
    const effectiveFocal = Math.max(10, focalLengthMm * cropFactor);
    const t500 = 500 / effectiveFocal;
    const t300 = 300 / effectiveFocal;

    return {
      rule500: t500,
      rule300: t300,
      display500: this.formatShutterSpeed(t500),
      display300: this.formatShutterSpeed(t300),
      tip: `Ved ${focalLengthMm}mm optik undgås stjernespor op til ${this.formatShutterSpeed(t500)} (500-reglen) eller ${this.formatShutterSpeed(t300)} (300-reglen til skarpe pixels).`
    };
  }

  /**
   * Beregner ny eksponeringstid med ND-filtre:
   * t_filtered = t_base * 2^totalStops
   */
  public static calculateNdExposure(
    baseShutter: number,
    totalStops: number
  ): {
    newShutter: number;
    factor: number;
    displayTime: string;
    opticalDensity: number;
    requiresBulb: boolean;
  } {
    const factor = Math.pow(2, Math.max(0, totalStops));
    const newShutter = baseShutter * factor;
    const od = totalStops * 0.30103;

    return {
      newShutter,
      factor,
      displayTime: this.formatShutterSpeed(newShutter),
      opticalDensity: Number(od.toFixed(2)),
      requiresBulb: newShutter > 30
    };
  }

  /**
   * Formaterer lukkertid pædagogisk på dansk
   */
  public static formatShutterSpeed(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0s';

    // Hurtigere end 0.5 sekund -> brøk (f.eks. 1/250s)
    if (seconds < 0.45) {
      const denominator = Math.round(1 / seconds);
      return `1/${denominator}s`;
    }

    // Mellem 0.45s og 2s -> 1 decimal
    if (seconds < 2) {
      return `${seconds.toFixed(1).replace('.', ',')}s`;
    }

    // Mellem 2s og 59s -> heltalssekunder
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }

    // Mellem 1 minut og 59 minutter
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const remSec = Math.round(seconds % 60);
      return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
    }

    // Over 1 time
    const hours = Math.floor(seconds / 3600);
    const remMins = Math.floor((seconds % 3600) / 60);
    const remSec = Math.round(seconds % 60);
    return `${hours}t ${remMins}m ${remSec}s`;
  }

  /**
   * Genererer en normaliseret histogramkurve for en given eksponerings-delta (-3 til +3 EV).
   * Returnerer SVG path koordinater (0-100 x, 0-50 y)
   */
  public static generateHistogramPath(deltaEv: number, width: number = 240, height: number = 70): string {
    // DeltaEv: 0 = center balanced, -3 = mørkt/venstretungt, +3 = lyst/højretungt
    // Center peak position (0-1)
    const normCenter = 0.5 + (deltaEv / 6);
    const peakX = Math.max(0.1, Math.min(0.9, normCenter)) * width;
    const stdDev = width * 0.18;

    const points: [number, number][] = [];
    const steps = 40;

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      // Gaussisk fordeling med lidt sekundære toner
      const diff = x - peakX;
      const gaussian = Math.exp(-(diff * diff) / (2 * stdDev * stdDev));
      // Lidt baseline støj/miljø
      const ambient = 0.08 * Math.sin((x / width) * Math.PI);
      const yVal = Math.min(1, gaussian * 0.9 + ambient);
      const y = height - (yVal * (height - 6));
      points.push([x, y]);
    }

    let path = `M 0,${height}`;
    for (const [x, y] of points) {
      path += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
    }
    path += ` L ${width},${height} Z`;
    return path;
  }
}
