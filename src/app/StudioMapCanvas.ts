/**
 * StudioMapCanvas.ts - Interaktivt Desktop Fotokort med:
 *  - Kamera-pin (📷 trækbar) og Motiv-pin (🎯 trækbar)
 *  - Sigtelinje (Line of Sight) med live afstand (m) og kompasretning (°)
 *  - Kameraets Synsfelt-kegle (FOV Cone) ud fra valgt sensor og brændvidde
 *  - Dybdeskarphedszone (DOF Sector fra Nærgrænse Dn til Fjerngrænse Df) indtegnet direkte på kortet!
 *  - Solopgangs- og solnedgangs-azimutlinjer, aktuel Solvektor, Månevektor og Motivets Skyggevektor
 */

import { StudioState, StudioSnapshot } from './StudioState.ts';
import { LocationService } from '../shared/services/LocationService.ts';
import { DofEngine } from '../modules/dof/calculations/dof-engine.ts';
import { AstroCore } from '../shared/astronomy/AstroCore.ts';
import 'leaflet/dist/leaflet.css';

export class StudioMapCanvas {
  private container: HTMLElement;
  private L: any = null;
  private map: any = null;

  private cameraMarker: any = null;
  private subjectMarker: any = null;

  private fovPolygon: any = null;
  private dofSectorPolygon: any = null;
  private sightLine: any = null;

  private sunriseLine: any = null;
  private sunsetLine: any = null;
  private sunRayLine: any = null;
  private sunEndpointMarker: any = null;
  private moonRayLine: any = null;
  private shadowPolygon: any = null;
  private shadowLine: any = null;

  private isLoaded = false;
  private isDraggingPins = false;
  private lastCamLat = 0;
  private lastCamLng = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async init(snap: StudioSnapshot): Promise<void> {
    if (this.isLoaded) return;
    const leafletMod = await import('leaflet');
    this.L = leafletMod.default || leafletMod;
    this.isLoaded = true;

    const { lat, lng } = snap.location;
    this.lastCamLat = lat;
    this.lastCamLng = lng;

    this.map = this.L.map(this.container, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    this.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    const satLayer = this.L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );
    const streetLayer = this.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    });

    // Satellitkort + Gadekort vælger
    satLayer.addTo(this.map);
    this.L.control
      .layers(
        {
          '🛰️ Satellitfoto': satLayer,
          '🗺️ Landkort / Gadekort': streetLayer
        },
        null,
        { position: 'topright' }
      )
      .addTo(this.map);

    // 1. FOV-kegle (Kameraets synsfelt)
    this.fovPolygon = this.L.polygon([], {
      color: '#94a3b8',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#38bdf8',
      fillOpacity: 0.08,
      interactive: false
    }).addTo(this.map);

    // 2. DOF-skarphedszone på kortet (mellem Dn og Df inden for FOV-keglen)
    this.dofSectorPolygon = this.L.polygon([], {
      color: '#10b981',
      weight: 2,
      fillColor: '#10b981',
      fillOpacity: 0.28,
      interactive: false
    }).addTo(this.map);

    // 3. Solopgang & Solnedgangs-horisontlinjer
    this.sunriseLine = this.L.polyline([], {
      color: '#fbbf24',
      weight: 1.5,
      dashArray: '3, 6',
      opacity: 0.55,
      interactive: false
    }).addTo(this.map);

    this.sunsetLine = this.L.polyline([], {
      color: '#f97316',
      weight: 1.5,
      dashArray: '3, 6',
      opacity: 0.55,
      interactive: false
    }).addTo(this.map);

    // 4. Aktuel Solvektor + Sol-mærkat
    this.sunRayLine = this.L.polyline([], {
      color: '#f59e0b',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.95,
      interactive: false
    }).addTo(this.map);

    const sunIcon = this.L.divIcon({
      className: 'fs-leaflet-sun-marker',
      html: `<div class="studio-map-pill pill-sun"><span class="studio-map-sun-label">☀️ SOL</span></div>`,
      iconSize: [110, 24],
      iconAnchor: [55, 12]
    });
    this.sunEndpointMarker = this.L.marker([lat, lng], { icon: sunIcon, interactive: false }).addTo(this.map);

    // 5. Månevektor (stiplet lilla/blå)
    this.moonRayLine = this.L.polyline([], {
      color: '#a855f7',
      weight: 2,
      dashArray: '3, 5',
      opacity: 0.75,
      interactive: false
    }).addTo(this.map);

    // 6. Skygge fra Motiv-pin
    this.shadowPolygon = this.L.polygon([], {
      color: '#38bdf8',
      fillColor: '#0284c7',
      fillOpacity: 0.45,
      weight: 1.5,
      interactive: false
    }).addTo(this.map);

    this.shadowLine = this.L.polyline([], {
      color: '#38bdf8',
      weight: 2.5,
      dashArray: '4, 4',
      opacity: 0.9,
      interactive: false
    }).addTo(this.map);

    // 7. Sigtelinje mellem Kamera-pin og Motiv-pin
    this.sightLine = this.L.polyline([], {
      color: '#f8fafc',
      weight: 2,
      opacity: 0.85,
      interactive: false
    }).addTo(this.map);

    // 8. Kamera-Pin (📷)
    const camIcon = this.L.divIcon({
      className: 'studio-pin-camera',
      html: `
        <div class="pin-cam-bubble" title="Kamera-position (Træk for at flytte fotografens standpunkt)">
          <span>📷</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    this.cameraMarker = this.L.marker([lat, lng], {
      icon: camIcon,
      draggable: true,
      zIndexOffset: 200
    }).addTo(this.map);

    // 9. Motiv-Pin (🎯)
    const subjCoords = this.destinationPoint(lat, lng, snap.subjectDistanceM, snap.cameraAzimuthDeg);
    const subjIcon = this.L.divIcon({
      className: 'studio-pin-subject',
      html: `
        <div class="pin-subj-bubble" title="Motiv- & Fokuspunkt (Træk for at ændre sigtelinje og fokusafstand)">
          <span>🎯</span>
          <span class="pin-subj-dist" id="mapPinSubjDist">${DofEngine.formatDistance(snap.subjectDistanceM)}</span>
        </div>
      `,
      iconSize: [86, 30],
      iconAnchor: [43, 15]
    });

    this.subjectMarker = this.L.marker(subjCoords, {
      icon: subjIcon,
      draggable: true,
      zIndexOffset: 190
    }).addTo(this.map);

    this.attachMapInteractions();
    this.update(snap);
  }

  private attachMapInteractions(): void {
    // Træk i Kamera-pin -> opdater lokation
    this.cameraMarker.on('dragstart', () => {
      this.isDraggingPins = true;
    });

    this.cameraMarker.on('dragend', async (e: any) => {
      this.isDraggingPins = false;
      const pos = e.target.getLatLng();
      this.lastCamLat = pos.lat;
      this.lastCamLng = pos.lng;

      LocationService.setLocation({
        lat: pos.lat,
        lng: pos.lng,
        name: `Kortposition (${pos.lat.toFixed(3)}°N, ${pos.lng.toFixed(3)}°Ø)`,
        source: 'search'
      });

      try {
        const rev = await LocationService.reverseGeocode(pos.lat, pos.lng);
        if (rev?.name) {
          LocationService.setLocation({
            lat: pos.lat,
            lng: pos.lng,
            name: rev.name,
            sub: rev.sub,
            source: 'search'
          });
        }
      } catch {
        // Behold koordinat
      }
    });

    // Træk i Motiv-pin -> beregn ny fokusafstand (m) og sigtevinkel (°) live!
    this.subjectMarker.on('drag', (e: any) => {
      this.isDraggingPins = true;
      const camPos = this.cameraMarker.getLatLng();
      const subjPos = e.target.getLatLng();
      const dist = this.haversineDistance(camPos.lat, camPos.lng, subjPos.lat, subjPos.lng);
      const bearing = this.bearingBetween(camPos.lat, camPos.lng, subjPos.lat, subjPos.lng);
      StudioState.setTargetVector(dist, bearing);
    });

    this.subjectMarker.on('dragend', () => {
      this.isDraggingPins = false;
    });

    // Klik på kortet -> flyt Motiv-pin (eller Shift+Klik for at flytte Kamera-pin)
    this.map.on('click', (e: any) => {
      if (e.originalEvent?.shiftKey) {
        this.cameraMarker.setLatLng(e.latlng);
        this.lastCamLat = e.latlng.lat;
        this.lastCamLng = e.latlng.lng;
        LocationService.setLocation({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          name: `Kortposition (${e.latlng.lat.toFixed(3)}°N, ${e.latlng.lng.toFixed(3)}°Ø)`,
          source: 'search'
        });
      } else {
        const camPos = this.cameraMarker.getLatLng();
        const dist = this.haversineDistance(camPos.lat, camPos.lng, e.latlng.lat, e.latlng.lng);
        const bearing = this.bearingBetween(camPos.lat, camPos.lng, e.latlng.lat, e.latlng.lng);
        StudioState.setTargetVector(dist, bearing);
      }
    });
  }

  public update(snap: StudioSnapshot): void {
    if (!this.map || !this.L) return;

    const { lat, lng } = snap.location;
    const camMoved = Math.abs(lat - this.lastCamLat) > 0.0001 || Math.abs(lng - this.lastCamLng) > 0.0001;
    if (camMoved && !this.isDraggingPins) {
      this.lastCamLat = lat;
      this.lastCamLng = lng;
      this.map.setView([lat, lng], this.map.getZoom());
    }

    const camOrigin: [number, number] = [lat, lng];
    this.cameraMarker.setLatLng(camOrigin);

    // Placér Motiv-pin ud fra kamera-koordinat + subjectDistanceM + cameraAzimuthDeg
    const subjCoord = this.destinationPoint(lat, lng, snap.subjectDistanceM, snap.cameraAzimuthDeg);
    if (!this.isDraggingPins) {
      this.subjectMarker.setLatLng(subjCoord);
    }

    const pinDistEl = this.container.querySelector('#mapPinSubjDist');
    if (pinDistEl) {
      pinDistEl.textContent = DofEngine.formatDistance(snap.subjectDistanceM);
    }

    // 1. Sigtelinje
    this.sightLine.setLatLngs([camOrigin, subjCoord]);

    // 2. FOV-Kegle (visuel udstrækning ud fra motivafstanden)
    const halfFov = Math.min(75, snap.horizontalFovDeg / 2);
    const coneVisualMaxM = Math.max(snap.subjectDistanceM * 1.8, 30);
    const fovPoints = this.createSectorPoints(
      lat,
      lng,
      0,
      coneVisualMaxM,
      snap.cameraAzimuthDeg - halfFov,
      snap.cameraAzimuthDeg + halfFov,
      18
    );
    this.fovPolygon.setLatLngs(fovPoints);

    // 3. DOF-Skarphedszone (fra Dn til Df inden for FOV-keglen)
    const nearM = Math.min(coneVisualMaxM, snap.dof.nearLimitM);
    const farM = snap.dof.isInfinity ? coneVisualMaxM : Math.min(coneVisualMaxM, snap.dof.farLimitM);
    if (farM > nearM) {
      const dofPoints = this.createSectorPoints(
        lat,
        lng,
        nearM,
        farM,
        snap.cameraAzimuthDeg - halfFov,
        snap.cameraAzimuthDeg + halfFov,
        18
      );
      this.dofSectorPolygon.setLatLngs(dofPoints);
    } else {
      this.dofSectorPolygon.setLatLngs([]);
    }

    // 4. Solopgang & Solnedgang azimut-linjer
    const rayRadiusM = Math.max(250, snap.subjectDistanceM * 3.2);
    if (snap.sunTimes.sunrise) {
      const srPos = AstroCore.getSunPosition(snap.sunTimes.sunrise, lat, lng);
      this.sunriseLine.setLatLngs([camOrigin, this.destinationPoint(lat, lng, rayRadiusM, srPos.azimuth)]);
    } else {
      this.sunriseLine.setLatLngs([]);
    }

    if (snap.sunTimes.sunset) {
      const ssPos = AstroCore.getSunPosition(snap.sunTimes.sunset, lat, lng);
      this.sunsetLine.setLatLngs([camOrigin, this.destinationPoint(lat, lng, rayRadiusM, ssPos.azimuth)]);
    } else {
      this.sunsetLine.setLatLngs([]);
    }

    // 5. Aktuel Solvektor
    if (snap.sunPos.altitude > -0.833) {
      const sunEnd = this.destinationPoint(lat, lng, rayRadiusM * 0.85, snap.sunPos.azimuth);
      this.sunRayLine.setLatLngs([camOrigin, sunEnd]);
      this.sunEndpointMarker.setLatLng(sunEnd);
      this.sunEndpointMarker.setOpacity(1);
      const sunLabel = this.container.querySelector('.studio-map-sun-label');
      if (sunLabel) {
        sunLabel.textContent = `☀️ ${snap.sunPos.azimuth.toFixed(0)}° (${snap.sunPos.altitude >= 0 ? '+' : ''}${snap.sunPos.altitude.toFixed(1)}°)`;
      }
    } else {
      this.sunRayLine.setLatLngs([]);
      this.sunEndpointMarker.setOpacity(0);
    }

    // 6. Månevektor (når månen er over horisonten)
    if (snap.moonPos.altitude > 0) {
      const moonEnd = this.destinationPoint(lat, lng, rayRadiusM * 0.7, snap.moonPos.azimuth);
      this.moonRayLine.setLatLngs([camOrigin, moonEnd]);
    } else {
      this.moonRayLine.setLatLngs([]);
    }

    // 7. Skygge kastet fra Motiv-pin (🎯)
    if (snap.shadow.hasDirectShadow && snap.sunPos.altitude > 0) {
      const sLen = Math.max(12, Math.min(snap.shadow.shadowLength, 600));
      const sAz = snap.shadow.shadowAzimuth;
      const tipCenter = this.destinationPoint(subjCoord[0], subjCoord[1], sLen, sAz);
      const tipL = this.destinationPoint(subjCoord[0], subjCoord[1], sLen, (sAz - 4 + 360) % 360);
      const tipR = this.destinationPoint(subjCoord[0], subjCoord[1], sLen, (sAz + 4) % 360);

      this.shadowPolygon.setLatLngs([subjCoord, tipL, tipCenter, tipR]);
      this.shadowLine.setLatLngs([subjCoord, tipCenter]);
    } else {
      this.shadowPolygon.setLatLngs([]);
      this.shadowLine.setLatLngs([]);
    }
  }

  public invalidateSize(): void {
    if (this.map) {
      setTimeout(() => this.map?.invalidateSize(), 40);
    }
  }

  private createSectorPoints(
    lat: number,
    lng: number,
    innerRadiusM: number,
    outerRadiusM: number,
    startAngleDeg: number,
    endAngleDeg: number,
    steps: number
  ): Array<[number, number]> {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const a = startAngleDeg + ((endAngleDeg - startAngleDeg) * i) / steps;
      pts.push(this.destinationPoint(lat, lng, outerRadiusM, a));
    }
    if (innerRadiusM <= 0.1) {
      pts.push([lat, lng]);
    } else {
      for (let i = steps; i >= 0; i--) {
        const a = startAngleDeg + ((endAngleDeg - startAngleDeg) * i) / steps;
        pts.push(this.destinationPoint(lat, lng, innerRadiusM, a));
      }
    }
    return pts;
  }

  private destinationPoint(lat: number, lng: number, distM: number, bearingDeg: number): [number, number] {
    const R = 6371e3;
    const brng = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lon1 = (lng * Math.PI) / 180;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distM / R) + Math.cos(lat1) * Math.sin(distM / R) * Math.cos(brng));
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(distM / R) * Math.cos(lat1),
        Math.cos(distM / R) - Math.sin(lat1) * Math.sin(lat2)
      );

    return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private bearingBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
  }
}
