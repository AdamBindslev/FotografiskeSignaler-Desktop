import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

// Simple in-memory localStorage mock for node test runner
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = String(value); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

beforeAll(() => {
  (globalThis as any).localStorage = localStorageMock;
});

import { LocationService } from '../src/shared/services/LocationService.ts';

describe('LocationService - Gemte fotospots', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('Starter med en tom liste af gemte fotospots', () => {
    const spots = LocationService.getSavedSpots();
    expect(spots).toEqual([]);
  });

  it('Kan gemme et nyt fotospot med koordinater', () => {
    const saved = LocationService.saveSpot('Tisvilde Hegn Solnedgang', 56.0583, 12.0811);
    expect(saved.name).toBe('Tisvilde Hegn Solnedgang');
    expect(saved.lat).toBe(56.0583);
    expect(saved.lng).toBe(12.0811);
    expect(saved.id).toBeDefined();

    const spots = LocationService.getSavedSpots();
    expect(spots.length).toBe(1);
    expect(spots[0].name).toBe('Tisvilde Hegn Solnedgang');
  });

  it('Kan slette et gemt fotospot', () => {
    const spot1 = LocationService.saveSpot('Spot 1', 55.67, 12.56);
    const spot2 = LocationService.saveSpot('Spot 2', 56.15, 10.20);
    expect(LocationService.getSavedSpots().length).toBe(2);

    LocationService.deleteSpot(spot1.id);
    const remaining = LocationService.getSavedSpots();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(spot2.id);
  });

  it('Genkender og parser direkte GPS-koordinater i søgefeltet', async () => {
    const results = await LocationService.search('55.6761, 12.5683');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toContain('55.6761');
    expect(results[0].lat).toBeCloseTo(55.6761, 4);
    expect(results[0].lng).toBeCloseTo(12.5683, 4);
  });

  it('Parser Photon adressedata korrekt med gade og husnummer (coords: [lng, lat])', async () => {
    const mockPhoton = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            housenumber: '1',
            street: 'Rådhuspladsen',
            city: 'København V',
            postcode: '1550',
            state: 'Region Hovedstaden',
            country: 'Danmark'
          },
          geometry: {
            type: 'Point',
            coordinates: [12.5686, 55.6761] // geojson er [lng, lat]
          }
        }
      ]
    };

    (globalThis as any).fetch = async (url: string) => {
      if (url.includes('photon.komoot.io')) {
        return { ok: true, json: async () => mockPhoton };
      }
      return { ok: true, json: async () => ({ results: [] }) };
    };

    const results = await LocationService.search('Rådhuspladsen 1');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Rådhuspladsen 1');
    expect(results[0].sub).toContain('1550');
    expect(results[0].sub).toContain('København V');
    expect(results[0].lat).toBe(55.6761);
    expect(results[0].lng).toBe(12.5686);
  });
});
