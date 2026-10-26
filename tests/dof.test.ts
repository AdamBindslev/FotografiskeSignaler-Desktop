import { describe, it, expect } from 'vitest';
import { DofEngine, SENSOR_PRESETS } from '../src/modules/dof/calculations/dof-engine.ts';

describe('DofEngine - Optiske beregninger', () => {
  it('Beregner korrekt hyperfokal distance for Full Frame 50mm f/8', () => {
    // f = 50mm, N = 8, CoC = 0.029mm (Full Frame)
    // H = (50^2 / (8 * 0.029)) + 50 = (2500 / 0.232) + 50 = 10775.86 mm ≈ 10.78 m
    const res = DofEngine.calculateDOF({
      focalLength: 50,
      aperture: 8,
      distance: 10,
      sensor: 'full_frame'
    });

    expect(res.hyperfocalM).toBeCloseTo(10.826, 2);
    expect(res.sensor.cropFactor).toBe(1.0);
    expect(res.pupilDiameterMm).toBeCloseTo(6.25, 2);
  });

  it('Beregner uendelig fjerngrænse når motivafstand er over hyperfokal', () => {
    const res = DofEngine.calculateDOF({
      focalLength: 24,
      aperture: 11,
      distance: 5,
      sensor: 'full_frame'
    });

    // 24mm ved f/11 har en lav hyperfokalafstand (ca 1.8m)
    // Når s = 5m > H, skal farLimitM være Infinity og isInfinity true
    expect(res.isInfinity).toBe(true);
    expect(res.farLimitM).toBe(Infinity);
    expect(res.totalDofM).toBe(Infinity);
  });

  it('Beregner korrekt nær- og fjerngrænse for portræt (85mm f/1.4 @ 2m)', () => {
    const res = DofEngine.calculateDOF({
      focalLength: 85,
      aperture: 1.4,
      distance: 2.0,
      sensor: 'full_frame'
    });

    expect(res.isInfinity).toBe(false);
    expect(res.nearLimitM).toBeLessThan(2.0);
    expect(res.farLimitM).toBeGreaterThan(2.0);
    // DOF for 85mm f/1.4 ved 2m er få centimeter
    expect(res.totalDofM).toBeLessThan(0.10); // Under 10 cm dybdeskarphed
    expect(res.totalDofM).toBeGreaterThan(0.01);
  });

  it('Beregner 35mm ækvivalenter for APS-C og Micro Four Thirds korrekt', () => {
    const apsc = DofEngine.calculateDOF({
      focalLength: 33,
      aperture: 1.4,
      distance: 2,
      sensor: 'apsc_sony_nikon_fuji'
    });
    expect(apsc.equivFocalLength).toBe(50); // 33 * 1.53 ≈ 50mm
    expect(apsc.equivAperture).toBeCloseTo(2.1, 1);

    const mft = DofEngine.calculateDOF({
      focalLength: 25,
      aperture: 1.7,
      distance: 2,
      sensor: 'mft'
    });
    expect(mft.equivFocalLength).toBe(50); // 25 * 2 = 50mm
    expect(mft.equivAperture).toBeCloseTo(3.4, 1);
  });

  it('Formaterer afstande med korrekt dansk enhed og decimaler', () => {
    expect(DofEngine.formatDistance(Infinity)).toBe('∞ (Uendelig)');
    expect(DofEngine.formatDistance(0.045)).toBe('4,5 cm');
    expect(DofEngine.formatDistance(0.85)).toBe('85,0 cm');
    expect(DofEngine.formatDistance(2.45)).toBe('2,45 m');
    expect(DofEngine.formatDistance(15.2)).toBe('15,2 m');
    expect(DofEngine.formatDistance(150)).toBe('150 m');
  });

  it('Beregner uskarphedscirkel (Bokeh) ved uendelig med præcis nærfokus-formel f^2 / (N * (s - f))', () => {
    const res = DofEngine.calculateDOF({
      focalLength: 100, // 0.1 m
      aperture: 2.8,
      distance: 1.0, // 1.0 m -> s - f = 0.9 m
      sensor: 'full_frame'
    });

    // Forventet ved uendelig: (0.1^2 / (2.8 * 0.9)) * 1000 = 10 / 2.52 ≈ 3.968 mm
    // blurToCocRatio = blurAtInfinityMm / cocMm (3.96825 / 0.029 ≈ 136.84)
    expect(res.blurToCocRatio * res.cocMm).toBeCloseTo(3.97, 2);

    // Ved selve fokusafstanden (dPlaneM = focusDistM) skal uskarphedscirklen være 0 mm
    const blurAtFocus = DofEngine.calculateBlurCircleAtDistance(1.0, 1.0, 100, 2.8);
    expect(blurAtFocus).toBeCloseTo(0, 5);
  });
});
