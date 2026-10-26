import { describe, it, expect } from 'vitest';
import { AstroCore } from '../src/shared/astronomy/AstroCore.ts';
import { TimeService } from '../src/shared/services/TimeService.ts';

describe('AstroCore - Sol beregninger', () => {
  const cphLat = 55.6761;
  const cphLng = 12.5683;

  it('Beregner korrekt solhøjde og azimut for København sommersolhverv', () => {
    // 21. juni 2026 kl. 13:00 (nær solmiddag i sommertid UTC+2)
    const noonSummer = new Date('2026-06-21T13:00:00+02:00');
    const pos = AstroCore.getSunPosition(noonSummer, cphLat, cphLng);

    // I København er maksimal solhøjde ved midsommer ca 57.7° (90 - 55.67 + 23.44 ≈ 57.7°)
    expect(pos.altitude).toBeGreaterThan(55);
    expect(pos.altitude).toBeLessThan(60);

    // Ved solmiddag står solen næsten stik syd (azimut ca 180°)
    expect(pos.azimuth).toBeGreaterThan(160);
    expect(pos.azimuth).toBeLessThan(200);
  });

  it('Beregner skyggelængde: L = H / tan(alt)', () => {
    // Solhøjde 45°: skyggelængden skal være præcis lig genstandens højde (tan(45°) = 1)
    const shadow45 = AstroCore.calculateShadow(45, 180, 1.75);
    expect(shadow45.hasDirectShadow).toBe(true);
    expect(shadow45.shadowLength).toBeCloseTo(1.75, 2);
    expect(shadow45.shadowRatio).toBeCloseTo(1.0, 2);
    // Sol i Syd (180°) kaster skygge mod Nord (0°)
    expect(shadow45.shadowAzimuth).toBeCloseTo(0, 0);
    expect(shadow45.shadowCompass).toBe('N');

    // Solhøjde 30°: skyggelængden = H / tan(30°) = 1.75 * sqrt(3) ≈ 3.03 m
    const shadow30 = AstroCore.calculateShadow(30, 90, 2.0);
    expect(shadow30.shadowLength).toBeCloseTo(3.464, 2);
    // Sol i Øst (90°) kaster skygge mod Vest (270°)
    expect(shadow30.shadowAzimuth).toBeCloseTo(270, 0);
    expect(shadow30.shadowCompass).toBe('V');
  });

  it('Håndterer nat og sol under horisonten korrekt for skygger', () => {
    const nightShadow = AstroCore.calculateShadow(-10, 350, 1.75);
    expect(nightShadow.hasDirectShadow).toBe(false);
    expect(nightShadow.shadowLength).toBe(Infinity);
    expect(nightShadow.lightPhase.id).toBe('nautical');
  });

  it('Klassificerer fotofaser og farvetemperatur (Kelvin) korrekt', () => {
    // Gylden time (solhøjde 4°)
    const golden = AstroCore.calculateShadow(4, 180, 1.75);
    expect(golden.lightPhase.id).toBe('golden-hour');
    const kelvinGolden = AstroCore.getEstimatedKelvin(4);
    expect(kelvinGolden.kelvin).toBe(3300);

    // Blå time (solhøjde -5°)
    const bluePhase = AstroCore.getLightPhase(-5);
    expect(bluePhase.id).toBe('blue-hour');
    const kelvinBlue = AstroCore.getEstimatedKelvin(-5);
    expect(kelvinBlue.kelvin).toBe(9000);
  });

  it('Beregner astronomiske forskelle for planlægning frem i tiden (sommer vs. vinter)', () => {
    // Planlægning: Midsommer (21. juni) vs. Midsvinter (21. december) i København
    const summerDate = new Date('2027-06-21T12:00:00Z');
    const winterDate = new Date('2026-12-21T12:00:00Z');

    const summerTimes = AstroCore.getSunTimes(summerDate, cphLat, cphLng);
    const winterTimes = AstroCore.getSunTimes(winterDate, cphLat, cphLng);

    // Sommersolopgang er markant tidligere end vintersolopgang
    expect(summerTimes.sunrise!.getTime()).toBeLessThan(summerTimes.sunset!.getTime());
    expect(winterTimes.sunrise!.getTime()).toBeLessThan(winterTimes.sunset!.getTime());

    // Dagens længde ved midsommer er ca 17.5 timer vs ca 7 timer ved vintersolhverv
    const summerDayMs = summerTimes.sunset!.getTime() - summerTimes.sunrise!.getTime();
    const winterDayMs = winterTimes.sunset!.getTime() - winterTimes.sunrise!.getTime();
    expect(summerDayMs).toBeGreaterThan(16 * 3600 * 1000);
    expect(winterDayMs).toBeLessThan(8 * 3600 * 1000);

    // Solhøjde kl. 12 UTC er markant højere om sommeren
    const summerPos = AstroCore.getSunPosition(summerDate, cphLat, cphLng);
    const winterPos = AstroCore.getSunPosition(winterDate, cphLat, cphLng);
    expect(summerPos.altitude).toBeGreaterThan(50);
    expect(winterPos.altitude).toBeLessThan(15);
  });

  it('TimeService understøtter ISO-dato formatering og parsing til dato-vælger', () => {
    const testDate = new Date(2027, 5, 21, 14, 30); // 21. juni 2027
    const iso = TimeService.formatIsoDate(testDate);
    expect(iso).toBe('2027-06-21');

    const parsed = TimeService.parseIsoDate('2027-06-21');
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2027);
    expect(parsed!.getMonth()).toBe(5);
    expect(parsed!.getDate()).toBe(21);

    expect(TimeService.parseIsoDate('ugyldig')).toBeNull();
    expect(TimeService.parseIsoDate('')).toBeNull();
  });

  it('TimeService relative dage og planlægningshjælpere fungerer præcist', () => {
    const base = new Date(2026, 9, 21); // 21. oktober 2026

    const today = new Date(2026, 9, 21);
    const tomorrow = new Date(2026, 9, 22);
    const yesterday = new Date(2026, 9, 20);
    const nextWeek = new Date(2026, 9, 28);
    const pastDays = new Date(2026, 9, 15);

    expect(TimeService.isToday(today, base)).toBe(true);
    expect(TimeService.isTomorrow(tomorrow, base)).toBe(true);
    expect(TimeService.isYesterday(yesterday, base)).toBe(true);

    expect(TimeService.formatRelativeDay(today, base)).toBe('I dag');
    expect(TimeService.formatRelativeDay(tomorrow, base)).toBe('I morgen');
    expect(TimeService.formatRelativeDay(nextWeek, base)).toBe('Om 7 dage');
    expect(TimeService.formatRelativeDay(pastDays, base)).toBe('6 dage siden');

    // Næste solhverv fra 21. oktober 2026
    const nextWinter = TimeService.getNextSolsticeOrEquinox('winter-solstice', base);
    expect(nextWinter.getFullYear()).toBe(2026);
    expect(nextWinter.getMonth()).toBe(11);
    expect(nextWinter.getDate()).toBe(21);

    const nextSummer = TimeService.getNextSolsticeOrEquinox('summer-solstice', base);
    expect(nextSummer.getFullYear()).toBe(2027);
    expect(nextSummer.getMonth()).toBe(5);
    expect(nextSummer.getDate()).toBe(21);
  });
});
