import { describe, it, expect } from 'vitest';
import { ExposureEngine } from '../src/modules/exposure/calculations/exposure-engine.ts';

describe('ExposureEngine - Eksponeringsberegninger', () => {
  it('Beregner korrekt EV100 for standardværdier', () => {
    // Sunny 16 reglen: f/16 ved 1/125s ISO 100 er ca. EV 15
    const evSunny16 = ExposureEngine.calculateEV100(16, 1 / 125);
    expect(evSunny16).toBeCloseTo(14.97, 1);

    // f/8 ved 1/125s ISO 100 er ca. EV 13
    const evF8 = ExposureEngine.calculateEV100(8, 1 / 125);
    expect(evF8).toBeCloseTo(12.97, 1);

    // f/2.8 ved 1/1000s ISO 100 er ca. EV 13 (samme lysmængde)
    const evF28 = ExposureEngine.calculateEV100(2.8, 1 / 1000);
    expect(evF28).toBeCloseTo(12.94, 1);
  });

  it('Beregner korrekt EV ved forskellige ISO-følsomheder', () => {
    // Hvis ISO øges 2 stops (fra 100 til 400), kræves der 2 stops mindre lys (EV_S er 2 lavere)
    const evIso100 = ExposureEngine.calculateEV(8, 1 / 125, 100);
    const evIso400 = ExposureEngine.calculateEV(8, 1 / 125, 400);

    expect(evIso400).toBeCloseTo(evIso100 - 2, 2);
  });

  it('Løser gensidighedsloven præcist for lukkertid, blænde og ISO', () => {
    const targetEv = 13.0;
    const iso = 100;
    const aperture = 8.0;

    // 1. Løs lukkertid
    const shutter = ExposureEngine.solveShutter(aperture, iso, targetEv);
    expect(shutter).toBeCloseTo(1 / 128, 2);

    // 2. Tjek at den beregnede EV med dette lukker er lig med targetEv
    const checkEv = ExposureEngine.calculateEV(aperture, shutter, iso);
    expect(checkEv).toBeCloseTo(targetEv, 2);

    // 3. Løs blænde ud fra det fundne shutter
    const solvedAperture = ExposureEngine.solveAperture(shutter, iso, targetEv);
    expect(solvedAperture).toBeCloseTo(aperture, 2);

    // 4. Løs ISO ud fra blænde og lukker
    const solvedIso = ExposureEngine.solveIso(aperture, shutter, targetEv);
    expect(solvedIso).toBeCloseTo(iso, 1);
  });

  it('Beregner sikker håndholdt lukkertid med sensor-cropfaktor og IBIS', () => {
    // 50mm på Full Frame (crop 1.0) uden IBIS -> base 1/50s
    const ffRes = ExposureEngine.calculateHandheldShutter(50, 1.0, 0);
    expect(ffRes.baseSafeShutter).toBeCloseTo(1 / 50, 4);
    expect(ffRes.displayBase).toBe('1/50s');

    // 50mm på APS-C (crop 1.5) uden IBIS -> base 1/75s
    const apscRes = ExposureEngine.calculateHandheldShutter(50, 1.5, 0);
    expect(apscRes.baseSafeShutter).toBeCloseTo(1 / 75, 4);
    expect(apscRes.displayBase).toBe('1/75s');

    // 50mm med 3 stops IBIS giver 2^3 = 8 gange længere eksponeringstid
    const ibisRes = ExposureEngine.calculateHandheldShutter(50, 1.0, 3);
    expect(ibisRes.stabilizedSafeShutter).toBeCloseTo(8 / 50, 3); // 0.16s
    expect(ibisRes.displayStabilized).toBe('1/6s');
  });

  it('Beregner astro 500-reglen og 300-reglen korrekt', () => {
    // 24mm optik på Full Frame:
    // 500 / 24 ≈ 20.83 sekunder
    // 300 / 24 = 12.5 sekunder
    const astro = ExposureEngine.calculateAstroShutter(24, 1.0);
    expect(astro.rule500).toBeCloseTo(20.83, 1);
    expect(astro.rule300).toBeCloseTo(12.5, 1);
    expect(astro.display500).toBe('21s');
    expect(astro.display300).toBe('13s');
  });

  it('Beregner ND-filterreduktion og stacking korrekt', () => {
    const baseShutter = 1 / 125; // 0.008s

    // 10-stop ND-filter (ND1000, 2^10 = 1024 faktor)
    // 0.008 * 1024 = 8.192 sekunder
    const res10 = ExposureEngine.calculateNdExposure(baseShutter, 10);
    expect(res10.factor).toBe(1024);
    expect(res10.newShutter).toBeCloseTo(8.192, 2);
    expect(res10.displayTime).toBe('8s');
    expect(res10.opticalDensity).toBeCloseTo(3.01, 1);
    expect(res10.requiresBulb).toBe(false);

    // Stacking: 10 stops (ND1000) + 6 stops (ND64) = 16 stops (2^16 = 65536)
    // 0.008 * 65536 = 524.288 sekunder (8m 44s)
    const resStacked = ExposureEngine.calculateNdExposure(baseShutter, 16);
    expect(resStacked.factor).toBe(65536);
    expect(resStacked.newShutter).toBeCloseTo(524.29, 1);
    expect(resStacked.displayTime).toBe('8m 44s');
    expect(resStacked.requiresBulb).toBe(true);
  });

  it('Formaterer lukkertider pædagogisk på dansk', () => {
    expect(ExposureEngine.formatShutterSpeed(1 / 1000)).toBe('1/1000s');
    expect(ExposureEngine.formatShutterSpeed(1 / 125)).toBe('1/125s');
    expect(ExposureEngine.formatShutterSpeed(0.5)).toBe('0,5s');
    expect(ExposureEngine.formatShutterSpeed(1.6)).toBe('1,6s');
    expect(ExposureEngine.formatShutterSpeed(15)).toBe('15s');
    expect(ExposureEngine.formatShutterSpeed(90)).toBe('1m 30s');
    expect(ExposureEngine.formatShutterSpeed(180)).toBe('3m');
    expect(ExposureEngine.formatShutterSpeed(3665)).toBe('1t 1m 5s');
  });

  it('Beregner og formaterer stop-forskelle for blænde, lukker og ISO', () => {
    // Blænde fra f/8 til f/2.8 (3 stops mere lys)
    const diffA1 = ExposureEngine.calculateApertureStopsDiff(8.0, 2.828);
    expect(diffA1).toBeCloseTo(3.0, 1);
    expect(ExposureEngine.formatStopsDiff(diffA1)).toBe('+3 stops');

    // Blænde fra f/2.8 til f/8 (3 stops mindre lys)
    const diffA2 = ExposureEngine.calculateApertureStopsDiff(2.828, 8.0);
    expect(diffA2).toBeCloseTo(-3.0, 1);
    expect(ExposureEngine.formatStopsDiff(diffA2)).toBe('-3 stops');

    // Lukkertid fra 1/125s til 1/1000s (3 stops kortere tid / mindre lys)
    const diffS1 = ExposureEngine.calculateShutterStopsDiff(1 / 125, 1 / 1000);
    expect(diffS1).toBeCloseTo(-3.0, 1);
    expect(ExposureEngine.formatStopsDiff(diffS1)).toBe('-3 stops');

    // ISO fra 100 til 400 (2 stops mere lysfølsomhed)
    const diffI = ExposureEngine.calculateIsoStopsDiff(100, 400);
    expect(diffI).toBeCloseTo(2.0, 1);
    expect(ExposureEngine.formatStopsDiff(diffI)).toBe('+2 stops');

    // Uændret
    expect(ExposureEngine.formatStopsDiff(0)).toBe('0 stops (uændret)');
  });

  it('Genererer gyldig SVG histogramsti baseret på EV-delta', () => {
    const pathCenter = ExposureEngine.generateHistogramPath(0, 200, 50);
    expect(pathCenter.startsWith('M 0,50')).toBe(true);
    expect(pathCenter.endsWith('L 200,50 Z')).toBe(true);

    const pathDark = ExposureEngine.generateHistogramPath(-2.5, 200, 50);
    expect(pathDark).toBeDefined();
    expect(pathDark.length).toBeGreaterThan(50);
  });
});
