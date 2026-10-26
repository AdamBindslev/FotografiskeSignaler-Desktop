/**
 * dof-engine.ts - Optisk præcisionsberegner for dybdeskarphed
 * Fotografiske Signaler DOF modul (§8)
 */

export interface SensorPreset {
  id: string;
  name: string;
  shortName: string;
  width: number;
  height: number;
  cropFactor: number;
  coc: number; // mm
  description: string;
}

export interface DofInputParams {
  focalLength: number; // mm
  aperture: number;    // f-stop
  distance: number;    // meters
  sensor: string;      // key in SENSOR_PRESETS
  customCoc?: number;  // mm
}

export interface DiffractionStatus {
  level: 'optimal' | 'mild' | 'noticeable';
  label: string;
  badgeClass: string;
  desc: string;
}

export interface BokehQuality {
  rating: 'sharp' | 'subtle' | 'medium' | 'creamy';
  label: string;
  desc: string;
}

export interface DofResult {
  focalLengthMm: number;
  aperture: number;
  distanceM: number;
  sensor: SensorPreset;
  cocMm: number;
  hyperfocalM: number;
  nearLimitM: number;
  farLimitM: number;
  totalDofM: number;
  isInfinity: boolean;
  depthInFrontM: number;
  depthBehindM: number;
  frontPercent: number;
  rearPercent: number;
  magnification: number;
  pupilDiameterMm: number;
  equivFocalLength: number;
  equivAperture: number;
  diffractionStatus: DiffractionStatus;
  airyDiskUm: number;
  bokehQuality: BokehQuality;
  blurToCocRatio: number;
}

export const SENSOR_PRESETS: Record<string, SensorPreset> = {
  medium_format: {
    id: 'medium_format',
    name: 'Mellemformat (44×33mm)',
    shortName: 'MF 44×33',
    width: 43.8,
    height: 32.9,
    cropFactor: 0.79,
    coc: 0.038,
    description: 'Fujifilm GFX, Hasselblad X2D'
  },
  full_frame: {
    id: 'full_frame',
    name: 'Full Frame / 35mm (36×24mm)',
    shortName: 'Full Frame [FX]',
    width: 36.0,
    height: 24.0,
    cropFactor: 1.0,
    coc: 0.029,
    description: 'Sony A7/A9, Canon R5/R6, Nikon Z, Leica M/SL'
  },
  apsc_sony_nikon_fuji: {
    id: 'apsc_sony_nikon_fuji',
    name: 'APS-C 1.5× (Sony, Nikon, Fuji)',
    shortName: 'APS-C 1.5× [DX]',
    width: 23.5,
    height: 15.6,
    cropFactor: 1.53,
    coc: 0.019,
    description: 'Fujifilm X-T, Sony A6700, Nikon Z50'
  },
  apsc_canon: {
    id: 'apsc_canon',
    name: 'APS-C Canon 1.6× (Canon EOS R/D)',
    shortName: 'APS-C Canon 1.6×',
    width: 22.2,
    height: 14.8,
    cropFactor: 1.62,
    coc: 0.018,
    description: 'Canon EOS R7, R10, R50, 90D'
  },
  mft: {
    id: 'mft',
    name: 'Micro Four Thirds (MFT 2.0×)',
    shortName: 'Micro 4/3 [2.0×]',
    width: 17.3,
    height: 13.0,
    cropFactor: 2.0,
    coc: 0.015,
    description: 'OM System, Olympus OM-D, Panasonic Lumix G'
  },
  one_inch: {
    id: 'one_inch',
    name: '1" Tomme (13.2×8.8mm)',
    shortName: '1" Type [2.7×]',
    width: 13.2,
    height: 8.8,
    cropFactor: 2.73,
    coc: 0.011,
    description: 'Sony RX100, ZV-1, Canon G7X'
  },
  phone_main: {
    id: 'phone_main',
    name: 'Smartphone Stor Sensor (1/1.3")',
    shortName: 'Mobil 1/1.3"',
    width: 9.6,
    height: 7.2,
    cropFactor: 3.6,
    coc: 0.008,
    description: 'iPhone 15/16 Pro, Samsung S24 Ultra, Pixel 8/9'
  },
  phone_small: {
    id: 'phone_small',
    name: 'Smartphone Standard (1/2.55")',
    shortName: 'Mobil 1/2.5"',
    width: 5.76,
    height: 4.29,
    cropFactor: 6.0,
    coc: 0.005,
    description: 'Standard ultravidvinkel & ældre smartphones'
  }
};

export class DofEngine {
  public static calculateDOF(params: DofInputParams): DofResult {
    const focalLengthMm = Math.max(1, Number(params.focalLength) || 50);
    const aperture = Math.max(0.5, Number(params.aperture) || 2.8);
    const distanceM = Math.max(0.05, Number(params.distance) || 2.0);

    const sensorInfo = SENSOR_PRESETS[params.sensor] || SENSOR_PRESETS.full_frame;
    let cocMm = params.customCoc ? Number(params.customCoc) : sensorInfo.coc;
    if (!cocMm || cocMm <= 0) cocMm = 0.029;

    const f = focalLengthMm / 1000.0;
    const c = cocMm / 1000.0;
    const N = aperture;
    const s = distanceM;

    // 1. Hyperfokaldistance H (m) = (f^2 / (N * c)) + f
    const hyperfocalM = ((f * f) / (N * c)) + f;

    // 2. Nærgrænse Dn (m) = s * (H - f) / (H + s - 2f)
    let nearLimitM = 0;
    const nearNumerator = s * (hyperfocalM - f);
    const nearDenominator = hyperfocalM + s - 2 * f;

    if (nearDenominator > 0) {
      nearLimitM = nearNumerator / nearDenominator;
    } else {
      nearLimitM = 0;
    }
    nearLimitM = Math.max(0.01, nearLimitM);

    // 3. Fjerneste grænse Df (m)
    let farLimitM = Infinity;
    const isInfinity = s >= hyperfocalM;

    if (!isInfinity) {
      const farDenominator = hyperfocalM - s;
      if (farDenominator > 0.000001) {
        farLimitM = (s * (hyperfocalM - f)) / farDenominator;
        if (farLimitM > 100000 || farLimitM <= 0) {
          farLimitM = Infinity;
        }
      } else {
        farLimitM = Infinity;
      }
    }

    // 4. Total DOF
    let totalDofM = Infinity;
    if (farLimitM !== Infinity) {
      totalDofM = Math.max(0, farLimitM - nearLimitM);
    }

    // 5. Fordeling foran og bagved
    const depthInFrontM = Math.max(0, s - nearLimitM);
    let depthBehindM = Infinity;
    let frontPercent = 50;
    let rearPercent = 50;

    if (farLimitM !== Infinity) {
      depthBehindM = Math.max(0, farLimitM - s);
      if (totalDofM > 0) {
        frontPercent = (depthInFrontM / totalDofM) * 100.0;
        rearPercent = (depthBehindM / totalDofM) * 100.0;
      }
    } else {
      frontPercent = 0;
      rearPercent = 100;
    }

    // 6. Forstørrelsesgrad
    let magnification = 0;
    if (s > f) {
      magnification = f / (s - f);
    }

    // 7. Pupil-diameter mm
    const pupilDiameterMm = focalLengthMm / aperture;

    // 8. 35mm ækvivalenter
    const equivFocalLength = Math.round(focalLengthMm * sensorInfo.cropFactor);
    const equivAperture = +(aperture * sensorInfo.cropFactor).toFixed(1);

    // 9. Diffraktion
    const airyDiskUm = 1.342 * aperture;
    const cocUm = cocMm * 1000.0;
    const isDiffractionLimited = airyDiskUm > cocUm;
    let diffractionStatus: DiffractionStatus = {
      level: 'optimal',
      label: 'Optimal skarphed',
      badgeClass: 'badge-success',
      desc: 'Blænden er i det ideelle optiske område uden synlig diffraktionsuskarphed.'
    };

    if (aperture >= 16) {
      diffractionStatus = {
        level: 'noticeable',
        label: 'Mærkbar diffraktion',
        badgeClass: 'badge-danger',
        desc: 'Diffraktion gennem den lille blændeåbning spreder lyset og blødgør fine detaljer.'
      };
    } else if (aperture >= 11 || isDiffractionLimited) {
      diffractionStatus = {
        level: 'mild',
        label: 'Begyndende diffraktion',
        badgeClass: 'badge-warning',
        desc: 'Diffraktion kan anes ved 100% zoom på højtopløste sensorer.'
      };
    }

    // 10. Bokeh (sløringscirkel ved uendelig på sensoren i mm: c_inf = f^2 / (N * (s - f)))
    const sMinusF = Math.max(0.001, s - f);
    const blurAtInfinityMm = ((f * f) / (N * sMinusF)) * 1000.0;
    const blurToCocRatio = blurAtInfinityMm / cocMm;

    let bokehQuality: BokehQuality = {
      rating: 'medium',
      label: 'Klassisk Bokeh',
      desc: 'Behagelig separation mellem motiv og baggrund.'
    };
    if (blurToCocRatio < 1.0) {
      bokehQuality = {
        rating: 'sharp',
        label: 'Skarp baggrund',
        desc: 'Baggrunden bevarer fuld genkendelighed og skarphed.'
      };
    } else if (blurToCocRatio < 4.0) {
      bokehQuality = {
        rating: 'subtle',
        label: 'Let sløring',
        desc: 'Baggrunden er let dæmpet, men kontekst kan tydeligt ses.'
      };
    } else if (blurToCocRatio >= 15.0) {
      bokehQuality = {
        rating: 'creamy',
        label: 'Fløjlsblød "Creamy" Bokeh',
        desc: 'Baggrunden smelter fuldstændigt sammen til ren, blød bokeh.'
      };
    }

    return {
      focalLengthMm,
      aperture,
      distanceM,
      sensor: sensorInfo,
      cocMm,
      hyperfocalM,
      nearLimitM,
      farLimitM,
      totalDofM,
      isInfinity,
      depthInFrontM,
      depthBehindM,
      frontPercent: Math.min(100, Math.max(0, frontPercent)),
      rearPercent: Math.min(100, Math.max(0, rearPercent)),
      magnification,
      pupilDiameterMm,
      equivFocalLength,
      equivAperture,
      diffractionStatus,
      airyDiskUm,
      bokehQuality,
      blurToCocRatio
    };
  }

  public static formatDistance(meters: number, includeUnit: boolean = true): string {
    if (meters === Infinity || meters >= 99999) {
      return includeUnit ? '∞ (Uendelig)' : '∞';
    }
    if (meters < 0.001) {
      return (meters * 1000).toFixed(1).replace('.', ',') + (includeUnit ? ' mm' : '');
    }
    if (meters < 0.10) {
      return (meters * 100).toFixed(1).replace('.', ',') + (includeUnit ? ' cm' : '');
    }
    if (meters < 1.0) {
      return (meters * 100).toFixed(1).replace('.', ',') + (includeUnit ? ' cm' : '');
    }
    if (meters < 10.0) {
      return meters.toFixed(2).replace('.', ',') + (includeUnit ? ' m' : '');
    }
    if (meters < 100.0) {
      return meters.toFixed(1).replace('.', ',') + (includeUnit ? ' m' : '');
    }
    return Math.round(meters).toString() + (includeUnit ? ' m' : '');
  }

  public static calculateBlurCircleAtDistance(
    dPlaneM: number,
    focusDistM: number,
    focalLengthMm: number,
    aperture: number
  ): number {
    if (dPlaneM <= 0 || focusDistM <= 0) return 0;
    const f = focalLengthMm / 1000.0;
    const N = aperture;
    const s = focusDistM;
    const d = dPlaneM;

    if (d === s) return 0;
    const denominator = N * Math.max(0.001, s - f) * d;
    if (Math.abs(denominator) < 0.000001) return 0;

    // Blur circle på sensoren i meter: c = (f^2 * |d - s|) / (N * d * (s - f))
    // Omregnes til mm ved at gange med 1000:
    const blurM = Math.abs((f * f * (d - s)) / denominator);
    return blurM * 1000.0;
  }
}
