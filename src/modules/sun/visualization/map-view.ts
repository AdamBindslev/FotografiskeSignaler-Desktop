/**
 * map-view.ts - Leaflet kortvisning med on-demand lazy loading for Sol (§7.2, §7.4)
 * Viser solens indfaldsvinkel, skyggens retning og længde direkte på kortet i harmoni med kompasvisningen.
 */

import { AstroCore } from '../../../shared/astronomy/AstroCore.ts';
import 'leaflet/dist/leaflet.css';

export interface MapViewOptions {
  onLocationChange?: (lat: number, lng: number) => void;
}

export class MapView {
  private container: HTMLElement;
  private options: MapViewOptions;
  private map: any = null;
  private L: any = null;
  private marker: any = null;
  private sunRayLine: any = null;
  private sunMarker: any = null;
  private shadowLine: any = null;
  private shadowPoly: any = null;
  private shadowMarker: any = null;
  private isLoaded: boolean = false;
  private lastUpdateArgs: [number, number, number, number, number, number] | null = null;

  constructor(container: HTMLElement, options?: MapViewOptions) {
    this.container = container;
    this.options = options || {};
  }

  public async init(lat: number, lng: number): Promise<void> {
    if (this.isLoaded) return;

    // Dynamisk import af Leaflet
    const leafletModule = await import('leaflet');
    this.L = leafletModule.default || leafletModule;
    this.isLoaded = true;

    // Opret kortinstans
    this.map = this.L.map(this.container, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    this.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Fliselag: OpenStreetMap gadekort og Esri satellit
    const streetLayer = this.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const satLayer = this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; Esri World Imagery'
    });

    streetLayer.addTo(this.map);

    const baseMaps = {
      '🗺️ Gadekort': streetLayer,
      '🛰️ Satellit': satLayer
    };
    this.L.control.layers(baseMaps, null, { position: 'topright' }).addTo(this.map);

    // Fotograf / Kamera markør (trækbar)
    const cameraIconHtml = `
      <div style="width:30px;height:30px;border-radius:50%;background:#07080a;border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(245,158,11,0.6);cursor:grab;">
        <span style="font-size:13px;line-height:1;">📷</span>
      </div>
    `;
    const cameraIcon = this.L.divIcon({
      className: 'fs-leaflet-icon',
      html: cameraIconHtml,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    this.marker = this.L.marker([lat, lng], {
      icon: cameraIcon,
      draggable: true
    }).addTo(this.map);

    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      if (this.options.onLocationChange) {
        this.options.onLocationChange(pos.lat, pos.lng);
      }
    });

    this.map.on('click', (e: any) => {
      this.marker.setLatLng(e.latlng);
      if (this.options.onLocationChange) {
        this.options.onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    });

    // 1. Sol-vektor: Gylden stiplet linje pegende mod solen (hvor solen kommer fra)
    this.sunRayLine = this.L.polyline([], {
      color: '#f59e0b',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.95
    }).addTo(this.map);

    // Sol-markør for enden af solstrålen med sol-ikon
    const sunIcon = this.L.divIcon({
      className: 'fs-leaflet-sun-marker',
      html: `
        <div class="fs-map-sun-badge">
          <span style="font-size:15px;line-height:1;">☀️</span>
          <span class="fs-map-sun-text">SOL</span>
        </div>
      `,
      iconSize: [95, 28],
      iconAnchor: [47, 14]
    });
    this.sunMarker = this.L.marker([lat, lng], { icon: sunIcon, interactive: false }).addTo(this.map);

    // 2. Skygge-vektor: Blå skyggekegle og centerlinje i modsat retning af solen
    this.shadowPoly = this.L.polygon([], {
      color: '#38bdf8',
      fillColor: '#0369a1',
      fillOpacity: 0.45,
      weight: 2
    }).addTo(this.map);

    this.shadowLine = this.L.polyline([], {
      color: '#38bdf8',
      weight: 3,
      dashArray: '4, 4',
      opacity: 0.9
    }).addTo(this.map);

    // Skygge-længde etiket
    const shadowIcon = this.L.divIcon({
      className: 'fs-leaflet-shadow-marker',
      html: `
        <div class="fs-map-shadow-badge">
          <span style="font-size:11px;line-height:1;">👤</span>
          <span class="fs-map-shadow-text">0,0 m</span>
        </div>
      `,
      iconSize: [85, 22],
      iconAnchor: [42, 11]
    });
    this.shadowMarker = this.L.marker([lat, lng], { icon: shadowIcon, interactive: false }).addTo(this.map);

    this.invalidateSize();

    if (this.lastUpdateArgs) {
      this.update(...this.lastUpdateArgs);
    }
  }

  public update(
    lat: number,
    lng: number,
    sunAltitudeDeg: number,
    sunAzimuthDeg: number,
    shadowAzimuthDeg: number,
    shadowLengthMeters: number
  ): void {
    this.lastUpdateArgs = [lat, lng, sunAltitudeDeg, sunAzimuthDeg, shadowAzimuthDeg, shadowLengthMeters];

    if (!this.map || !this.L) return;

    const origin: [number, number] = [lat, lng];
    this.marker.setLatLng(origin);

    const isSunUp = sunAltitudeDeg > -0.833;
    const hasShadow = sunAltitudeDeg > 0;

    // 1. SOLVEKTOR: Skal pege MOD solen (hvor solen kommer fra!)
    if (isSunUp) {
      const sunDistMeters = 350;
      const sunEndpoint = this.calculateDestination(lat, lng, sunDistMeters, sunAzimuthDeg);
      this.sunRayLine.setLatLngs([origin, sunEndpoint]);
      this.sunRayLine.setStyle({ opacity: 0.95 });

      this.sunMarker.setLatLng(sunEndpoint);
      this.sunMarker.setOpacity(1);

      const compassDir = AstroCore.getCompassDirection(sunAzimuthDeg);
      const sunEl = this.container.querySelector('.fs-map-sun-text');
      if (sunEl) {
        sunEl.textContent = `SOL ${sunAzimuthDeg.toFixed(0)}° ${compassDir}`;
      }
    } else {
      this.sunRayLine.setLatLngs([]);
      this.sunMarker.setOpacity(0);
    }

    // 2. SKYGGEVEKTOR: Peger modsat solen (i retning af shadowAzimuthDeg)
    if (hasShadow) {
      // Visuel længde: Vis reel skyggelængde, men mindst 24m så den rager tydeligt ud fra kameramarkøren
      const displayLen = Math.max(24, Math.min(shadowLengthMeters, 2000));
      const tipCenter = this.calculateDestination(lat, lng, displayLen, shadowAzimuthDeg);
      const tipLeft = this.calculateDestination(lat, lng, displayLen, (shadowAzimuthDeg - 3.5 + 360) % 360);
      const tipRight = this.calculateDestination(lat, lng, displayLen, (shadowAzimuthDeg + 3.5) % 360);

      this.shadowPoly.setLatLngs([origin, tipLeft, tipCenter, tipRight]);
      this.shadowPoly.setStyle({ opacity: 0.9, fillOpacity: 0.45 });

      this.shadowLine.setLatLngs([origin, tipCenter]);
      this.shadowLine.setStyle({ opacity: 0.9 });

      this.shadowMarker.setLatLng(tipCenter);
      this.shadowMarker.setOpacity(1);

      const lenFormatted =
        shadowLengthMeters < 1000
          ? `${shadowLengthMeters.toFixed(1).replace('.', ',')} m`
          : `${(shadowLengthMeters / 1000).toFixed(2).replace('.', ',')} km`;

      const shadowEl = this.container.querySelector('.fs-map-shadow-text');
      if (shadowEl) {
        shadowEl.textContent = `${lenFormatted}`;
      }
    } else {
      this.shadowPoly.setLatLngs([]);
      this.shadowLine.setLatLngs([]);
      this.shadowMarker.setOpacity(0);
    }
  }

  public setCenter(lat: number, lng: number): void {
    if (!this.map) return;
    this.map.setView([lat, lng], this.map.getZoom());
    this.invalidateSize();
  }

  public invalidateSize(): void {
    if (this.map) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 50);
    }
  }

  private calculateDestination(lat: number, lng: number, distanceMeters: number, bearingDeg: number): [number, number] {
    const R = 6371e3; // Jordens radius i meter
    const d = distanceMeters;
    const brng = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lon1 = (lng * Math.PI) / 180;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

    return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
  }
}
