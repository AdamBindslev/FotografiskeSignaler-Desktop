/**
 * LocationService.ts - Fælles lokationstjeneste for Fotografiske Signaler (§9.1)
 * Understøtter browser-GPS, Open-Meteo geocoding og reverse geocoding, samt fallback.
 */

export interface PhotoSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt: number;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  sub?: string;
  source: 'gps' | 'search' | 'default';
  accuracy?: number | null;
  updatedAt?: number;
}

export type LocationListener = (loc: GeoLocation) => void;

const LOCATION_STORAGE_KEY = 'fs_shared_location_v1';
const SPOTS_STORAGE_KEY = 'fs_saved_spots_v1';

export const DEFAULT_LOCATION: GeoLocation = {
  lat: 55.6761,
  lng: 12.5683,
  name: 'København',
  sub: 'Standard (tryk GPS for din position)',
  source: 'default',
  accuracy: null
};

export class LocationService {
  private static currentLocation: GeoLocation = LocationService.loadStoredLocation();
  private static listeners: Set<LocationListener> = new Set();
  private static isLocating = false;

  private static loadStoredLocation(): GeoLocation {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (raw) {
          return { ...DEFAULT_LOCATION, ...JSON.parse(raw) };
        }
      }
    } catch (e) {
      console.warn('Kunne ikke læse lokation fra storage:', e);
    }
    return { ...DEFAULT_LOCATION };
  }

  public static getSavedSpots(): PhotoSpot[] {
    try {
      const raw = localStorage.getItem(SPOTS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Kunne ikke hente gemte fotospots:', e);
    }
    return [];
  }

  public static saveSpot(name: string, lat: number, lng: number): PhotoSpot {
    const spots = this.getSavedSpots();
    const cleanName = name.trim() || 'Mit fotospot';
    const newSpot: PhotoSpot = {
      id: 'spot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      lat: +lat.toFixed(4),
      lng: +lng.toFixed(4),
      createdAt: Date.now()
    };
    spots.unshift(newSpot);
    try {
      localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(spots));
    } catch (e) {
      console.warn('Kunne ikke gemme fotospot:', e);
    }
    return newSpot;
  }

  public static deleteSpot(id: string): void {
    const spots = this.getSavedSpots().filter((s) => s.id !== id);
    try {
      localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(spots));
    } catch (e) {
      console.warn('Kunne ikke slette fotospot:', e);
    }
  }

  public static getLocation(): GeoLocation {
    return { ...this.currentLocation };
  }

  public static setLocation(loc: Partial<GeoLocation> & { lat: number; lng: number; name: string }): GeoLocation {
    this.currentLocation = {
      ...this.currentLocation,
      ...loc,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(this.currentLocation));
    } catch (e) {
      console.warn('Fejl ved lagring af lokation:', e);
    }
    this.notifyListeners();
    return this.getLocation();
  }

  public static subscribe(listener: LocationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    const loc = this.getLocation();
    this.listeners.forEach((listener) => {
      try {
        listener(loc);
      } catch (err) {
        console.error('Fejl i location listener:', err);
      }
    });
  }

  public static async requestGpsLocation(): Promise<GeoLocation> {
    if (!navigator.geolocation) {
      throw new Error('GPS understøttes ikke af denne browser');
    }
    this.isLocating = true;

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.isLocating = false;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);

          // Foretag reverse geocoding for at finde bynavn
          let name = 'Aktuel GPS-position';
          let sub = `Nøjagtighed: ±${accuracy}m`;

          try {
            const geo = await LocationService.reverseGeocode(lat, lng);
            if (geo) {
              name = geo.name;
              sub = `${geo.sub || 'GPS'} • ±${accuracy}m`;
            }
          } catch (e) {
            console.warn('Reverse geocode fejlede:', e);
          }

          const newLoc = LocationService.setLocation({
            lat,
            lng,
            name,
            sub,
            source: 'gps',
            accuracy
          });
          resolve(newLoc);
        },
        (error) => {
          this.isLocating = false;
          let msg = 'Kunne ikke hente GPS-position';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Adgang til GPS blev afvist af bruger/browser';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Positionen er utilgængelig lige nu';
          } else if (error.code === error.TIMEOUT) {
            msg = 'GPS-forespørgslen fik timeout';
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  public static async search(query: string): Promise<Array<{ name: string; sub: string; lat: number; lng: number }>> {
    if (!query || query.trim().length < 2) return [];
    const trimmed = query.trim();

    const results: Array<{ name: string; sub: string; lat: number; lng: number }> = [];
    const seen = new Set<string>();

    // 0. Direkte koordinat-genkendelse (f.eks. "55.6761, 12.5683" eller "55.6761 12.5683")
    const coordMatch = trimmed.match(/^([+-]?\d{1,2}(?:\.\d+)?)[,\s]+([+-]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [{
          name: `Koordinater: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°Ø`,
          sub: 'Direkte koordinat-angivelse',
          lat,
          lng
        }];
      }
    }

    // 1. Kør Photon (OpenStreetMap geocoder med adresser, husnumre, vejnavne og seværdigheder)
    // og Open-Meteo Geocoding (byer, områder, internationalt) sideløbende.
    // Photon biases mod Danmark (lat 56.0, lon 11.0)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=56.0&lon=11.0&limit=8`;
    const meteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=da&format=json`;

    const [photonSettled, meteoSettled] = await Promise.allSettled([
      fetch(photonUrl).then(async (r) => (r.ok ? r.json() : null)),
      fetch(meteoUrl).then(async (r) => (r.ok ? r.json() : null))
    ]);

    // 2. Behandl Photon adressedata (understøtter konkrete vejnavne og husnumre i DK)
    if (photonSettled.status === 'fulfilled' && photonSettled.value?.features && Array.isArray(photonSettled.value.features)) {
      for (const feature of photonSettled.value.features) {
        if (!feature.geometry?.coordinates || feature.geometry.coordinates.length < 2) continue;
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties || {};

        let name = '';
        const streetWithNum = [props.street, props.housenumber].filter(Boolean).join(' ');

        if (props.name && streetWithNum && props.name !== props.street) {
          name = `${props.name} (${streetWithNum})`;
        } else if (streetWithNum) {
          name = streetWithNum;
        } else if (props.name) {
          name = props.name;
        } else if (props.city) {
          name = props.city;
        } else {
          name = 'Ukendt sted';
        }

        const subParts = [
          props.postcode,
          props.city || props.locality || props.district,
          props.state,
          props.country
        ].filter(Boolean);

        const sub = subParts.join(', ');
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            name,
            sub: sub || 'Danmark',
            lat,
            lng
          });
        }
      }
    }

    // 3. Open-Meteo steder, byer og naturområder (supplement)
    if (meteoSettled.status === 'fulfilled' && meteoSettled.value?.results && Array.isArray(meteoSettled.value.results)) {
      for (const item of meteoSettled.value.results) {
        const key = `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            name: item.name,
            sub: [item.admin1, item.country].filter(Boolean).join(', '),
            lat: item.latitude,
            lng: item.longitude
          });
        }
      }
    }

    return results.slice(0, 10);
  }

  public static async reverseGeocode(lat: number, lng: number): Promise<{ name: string; sub?: string } | null> {
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=da`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || '';
        const region = data.principalSubdivision || data.countryName || '';
        if (city) {
          return {
            name: city,
            sub: region && region !== city ? region : data.countryName
          };
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding netværksfejl:', e);
    }
    return null;
  }
}
