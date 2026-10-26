/**
 * AstroCore.ts - Fælles astronomisk beregningskerne for Fotografiske Signaler
 * Forener sol-, måne-, tusmørke- og skyggeberegninger til Vejr og Sol.
 * Kører 100% offline uden eksterne afhængigheder.
 */

export interface SunPosition {
  azimuth: number;       // Kompasretning i grader (0° = N, 90° = Ø, 180° = S, 270° = V)
  altitude: number;      // Vinkel i grader over horisonten
}

export interface MoonPosition {
  azimuth: number;
  altitude: number;
}

export interface MoonIllumination {
  fraction: number;      // 0 - 100%
  phase: number;         // 0 - 1 (0: Nymåne, 0.25: Første kvarter, 0.5: Fuldmåne, 0.75: Sidste kvarter)
  name: string;          // Dansk navn
  icon: string;
}

export interface MoonTimes {
  rise: Date | null;
  set: Date | null;
}

export interface TimeRange {
  start: Date | null;
  end: Date | null;
}

export interface SunTimes {
  solarNoon: Date;
  nadir: Date;
  sunrise: Date | null;
  sunset: Date | null;
  sunriseEnd: Date | null;
  sunsetStart: Date | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  nauticalDawn: Date | null;
  nauticalDusk: Date | null;
  astronomicalDawn: Date | null;
  astronomicalDusk: Date | null;
  goldenHourMorning: TimeRange;
  goldenHourEvening: TimeRange;
  blueHourMorning: TimeRange;
  blueHourEvening: TimeRange;
  nightSky: TimeRange;
  [key: string]: any;
}

export interface LightPhase {
  id: string;
  name: string;
  badge: string;
  color: string;
}

export interface ShadowCalculation {
  hasDirectShadow: boolean;
  shadowLength: number;
  shadowRatio: number;
  shadowAzimuth: number;
  shadowCompass: string;
  objectHeight: number;
  lightPhase: LightPhase;
  description: string;
  cameraTip: string;
}

const PI = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const asin = Math.asin;
const atan2 = Math.atan2;
const acos = Math.acos;
const rad = PI / 180;
const deg = 180 / PI;

const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;

function toJulian(date: Date): number {
  return date.valueOf() / dayMs - 0.5 + J1970;
}

function fromJulian(j: number): Date {
  return new Date((j + 0.5 - J1970) * dayMs);
}

function toDays(date: Date): number {
  return toJulian(date) - J2000;
}

const e = rad * 23.4397; // Jordens hældning

function safeAcos(x: number): number {
  return acos(Math.max(-1, Math.min(1, x)));
}

function safeAsin(x: number): number {
  return asin(Math.max(-1, Math.min(1, x)));
}

function rightAscension(l: number, b: number): number {
  return atan2(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
}

function declination(l: number, b: number): number {
  return safeAsin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
}

function azimuth(H: number, phi: number, dec: number): number {
  return atan2(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
}

function altitude(H: number, phi: number, dec: number): number {
  return safeAsin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}

function siderealTime(d: number, lw: number): number {
  return rad * (280.16 + 360.9856235 * d) - lw;
}

function solarMeanAnomaly(d: number): number {
  return rad * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M: number): number {
  const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + PI;
}

function sunCoords(d: number): { dec: number; ra: number } {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return {
    dec: declination(L, 0),
    ra: rightAscension(L, 0)
  };
}

const J0 = 0.0009;

function julianCycle(d: number, lw: number): number {
  return Math.round(d - J0 - lw / (2 * PI));
}

function approxTransit(Ht: number, lw: number, n: number): number {
  return J0 + (Ht + lw) / (2 * PI) + n;
}

function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
}

function hourAngle(h: number, phi: number, dec: number): number {
  const val = (sin(h) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec));
  if (val > 1.0001 || val < -1.0001) return NaN;
  return safeAcos(val);
}

const angleDefs: Array<[number, string, string]> = [
  [-0.833 * rad, 'sunrise', 'sunset'],
  [-0.3 * rad, 'sunriseEnd', 'sunsetStart'],
  [-4 * rad, 'blueHourDawnEnd', 'blueHourDuskStart'],
  [-6 * rad, 'civilDawn', 'civilDusk'],
  [-12 * rad, 'nauticalDawn', 'nauticalDusk'],
  [-18 * rad, 'astronomicalDawn', 'astronomicalDusk'],
  [6 * rad, 'goldenHourDawnEnd', 'goldenHourDuskStart']
];

export class AstroCore {
  public static getSunTimes(date: Date, lat: number, lng: number): SunTimes {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L, 0);
    const Jnoon = solarTransitJ(ds, M, L);

    const result: any = {
      solarNoon: fromJulian(Jnoon),
      nadir: fromJulian(Jnoon - 0.5)
    };

    for (let i = 0; i < angleDefs.length; i++) {
      const time = angleDefs[i];
      const h0 = time[0];
      const w0 = hourAngle(h0, phi, dec);
      if (isNaN(w0)) {
        result[time[1]] = null;
        result[time[2]] = null;
        continue;
      }
      const a = approxTransit(w0, lw, n);
      const Jset = solarTransitJ(a, M, L);
      const Jrise = Jnoon - (Jset - Jnoon);

      result[time[1]] = fromJulian(Jrise);
      result[time[2]] = fromJulian(Jset);
    }

    result.goldenHourMorning = {
      start: result.sunrise || result.civilDawn,
      end: result.goldenHourDawnEnd
    };
    result.goldenHourEvening = {
      start: result.goldenHourDuskStart,
      end: result.sunset || result.civilDusk
    };
    result.blueHourMorning = {
      start: result.civilDawn,
      end: result.blueHourDawnEnd || result.sunrise
    };
    result.blueHourEvening = {
      start: result.blueHourDuskStart || result.sunset,
      end: result.civilDusk
    };
    result.nightSky = {
      start: result.astronomicalDusk,
      end: result.astronomicalDawn
    };

    return result as SunTimes;
  }

  public static getSunPosition(date: Date, lat: number, lng: number): SunPosition {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = sunCoords(d);
    const H = siderealTime(d, lw) - c.ra;

    const az = azimuth(H, phi, c.dec);
    const alt = altitude(H, phi, c.dec);

    const compassAz = (az * deg + 180) % 360;

    return {
      azimuth: compassAz,
      altitude: alt * deg
    };
  }

  private static moonCoords(d: number): { ra: number; dec: number; dist: number } {
    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.22935 * d);
    const l = L + rad * 6.289 * sin(M);
    const b = rad * 5.128 * sin(F);
    const dt = 385001 - 20905 * cos(M);

    return {
      ra: rightAscension(l, b),
      dec: declination(l, b),
      dist: dt
    };
  }

  public static getMoonIllumination(date: Date): MoonIllumination {
    const d = toDays(date);
    const s = sunCoords(d);
    const m = this.moonCoords(d);
    const sdist = 149598000;
    const phi = safeAcos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
    const inc = atan2(sdist * sin(phi), m.dist - sdist * cos(phi));
    const angle = atan2(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

    const fraction = (1 + cos(inc)) / 2;
    let phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / PI;
    if (phase >= 1) phase -= 1;

    let phaseName = 'Nymåne';
    let icon = '🌑';
    if (phase < 0.03 || phase > 0.97) {
      phaseName = 'Nymåne';
      icon = '🌑';
    } else if (phase < 0.22) {
      phaseName = 'Tiltagende månesegl';
      icon = '🌒';
    } else if (phase < 0.28) {
      phaseName = 'Første kvarter';
      icon = '🌓';
    } else if (phase < 0.47) {
      phaseName = 'Tiltagende måne';
      icon = '🌔';
    } else if (phase < 0.53) {
      phaseName = 'Fuldmåne';
      icon = '🌕';
    } else if (phase < 0.72) {
      phaseName = 'Aftagende måne';
      icon = '🌖';
    } else if (phase < 0.78) {
      phaseName = 'Sidste kvarter';
      icon = '🌗';
    } else {
      phaseName = 'Aftagende månesegl';
      icon = '🌘';
    }

    return {
      fraction: Math.round(fraction * 100),
      phase,
      name: phaseName,
      icon
    };
  }

  public static getMoonPosition(date: Date, lat: number, lng: number): MoonPosition {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = this.moonCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    const h = altitude(H, phi, c.dec);
    const hCorr = h - rad * 0.017 / tan(h + rad * 10.26 / (h + rad * 5.10));

    const az = azimuth(H, phi, c.dec);
    const compassAz = (az * deg + 180) % 360;

    return {
      azimuth: compassAz,
      altitude: hCorr * deg
    };
  }

  public static getMoonTimes(date: Date, lat: number, lng: number): MoonTimes {
    const t = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const hc = 0.133 * rad;
    let h0 = this.getMoonPosition(t, lat, lng).altitude * rad - hc;
    let rise: Date | null = null;
    let set: Date | null = null;

    for (let i = 1; i <= 24; i += 2) {
      const h1 = this.getMoonPosition(new Date(t.getTime() + i * 3600000), lat, lng).altitude * rad - hc;
      const h2 = this.getMoonPosition(new Date(t.getTime() + (i + 1) * 3600000), lat, lng).altitude * rad - hc;

      const a = (h0 + h2) / 2 - h1;
      const b = (h2 - h0) / 2;
      const xe = -b / (2 * a);
      const ye = (a * xe + b) * xe + h1;
      const d = b * b - 4 * a * h1;
      let roots = 0;

      if (d >= 0) {
        const dx = Math.sqrt(d) / (Math.abs(a) * 2);
        const r1 = xe - dx;
        const r2 = xe + dx;
        if (Math.abs(r1) <= 1) roots++;
        if (Math.abs(r2) <= 1) roots++;

        if (roots === 1) {
          if (h0 < 0) rise = new Date(t.getTime() + (i + r1) * 3600000);
          else set = new Date(t.getTime() + (i + r1) * 3600000);
        } else if (roots === 2) {
          rise = new Date(t.getTime() + (i + (ye < 0 ? r2 : r1)) * 3600000);
          set = new Date(t.getTime() + (i + (ye < 0 ? r1 : r2)) * 3600000);
        }
      }

      h0 = h2;
    }

    return { rise, set };
  }

  public static calculateShadow(altitudeDeg: number, azimuthDeg: number, objectHeightMeters: number = 1.75): ShadowCalculation {
    const height = objectHeightMeters > 0 ? objectHeightMeters : 1.75;
    const shadowAzimuth = (azimuthDeg + 180) % 360;
    const compassDir = this.getCompassDirection(shadowAzimuth);

    if (altitudeDeg <= 0) {
      return {
        hasDirectShadow: false,
        shadowLength: Infinity,
        shadowRatio: Infinity,
        shadowAzimuth,
        shadowCompass: compassDir,
        objectHeight: height,
        lightPhase: this.getLightPhase(altitudeDeg),
        description: 'Solen er under horisonten. Diffust tusmørke – ingen direkte skygger.',
        cameraTip: 'Brug stativ og lange lukkertider. Blødt ambient lys uden hårde kontraster.'
      };
    }

    const altRad = altitudeDeg * rad;
    const ratio = 1 / tan(altRad);
    const length = height * ratio;
    const phase = this.getLightPhase(altitudeDeg);
    let qualityDesc = '';
    let cameraTip = '';

    if (altitudeDeg < 3) {
      qualityDesc = 'Ekstremt lange og bløde skygger med diffus kant.';
      cameraTip = 'Fantastisk til modlysbilleder (rim light) og dramatisk relief i jorden.';
    } else if (altitudeDeg < 6) {
      qualityDesc = 'Klassisk gylden time. Skulpturelle, varme skygger.';
      cameraTip = 'Udnyt skyggerne som stærke ledende linjer. Varm farvetemperatur (3000K-3500K).';
    } else if (altitudeDeg < 15) {
      qualityDesc = 'Lav morgensol / sensommereftermiddag. Fremragende struktur og dybde.';
      cameraTip = 'Flot kontrast i arkitektur og landskaber. Skyggen er ca. 4–9× genstandens højde.';
    } else if (altitudeDeg < 30) {
      qualityDesc = 'Mellemhøj sol. Behagelig 3D-modellering af motiver.';
      cameraTip = 'Gode arbejdsforhold. Skyggelængde er 1.7–3.7× genstandens højde.';
    } else if (altitudeDeg < 45) {
      qualityDesc = 'Moderat høj sol. Skygger begynder at blive mere kompakte end genstanden.';
      cameraTip = 'Hold øje med skyggernes hårdhed. Overvej polarisationsfilter for at dæmpe reflekser.';
    } else {
      qualityDesc = 'Høj sol. Meget korte og hårde skygger direkte under motivet.';
      cameraTip = 'Pas på hårde øjenskygger i portrætter. Brug udfyldningslys eller modlysblænde.';
    }

    return {
      hasDirectShadow: true,
      shadowLength: length,
      shadowRatio: ratio,
      shadowAzimuth,
      shadowCompass: compassDir,
      objectHeight: height,
      lightPhase: phase,
      description: qualityDesc,
      cameraTip
    };
  }

  public static getLightPhase(altitudeDeg: number): LightPhase {
    if (altitudeDeg < -18) {
      return { id: 'night', name: 'Astronomisk nat', badge: 'MØRKE', color: '#6366f1' };
    } else if (altitudeDeg < -12) {
      return { id: 'astro-twilight', name: 'Astronomisk daggry/skumring', badge: 'ASTRO', color: '#818cf8' };
    } else if (altitudeDeg < -6) {
      return { id: 'nautical', name: 'Nautisk tusmørke', badge: 'TUSMØRKE', color: '#38bdf8' };
    } else if (altitudeDeg < -4) {
      return { id: 'blue-hour', name: 'Den Blå Time', badge: 'BLÅ TIME', color: '#0ea5e9' };
    } else if (altitudeDeg < 0) {
      return { id: 'twilight-edge', name: 'Overgang til Gylden Time', badge: 'DAGGRY/SKUMRING', color: '#f59e0b' };
    } else if (altitudeDeg < 6) {
      return { id: 'golden-hour', name: 'Den Gyldne Time', badge: 'GYLDEN TIME', color: '#f59e0b' };
    } else if (altitudeDeg < 15) {
      return { id: 'low-sun', name: 'Lav sol (tekstur-lys)', badge: 'LAV SOL', color: '#fbbf24' };
    } else if (altitudeDeg < 30) {
      return { id: 'mid-sun', name: 'Mellem sol', badge: 'MODERAT SOL', color: '#fde047' };
    } else {
      return { id: 'high-sun', name: 'Høj sol', badge: 'HØJ SOL', color: '#ffffff' };
    }
  }

  public static getEstimatedKelvin(altitudeDeg: number): { kelvin: number; label: string } {
    if (altitudeDeg <= -6) return { kelvin: 12000, label: 'Kølig natsort / stjernehimmel' };
    if (altitudeDeg <= -2) return { kelvin: 9000, label: 'Kølig dybblå (blå time)' };
    if (altitudeDeg <= 0) return { kelvin: 2200, label: 'Dyb rav / rødglødende horisont' };
    if (altitudeDeg <= 3) return { kelvin: 2800, label: 'Varm rødgylden sol' };
    if (altitudeDeg <= 6) return { kelvin: 3300, label: 'Klassisk gyldent lys (golden hour)' };
    if (altitudeDeg <= 12) return { kelvin: 4000, label: 'Varm dagslys' };
    if (altitudeDeg <= 25) return { kelvin: 4800, label: 'Naturligt dagslys' };
    return { kelvin: 5500, label: 'Standard dagslys (5500K)' };
  }

  public static getCompassDirection(azimuthDegrees: number): string {
    const directions = [
      'N', 'NNØ', 'NØ', 'ØNØ',
      'Ø', 'ØSØ', 'SØ', 'SSØ',
      'S', 'SSV', 'SV', 'VSV',
      'V', 'VNV', 'NV', 'NNV'
    ];
    const norm = ((azimuthDegrees % 360) + 360) % 360;
    const val = Math.floor(norm / 22.5 + 0.5);
    return directions[val % 16];
  }

  public static getCompassDirectionFullName(azimuthDegrees: number): string {
    const directions = [
      'Nord', 'Nord-nordøst', 'Nordøst', 'Øst-nordøst',
      'Øst', 'Øst-sydøst', 'Sydøst', 'Syd-sydøst',
      'Syd', 'Syd-sydvest', 'Sydvest', 'Vest-sydvest',
      'Vest', 'Vest-nordvest', 'Nordvest', 'Nord-nordvest'
    ];
    const norm = ((azimuthDegrees % 360) + 360) % 360;
    const val = Math.floor(norm / 22.5 + 0.5);
    return directions[val % 16];
  }

  public static formatDegrees(degVal: number | null | undefined): string {
    if (degVal === null || degVal === undefined || isNaN(degVal)) return '--°';
    const sign = degVal >= 0 ? '+' : '';
    return sign + degVal.toFixed(1) + '°';
  }
}
