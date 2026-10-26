/**
 * shadow-sim.ts - Grafisk simulationsmotor for Sol (§7)
 * Renderes på HTML5 Canvas med Retina-understøttelse og aktiv pause.
 */

import { AstroCore, SunTimes } from '../../../shared/astronomy/AstroCore.ts';

const PI = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const rad = PI / 180;

export interface SimulatorOptions {
  mode?: '3d' | 'compass';
  subjectType?: 'person' | 'tree' | 'building' | 'custom';
  subjectHeight?: number;
}

export class ShadowSimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentMode: '3d' | 'compass' = '3d';
  private subjectType: 'person' | 'tree' | 'building' | 'custom' = 'person';
  private subjectHeight: number = 1.75;

  private camera = {
    azimuth: 220,
    pitch: 35,
    zoom: 1.0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  };

  private simData = {
    lat: 55.6761,
    lng: 12.5683,
    sunAzimuth: 180,
    sunAltitude: 30,
    shadowAzimuth: 0,
    shadowLength: 3.12,
    shadowRatio: 1.73,
    hasDirectShadow: true,
    diffusionFactor: 1.0,
    sunTimes: null as SunTimes | null
  };

  private animFrameId: number | null = null;
  private isPaused: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private boundMouseMove!: (e: MouseEvent) => void;
  private boundMouseUp!: () => void;
  private boundTouchMove!: (e: TouchEvent) => void;
  private boundTouchEnd!: () => void;
  private boundThemeChange!: () => void;

  constructor(canvas: HTMLCanvasElement, options?: SimulatorOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    if (options?.mode) this.currentMode = options.mode;
    if (options?.subjectType) this.subjectType = options.subjectType;
    if (options?.subjectHeight) this.subjectHeight = options.subjectHeight;

    this.setupInteraction();
    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isPaused) {
          this.render();
        }
      });
      if (this.canvas.parentElement) {
        this.resizeObserver.observe(this.canvas.parentElement);
      } else {
        this.resizeObserver.observe(this.canvas);
      }
    }
  }

  private setupInteraction(): void {
    const onStart = (x: number, y: number) => {
      if (this.currentMode !== '3d') return;
      this.camera.isDragging = true;
      this.camera.lastMouseX = x;
      this.camera.lastMouseY = y;
    };

    const onMove = (x: number, y: number) => {
      if (!this.camera.isDragging || this.currentMode !== '3d') return;
      const dx = x - this.camera.lastMouseX;
      const dy = y - this.camera.lastMouseY;

      this.camera.azimuth = ((this.camera.azimuth - dx * 0.5) % 360 + 360) % 360;
      this.camera.pitch = Math.max(12, Math.min(85, this.camera.pitch + dy * 0.4));

      this.camera.lastMouseX = x;
      this.camera.lastMouseY = y;
      this.render();
    };

    const onEnd = () => {
      this.camera.isDragging = false;
    };

    this.boundMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    this.boundMouseUp = onEnd;
    this.boundTouchMove = (e: TouchEvent) => {
      if (this.camera.isDragging && e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    this.boundTouchEnd = onEnd;
    this.boundThemeChange = () => {
      if (!this.isPaused) this.render();
    };

    this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);
    window.addEventListener('fs-theme-change', this.boundThemeChange);

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          onStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    window.addEventListener('touchmove', this.boundTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundTouchEnd);
  }

  public destroy(): void {
    this.pause();
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
    window.removeEventListener('fs-theme-change', this.boundThemeChange);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  public pause(): void {
    this.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public resume(): void {
    this.isPaused = false;
    this.render();
  }

  private isNightRedMode(): boolean {
    return typeof document !== 'undefined' && document.body.classList.contains('theme-night-red');
  }

  public update(
    altitudeDeg: number,
    azimuthDeg: number,
    heightMeters?: number,
    opt?: { subjectType?: any; diffusionFactor?: number; sunTimes?: SunTimes | null; lat?: number; lng?: number }
  ): void {
    if (typeof heightMeters === 'number' && heightMeters > 0) this.subjectHeight = heightMeters;
    if (opt?.subjectType) this.subjectType = opt.subjectType;
    if (typeof opt?.diffusionFactor === 'number') this.simData.diffusionFactor = opt.diffusionFactor;
    if (opt?.sunTimes) this.simData.sunTimes = opt.sunTimes;
    if (typeof opt?.lat === 'number') this.simData.lat = opt.lat;
    if (typeof opt?.lng === 'number') this.simData.lng = opt.lng;

    this.simData.sunAzimuth = azimuthDeg;
    this.simData.sunAltitude = altitudeDeg;
    this.simData.shadowAzimuth = (azimuthDeg + 180) % 360;

    if (altitudeDeg > 0) {
      const altRad = altitudeDeg * rad;
      this.simData.hasDirectShadow = true;
      this.simData.shadowRatio = 1 / tan(altRad);
      this.simData.shadowLength = this.subjectHeight * this.simData.shadowRatio;
    } else {
      this.simData.hasDirectShadow = false;
      this.simData.shadowRatio = Infinity;
      this.simData.shadowLength = Infinity;
    }

    if (!this.isPaused) {
      this.render();
    }
  }

  public setMode(mode: '3d' | 'compass'): void {
    this.currentMode = mode;
    this.render();
  }

  public setSubjectType(type: 'person' | 'tree' | 'building' | 'custom', height?: number): void {
    this.subjectType = type;
    if (height) this.subjectHeight = height;
    this.render();
  }

  public resetCamera(preset?: 'default' | 'top' | 'rim' | 'shadow'): void {
    if (preset === 'top') {
      this.camera.pitch = 85;
    } else if (preset === 'rim') {
      this.camera.azimuth = this.simData.sunAzimuth;
      this.camera.pitch = 22;
    } else if (preset === 'shadow') {
      this.camera.azimuth = this.simData.shadowAzimuth;
      this.camera.pitch = 28;
    } else {
      // 3/4 vinkel (45 grader offset fra solen) så både lysindfald og skygge ses diagonalt
      this.camera.azimuth = (this.simData.sunAzimuth + 45) % 360;
      this.camera.pitch = 35;
    }
    this.camera.zoom = 1.0;
    this.render();
  }

  public render(): void {
    if (this.isPaused) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || this.canvas.width || 360;
    const height = rect.height || this.canvas.height || 360;

    if (this.canvas.width !== Math.floor(width * dpr) || this.canvas.height !== Math.floor(height * dpr)) {
      this.canvas.width = Math.floor(width * dpr);
      this.canvas.height = Math.floor(height * dpr);
    }

    this.ctx.save();
    this.ctx.scale(dpr, dpr);
    this.ctx.clearRect(0, 0, width, height);

    if (this.currentMode === '3d') {
      this.render3DView(width, height);
    } else if (this.currentMode === 'compass') {
      this.renderCompassView(width, height);
    }

    this.ctx.restore();
  }

  private render3DView(w: number, h: number): void {
    const cx = w * 0.5;
    const cy = h * 0.58;
    const alt = this.simData.sunAltitude;
    const az = this.simData.sunAzimuth;
    const shadowAz = this.simData.shadowAzimuth;

    this.drawSkyDome(w, h, alt);

    const maxExpectedShadow = Math.min(this.simData.shadowLength, 30);
    const scale = Math.max(9, Math.min(35, (w * 0.38) / Math.max(this.subjectHeight * 2.2, maxExpectedShadow * 0.72)));

    const camAzRad = this.camera.azimuth * rad;
    const camPitchRad = this.camera.pitch * rad;

    const project = (wx: number, wy: number, wz: number) => {
      const rx = wx * cos(camAzRad) - wy * sin(camAzRad);
      const ry = wx * sin(camAzRad) + wy * cos(camAzRad);
      const rz = wz;

      const screenX = cx + rx * scale;
      const groundY = cy - ry * scale * sin(camPitchRad);
      const screenY = groundY - rz * scale * cos(camPitchRad);

      return { x: screenX, y: screenY, depth: ry };
    };

    this.drawIlluminatedGroundPlane(project, scale, alt);
    this.drawGroundGrid(project);
    this.drawGroundCompass(project, w, h, scale, camPitchRad);

    if (this.simData.hasDirectShadow) {
      this.drawCastShadow(project, shadowAz, this.simData.shadowLength);
    }

    this.drawSubject3D(project, scale);
    this.drawSunInSky(w, h, cx, cy, alt, az, project);
    this.drawEvfOverlay(w, h);
  }

  private drawSkyDome(w: number, h: number, alt: number): void {
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    if (this.isNightRedMode()) {
      grad.addColorStop(0, '#080000');
      grad.addColorStop(0.6, '#140202');
      grad.addColorStop(0.88, alt > 0 ? '#2a0404' : '#180202');
      grad.addColorStop(1, '#0a0101');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, w, h);
      return;
    }
    if (alt > 20) {
      grad.addColorStop(0, '#0c1322');
      grad.addColorStop(0.55, '#19243a');
      grad.addColorStop(0.85, '#22324e');
      grad.addColorStop(1, '#111827');
    } else if (alt > 6) {
      grad.addColorStop(0, '#0d1322');
      grad.addColorStop(0.55, '#1e283d');
      grad.addColorStop(0.82, '#313247');
      grad.addColorStop(1, '#141824');
    } else if (alt > 0) {
      grad.addColorStop(0, '#0f1424');
      grad.addColorStop(0.45, '#261b2e');
      grad.addColorStop(0.72, '#5c2c1a');
      grad.addColorStop(0.88, '#8c4815');
      grad.addColorStop(1, '#211822');
    } else if (alt > -6) {
      grad.addColorStop(0, '#060a17');
      grad.addColorStop(0.55, '#111833');
      grad.addColorStop(0.85, '#1b2247');
      grad.addColorStop(1, '#0b0f1c');
    } else {
      grad.addColorStop(0, '#04060c');
      grad.addColorStop(0.65, '#070b17');
      grad.addColorStop(1, '#03050a');
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
  }

  private drawIlluminatedGroundPlane(project: any, scale: number, alt: number): void {
    const radius = 24;
    const segments = 64;
    const isRed = this.isNightRedMode();

    this.ctx.save();
    this.ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * PI * 2;
      const pt = project(sin(a) * radius, cos(a) * radius, 0);
      if (i === 0) this.ctx.moveTo(pt.x, pt.y);
      else this.ctx.lineTo(pt.x, pt.y);
    }
    this.ctx.closePath();

    const centerPt = project(0, 0, 0);
    const groundGrad = this.ctx.createRadialGradient(centerPt.x, centerPt.y, 5, centerPt.x, centerPt.y, radius * scale * 1.1);

    if (isRed) {
      groundGrad.addColorStop(0, '#240505');
      groundGrad.addColorStop(0.6, '#140202');
      groundGrad.addColorStop(1, 'rgba(10, 0, 0, 0)');
    } else if (alt > 6) {
      groundGrad.addColorStop(0, '#243048');
      groundGrad.addColorStop(0.6, '#182030');
      groundGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else if (alt > 0) {
      groundGrad.addColorStop(0, '#3a2920');
      groundGrad.addColorStop(0.55, '#241a22');
      groundGrad.addColorStop(1, 'rgba(17, 24, 39, 0)');
    } else {
      groundGrad.addColorStop(0, '#151d2f');
      groundGrad.addColorStop(0.7, '#0f1522');
      groundGrad.addColorStop(1, 'rgba(10, 15, 25, 0)');
    }

    this.ctx.fillStyle = groundGrad;
    this.ctx.fill();
    this.ctx.strokeStyle = isRed ? 'rgba(255, 50, 50, 0.2)' : 'rgba(255, 255, 255, 0.12)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawGroundGrid(project: any): void {
    const rings = [1, 2, 5, 10, 20];
    const isRed = this.isNightRedMode();
    this.ctx.save();
    this.ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (let r = 0; r < rings.length; r++) {
      const dist = rings[r];
      this.ctx.beginPath();
      const segments = 48;
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * PI * 2;
        const pt = project(sin(a) * dist, cos(a) * dist, 0);
        if (i === 0) this.ctx.moveTo(pt.x, pt.y);
        else this.ctx.lineTo(pt.x, pt.y);
      }
      if (isRed) {
        this.ctx.strokeStyle = dist === 5 || dist === 10 ? 'rgba(255, 60, 60, 0.25)' : 'rgba(255, 50, 50, 0.12)';
      } else {
        this.ctx.strokeStyle = dist === 5 || dist === 10 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.08)';
      }
      this.ctx.lineWidth = dist === 5 || dist === 10 ? 1.5 : 1;
      this.ctx.stroke();

      const labelPt = project(dist, 0, 0);
      this.ctx.fillStyle = isRed ? 'rgba(201, 52, 52, 0.8)' : 'rgba(148, 163, 184, 0.65)';
      this.ctx.fillText(`${dist}m`, labelPt.x, labelPt.y - 5);
    }
    this.ctx.restore();
  }

  private drawGroundCompass(project: any, w: number, h: number, scale: number, camPitchRad: number): void {
    // Dynamisk kompasafstand så akser og etiketter altid er synlige inden for søgeren
    const effectivePitchFactor = Math.max(0.3, sin(camPitchRad));
    const maxVisibleMeters = (Math.min(w, h) * 0.42) / (scale * effectivePitchFactor);
    const dist = Math.max(3.5, Math.min(22, maxVisibleMeters * 0.85));
    const isRed = this.isNightRedMode();

    this.ctx.save();
    this.ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const pCenter = project(0, 0, 0);
    const pN = project(0, dist, 0);
    const pS = project(0, -dist, 0);
    const pE = project(dist, 0, 0);
    const pW = project(-dist, 0, 0);

    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);

    // Sydakse
    this.ctx.strokeStyle = isRed ? 'rgba(255, 50, 50, 0.22)' : 'rgba(255, 255, 255, 0.16)';
    this.ctx.beginPath();
    this.ctx.moveTo(pCenter.x, pCenter.y);
    this.ctx.lineTo(pS.x, pS.y);
    this.ctx.stroke();

    // Nordakse (fremhæves i rødligt skær)
    this.ctx.strokeStyle = isRed ? 'rgba(255, 77, 77, 0.6)' : 'rgba(239, 68, 68, 0.45)';
    this.ctx.beginPath();
    this.ctx.moveTo(pCenter.x, pCenter.y);
    this.ctx.lineTo(pN.x, pN.y);
    this.ctx.stroke();

    // Øst-Vest akse
    this.ctx.strokeStyle = isRed ? 'rgba(255, 50, 50, 0.22)' : 'rgba(255, 255, 255, 0.16)';
    this.ctx.beginPath();
    this.ctx.moveTo(pW.x, pW.y);
    this.ctx.lineTo(pE.x, pE.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Tydelige badges ved kardinalpunkterne
    const drawCardinalBadge = (pt: { x: number; y: number }, label: string, isNorth: boolean) => {
      const bw = isNorth ? 28 : 22;
      const bh = 18;
      const bx = pt.x - bw * 0.5;
      const by = pt.y - bh * 0.5;

      this.ctx.fillStyle = isRed ? 'rgba(24, 2, 2, 0.94)' : 'rgba(15, 23, 42, 0.92)';
      this.ctx.strokeStyle = isNorth ? '#ef4444' : isRed ? 'rgba(201, 52, 52, 0.5)' : 'rgba(148, 163, 184, 0.45)';
      this.ctx.lineWidth = isNorth ? 1.5 : 1;
      this.ctx.beginPath();
      this.ctx.roundRect(bx, by, bw, bh, 4);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = isNorth ? '#ef4444' : isRed ? '#c93434' : '#cbd5e1';
      this.ctx.fillText(label, pt.x, pt.y);
    };

    drawCardinalBadge(pN, '▲ N', true);
    drawCardinalBadge(pE, 'Ø', false);
    drawCardinalBadge(pS, 'S', false);
    drawCardinalBadge(pW, 'V', false);

    this.ctx.restore();
  }

  private drawCastShadow(project: any, shadowAzDeg: number, lengthMeters: number): void {
    if (lengthMeters <= 0.05) return;
    const isRed = this.isNightRedMode();

    const radAz = shadowAzDeg * rad;
    const dirX = sin(radAz);
    const dirY = cos(radAz);
    const perpX = -dirY;
    const perpY = dirX;

    const pBase = project(0, 0, 0);
    const pTip = project(dirX * lengthMeters, dirY * lengthMeters, 0);

    let baseWidth = Math.max(0.7, this.subjectHeight * 0.45);
    if (this.subjectType === 'tree') baseWidth = Math.max(2.5, this.subjectHeight * 0.7);
    if (this.subjectType === 'building') baseWidth = Math.max(4.0, this.subjectHeight * 0.8);

    const tipWidth = baseWidth * (1 + Math.min(lengthMeters * 0.06, 1.4));

    const pL1 = project(perpX * (baseWidth * 0.5), perpY * (baseWidth * 0.5), 0);
    const pR1 = project(-perpX * (baseWidth * 0.5), -perpY * (baseWidth * 0.5), 0);
    const pL2 = project(dirX * lengthMeters + perpX * (tipWidth * 0.5), dirY * lengthMeters + perpY * (tipWidth * 0.5), 0);
    const pR2 = project(dirX * lengthMeters - perpX * (tipWidth * 0.5), dirY * lengthMeters - perpY * (tipWidth * 0.5), 0);

    this.ctx.save();

    const shadowGrad = this.ctx.createLinearGradient(pBase.x, pBase.y, pTip.x, pTip.y);
    const diffFactor = this.simData.diffusionFactor || 1.0;

    shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${0.95 * diffFactor})`);
    shadowGrad.addColorStop(0.7, isRed ? `rgba(12, 0, 0, ${0.85 * diffFactor})` : `rgba(2, 6, 18, ${0.85 * diffFactor})`);
    shadowGrad.addColorStop(1, isRed ? `rgba(20, 2, 2, ${0.45 * diffFactor})` : `rgba(10, 16, 28, ${0.45 * diffFactor})`);

    this.ctx.fillStyle = shadowGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(pL1.x, pL1.y);
    this.ctx.lineTo(pL2.x, pL2.y);
    this.ctx.quadraticCurveTo(pTip.x + dirX * 6, pTip.y + dirY * 6, pR2.x, pR2.y);
    this.ctx.lineTo(pR1.x, pR1.y);
    this.ctx.closePath();
    this.ctx.fill();

    const shadowAccent = isRed ? '#ff4444' : '#38bdf8';
    this.ctx.strokeStyle = isRed ? 'rgba(255, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.45)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.strokeStyle = shadowAccent;
    this.ctx.setLineDash([4, 4]);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(pBase.x, pBase.y);
    this.ctx.lineTo(pTip.x, pTip.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    const lenText = lengthMeters < 100 ? `${lengthMeters.toFixed(1)} m` : '> 100 m';
    const badgeW = 74;
    const badgeH = 22;
    const badgeX = pTip.x - badgeW * 0.5;
    const badgeY = pTip.y - 28;

    this.ctx.fillStyle = isRed ? 'rgba(24, 2, 2, 0.94)' : 'rgba(15, 23, 42, 0.92)';
    this.ctx.strokeStyle = shadowAccent;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = shadowAccent;
    this.ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`👤 ${lenText}`, pTip.x, badgeY + badgeH * 0.5);

    this.ctx.restore();
  }

  private drawSubject3D(project: any, scale: number): void {
    const h = this.subjectHeight;
    const pBase = project(0, 0, 0);
    const pTop = project(0, 0, h);
    const isRed = this.isNightRedMode();

    this.ctx.save();

    if (this.subjectType === 'tree') {
      this.ctx.strokeStyle = isRed ? '#7f1d1d' : '#92400e';
      this.ctx.lineWidth = Math.max(4, scale * 0.25);
      this.ctx.beginPath();
      this.ctx.moveTo(pBase.x, pBase.y);
      this.ctx.lineTo(pTop.x, pTop.y + (pBase.y - pTop.y) * 0.4);
      this.ctx.stroke();

      const crownCenter = project(0, 0, h * 0.7);
      const crownRadius = (pBase.y - pTop.y) * 0.45;
      const crownGrad = this.ctx.createRadialGradient(crownCenter.x, crownCenter.y, crownRadius * 0.1, crownCenter.x, crownCenter.y, crownRadius);
      if (isRed) {
        crownGrad.addColorStop(0, '#dc2626');
        crownGrad.addColorStop(0.7, '#991b1b');
        crownGrad.addColorStop(1, '#450a0a');
      } else {
        crownGrad.addColorStop(0, '#4ade80');
        crownGrad.addColorStop(0.7, '#16a34a');
        crownGrad.addColorStop(1, '#14532d');
      }

      this.ctx.fillStyle = crownGrad;
      this.ctx.beginPath();
      this.ctx.arc(crownCenter.x, crownCenter.y, crownRadius, 0, PI * 2);
      this.ctx.fill();
    } else if (this.subjectType === 'building') {
      const bW = h * 0.6;
      const c1 = project(-bW * 0.5, -bW * 0.5, 0);
      const c2 = project(bW * 0.5, -bW * 0.5, 0);
      const c3 = project(bW * 0.5, bW * 0.5, 0);

      const t1 = project(-bW * 0.5, -bW * 0.5, h);
      const t2 = project(bW * 0.5, -bW * 0.5, h);
      const t3 = project(bW * 0.5, bW * 0.5, h);
      const t4 = project(-bW * 0.5, bW * 0.5, h);

      this.ctx.fillStyle = isRed ? 'rgba(69, 10, 10, 0.9)' : 'rgba(51, 65, 85, 0.9)';
      this.ctx.strokeStyle = isRed ? '#dc2626' : '#94a3b8';
      this.ctx.lineWidth = 1.5;

      this.ctx.beginPath();
      this.ctx.moveTo(c1.x, c1.y);
      this.ctx.lineTo(c2.x, c2.y);
      this.ctx.lineTo(t2.x, t2.y);
      this.ctx.lineTo(t1.x, t1.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(c2.x, c2.y);
      this.ctx.lineTo(c3.x, c3.y);
      this.ctx.lineTo(t3.x, t3.y);
      this.ctx.lineTo(t2.x, t2.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = isRed ? 'rgba(90, 15, 15, 0.95)' : 'rgba(71, 85, 105, 0.95)';
      this.ctx.beginPath();
      this.ctx.moveTo(t1.x, t1.y);
      this.ctx.lineTo(t2.x, t2.y);
      this.ctx.lineTo(t3.x, t3.y);
      this.ctx.lineTo(t4.x, t4.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      const headY = pTop.y;
      const footY = pBase.y;
      const personH = footY - headY;
      const personColor = isRed ? '#ff4d4d' : '#f8fafc';

      this.ctx.strokeStyle = personColor;
      this.ctx.lineWidth = 3;

      this.ctx.beginPath();
      this.ctx.arc(pBase.x, headY + 5, 5.5, 0, PI * 2);
      this.ctx.fillStyle = personColor;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(pBase.x, headY + 11);
      this.ctx.lineTo(pBase.x, footY - personH * 0.4);
      this.ctx.lineTo(pBase.x - 6, footY);
      this.ctx.moveTo(pBase.x, footY - personH * 0.4);
      this.ctx.lineTo(pBase.x + 6, footY);
      this.ctx.moveTo(pBase.x - 8, headY + 18);
      this.ctx.lineTo(pBase.x + 8, headY + 18);
      this.ctx.stroke();
    }

    const markX = pBase.x + 20;
    this.ctx.strokeStyle = isRed ? 'rgba(255, 77, 77, 0.4)' : 'rgba(255, 255, 255, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(markX, pBase.y);
    this.ctx.lineTo(markX, pTop.y);
    this.ctx.moveTo(markX - 3, pBase.y);
    this.ctx.lineTo(markX + 3, pBase.y);
    this.ctx.moveTo(markX - 3, pTop.y);
    this.ctx.lineTo(markX + 3, pTop.y);
    this.ctx.stroke();

    this.ctx.fillStyle = isRed ? '#c93434' : '#cbd5e1';
    this.ctx.font = '10px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.subjectHeight.toFixed(1)}m`, markX + 6, (pBase.y + pTop.y) * 0.5 + 3);

    this.ctx.restore();
  }

  private drawSunInSky(w: number, h: number, cx: number, cy: number, altDeg: number, azDeg: number, project: any): void {
    if (altDeg <= -0.833) {
      this.drawSubHorizonIndicator(w, h, altDeg);
      return;
    }

    const isRed = this.isNightRedMode();
    const relAz = ((azDeg - this.camera.azimuth + 540) % 360) - 180;
    const isFacingSun = Math.abs(relAz) < 95;
    const pTop = project(0, 0, this.subjectHeight);

    if (!isFacingSun) {
      // Solen befinder sig bag kameraets synsvinkel - vis diskret statusindikator
      this.ctx.save();
      const badgeText = `☀ Sol: ${azDeg.toFixed(0)}° ${AstroCore.getCompassDirection(azDeg)} (+${altDeg.toFixed(1)}°) [Bag synsvinkel]`;
      this.ctx.fillStyle = isRed ? 'rgba(24, 2, 2, 0.92)' : 'rgba(15, 23, 42, 0.88)';
      this.ctx.strokeStyle = isRed ? 'rgba(255, 77, 77, 0.45)' : 'rgba(245, 158, 11, 0.4)';
      this.ctx.lineWidth = 1;
      const bW = 230;
      const bH = 22;
      this.ctx.beginPath();
      this.ctx.roundRect(14, 14, bW, bH, 4);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = isRed ? '#ff4d4d' : '#fbbf24';
      this.ctx.font = 'bold 10px ui-monospace, SFMono-Regular, monospace';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(badgeText, 22, 25);
      this.ctx.restore();
      return;
    }

    // Solen er i synsfeltet:
    // Placer solen kollinært med skyggen for fysisk perfekt sammenhæng!
    const radShadowAz = this.simData.shadowAzimuth * rad;
    const dirX = sin(radShadowAz);
    const dirY = cos(radShadowAz);
    const shadowLen = Math.max(0.5, this.simData.shadowLength);
    const pTip = project(dirX * shadowLen, dirY * shadowLen, 0);

    // Vektor i 2D fra skyggespids gennem motivets hoved mod solen
    const vx = pTop.x - pTip.x;
    const vy = pTop.y - pTip.y;
    const vLen = Math.hypot(vx, vy);

    let sunScreenX = cx;
    let sunScreenY = cy - 60;

    if (vLen > 0.001) {
      // Ønsket visuel afstand fra motivets hoved til solen på himlen
      const desiredDist = Math.max(70, Math.min(180, Math.min(w, h) * 0.44));
      const k = desiredDist / vLen;

      sunScreenX = pTop.x + vx * k;
      sunScreenY = pTop.y + vy * k;

      // Hold solen inden for synsfeltets rammer
      sunScreenX = Math.max(36, Math.min(w - 75, sunScreenX));
      sunScreenY = Math.max(28, Math.min(h * 0.65, sunScreenY));
    }

    this.ctx.save();

    const glowRadius = 40;
    const sunGlow = this.ctx.createRadialGradient(sunScreenX, sunScreenY, 4, sunScreenX, sunScreenY, glowRadius);

    if (isRed) {
      sunGlow.addColorStop(0, '#ff4d4d');
      sunGlow.addColorStop(0.35, 'rgba(220, 38, 38, 0.5)');
      sunGlow.addColorStop(1, 'rgba(127, 29, 29, 0)');
    } else if (altDeg < 6) {
      sunGlow.addColorStop(0, '#fbbf24');
      sunGlow.addColorStop(0.35, 'rgba(245, 158, 11, 0.6)');
      sunGlow.addColorStop(1, 'rgba(180, 83, 9, 0)');
    } else {
      sunGlow.addColorStop(0, '#ffffff');
      sunGlow.addColorStop(0.3, 'rgba(253, 224, 71, 0.7)');
      sunGlow.addColorStop(0.7, 'rgba(245, 158, 11, 0.3)');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    }

    this.ctx.fillStyle = sunGlow;
    this.ctx.beginPath();
    this.ctx.arc(sunScreenX, sunScreenY, glowRadius, 0, PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = isRed ? '#ff6666' : altDeg < 6 ? '#fef08a' : '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(sunScreenX, sunScreenY, 11, 0, PI * 2);
    this.ctx.fill();

    // Gylden stiplet lysstråle fra solen ned til motivet (kollinær med skyggen)
    this.ctx.strokeStyle = isRed ? 'rgba(255, 77, 77, 0.55)' : 'rgba(251, 191, 36, 0.55)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(sunScreenX, sunScreenY);
    this.ctx.lineTo(pTop.x, pTop.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Sol-mærkat
    this.ctx.fillStyle = isRed ? '#ff4d4d' : '#fbbf24';
    this.ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = sunScreenX > cx ? 'left' : 'right';
    const textX = sunScreenX > cx ? sunScreenX + 16 : sunScreenX - 16;
    this.ctx.fillText(`SOL ${altDeg >= 0 ? '+' : ''}${altDeg.toFixed(1)}°`, textX, sunScreenY - 4);
    this.ctx.fillStyle = isRed ? '#c93434' : '#94a3b8';
    this.ctx.fillText(`${azDeg.toFixed(0)}° ${AstroCore.getCompassDirection(azDeg)}`, textX, sunScreenY + 10);

    this.ctx.restore();
  }

  private drawSubHorizonIndicator(w: number, h: number, altDeg: number): void {
    const isRed = this.isNightRedMode();
    this.ctx.save();
    this.ctx.fillStyle = isRed ? '#ff4d4d' : '#818cf8';
    this.ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = 'center';
    const badgeText = altDeg < -18 ? 'ASTRONOMISK NAT' : altDeg < -6 ? 'TUSMØRKE' : 'BLÅ TIME';
    this.ctx.fillText(`☾ ${badgeText} (SOL ${altDeg.toFixed(1)}° UNDER HORISONTEN)`, w * 0.5, 34);
    this.ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    this.ctx.fillStyle = isRed ? '#8b1e1e' : '#64748b';
    this.ctx.fillText('Ingen hårde direkte skygger – diffus belysning', w * 0.5, 50);
    this.ctx.restore();
  }

  private drawEvfOverlay(w: number, h: number): void {
    const isRed = this.isNightRedMode();
    const reticleColor = isRed ? 'rgba(255, 60, 60, 0.25)' : 'rgba(255, 255, 255, 0.2)';
    const rLen = 14;
    const pad = 12;

    this.ctx.save();
    this.ctx.strokeStyle = reticleColor;
    this.ctx.lineWidth = 1.5;

    // Hjørnemærker (EVF søgeramme)
    this.ctx.beginPath();
    this.ctx.moveTo(pad, pad + rLen);
    this.ctx.lineTo(pad, pad);
    this.ctx.lineTo(pad + rLen, pad);
    this.ctx.moveTo(w - pad - rLen, pad);
    this.ctx.lineTo(w - pad, pad);
    this.ctx.lineTo(w - pad, pad + rLen);
    this.ctx.moveTo(pad, h - pad - rLen);
    this.ctx.lineTo(pad, h - pad);
    this.ctx.lineTo(pad + rLen, h - pad);
    this.ctx.moveTo(w - pad - rLen, h - pad);
    this.ctx.lineTo(w - pad, h - pad);
    this.ctx.lineTo(w - pad, h - pad - rLen);
    this.ctx.stroke();

    // Roterende 3D kompasrose i øverste højre hjørne
    this.drawMiniCompassRose(w, h);

    // Instruktion i bunden
    this.ctx.fillStyle = isRed ? 'rgba(201, 52, 52, 0.6)' : 'rgba(148, 163, 184, 0.5)';
    this.ctx.font = '9px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('TRÆK FOR AT ROTERE 3D-SØGER', w * 0.5, h - 16);
    this.ctx.restore();
  }

  private drawMiniCompassRose(w: number, _h: number): void {
    const radius = 24;
    const cx = w - 46;
    const cy = 46;
    const isRed = this.isNightRedMode();

    this.ctx.save();

    // Baggrunds-skive for mini-kompas
    this.ctx.fillStyle = isRed ? 'rgba(24, 2, 2, 0.92)' : 'rgba(15, 23, 42, 0.9)';
    this.ctx.strokeStyle = isRed ? 'rgba(255, 60, 60, 0.3)' : 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Kameraet ser mod this.camera.azimuth.
    // Ligeud i søgeren er "OP" (-90 grader).
    // Nord ligger ved vinkel (-camera.azimuth - 90) grader.
    const camAz = this.camera.azimuth;
    const northAngle = (-camAz - 90) * rad;

    const nLen = radius - 6;
    const tipNx = cx + cos(northAngle) * nLen;
    const tipNy = cy + sin(northAngle) * nLen;
    const tipSx = cx - cos(northAngle) * (nLen * 0.65);
    const tipSy = cy - sin(northAngle) * (nLen * 0.65);

    // Syd-nål (grå)
    this.ctx.strokeStyle = isRed ? 'rgba(201, 52, 52, 0.45)' : 'rgba(148, 163, 184, 0.45)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(tipSx, tipSy);
    this.ctx.stroke();

    // Nord-nål (rød)
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(tipNx, tipNy);
    this.ctx.stroke();

    // Tydeligt 'N' mærke
    const labelNx = cx + cos(northAngle) * (radius - 5);
    const labelNy = cy + sin(northAngle) * (radius - 5);
    this.ctx.font = 'bold 9px ui-monospace, SFMono-Regular, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillText('N', labelNx, labelNy);

    // Sol-indikator på kanten af mini-kompasset
    const sunAngle = (this.simData.sunAzimuth - camAz - 90) * rad;
    const sunDotX = cx + cos(sunAngle) * (radius - 2);
    const sunDotY = cy + sin(sunAngle) * (radius - 2);
    this.ctx.fillStyle = isRed ? '#ff6666' : '#fbbf24';
    this.ctx.beginPath();
    this.ctx.arc(sunDotX, sunDotY, 3.5, 0, PI * 2);
    this.ctx.fill();

    // Skygge-indikator på kanten af mini-kompasset
    const shadowAngle = (this.simData.shadowAzimuth - camAz - 90) * rad;
    const shadowDotX = cx + cos(shadowAngle) * (radius - 2);
    const shadowDotY = cy + sin(shadowAngle) * (radius - 2);
    this.ctx.fillStyle = isRed ? '#ff3333' : '#38bdf8';
    this.ctx.beginPath();
    this.ctx.arc(shadowDotX, shadowDotY, 2.5, 0, PI * 2);
    this.ctx.fill();

    // Lille centrum-prik
    this.ctx.fillStyle = isRed ? '#ff4d4d' : '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 2, 0, PI * 2);
    this.ctx.fill();

    // Retningstekst under mini-kompas
    const camDirText = `${Math.round(camAz)}° ${AstroCore.getCompassDirection(camAz)}`;
    this.ctx.font = '9px ui-monospace, SFMono-Regular, monospace';
    this.ctx.fillStyle = isRed ? '#c93434' : '#94a3b8';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(camDirText, cx, cy + radius + 10);

    this.ctx.restore();
  }

  private renderCompassView(w: number, h: number): void {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const r = Math.min(w, h) * 0.42;
    const isRed = this.isNightRedMode();

    this.ctx.fillStyle = isRed ? '#080000' : '#070a12';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, PI * 2);
    this.ctx.fillStyle = isRed ? '#140202' : '#0f172a';
    this.ctx.fill();
    this.ctx.strokeStyle = isRed ? 'rgba(255, 50, 50, 0.25)' : 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    for (let degStep = 0; degStep < 360; degStep += 10) {
      const a = (degStep - 90) * rad;
      const isMajor = degStep % 30 === 0;
      const isCardinal = degStep % 90 === 0;
      const tickLen = isCardinal ? 12 : isMajor ? 8 : 4;

      const x1 = cx + cos(a) * r;
      const y1 = cy + sin(a) * r;
      const x2 = cx + cos(a) * (r - tickLen);
      const y2 = cy + sin(a) * (r - tickLen);

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = isCardinal ? (isRed ? '#ff4d4d' : '#38bdf8') : isRed ? 'rgba(255, 50, 50, 0.15)' : 'rgba(255, 255, 255, 0.12)';
      this.ctx.lineWidth = isCardinal ? 2 : 1;
      this.ctx.stroke();

      if (isMajor) {
        const labelX = cx + cos(a) * (r - 20);
        const labelY = cy + sin(a) * (r - 20);
        this.ctx.font = isCardinal ? 'bold 12px ui-monospace, monospace' : '9px ui-monospace, monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = isCardinal ? (degStep === 0 ? '#f43f5e' : isRed ? '#ff4d4d' : '#38bdf8') : isRed ? '#8b1e1e' : '#64748b';

        const cardinalName = degStep === 0 ? 'N' : degStep === 90 ? 'Ø' : degStep === 180 ? 'S' : degStep === 270 ? 'V' : `${degStep}°`;
        this.ctx.fillText(cardinalName, labelX, labelY);
      }
    }

    if (this.simData.sunTimes?.sunrise && this.simData.sunTimes?.sunset) {
      const risePos = AstroCore.getSunPosition(this.simData.sunTimes.sunrise, this.simData.lat, this.simData.lng);
      const setPos = AstroCore.getSunPosition(this.simData.sunTimes.sunset, this.simData.lat, this.simData.lng);

      this.ctx.beginPath();
      const startAngle = (risePos.azimuth - 90) * rad;
      const endAngle = (setPos.azimuth - 90) * rad;
      this.ctx.arc(cx, cy, r * 0.75, startAngle, endAngle, false);
      this.ctx.strokeStyle = isRed ? 'rgba(255, 77, 77, 0.35)' : 'rgba(245, 158, 11, 0.35)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    const sunAngle = (this.simData.sunAzimuth - 90) * rad;
    const sunX = cx + cos(sunAngle) * (r * 0.92);
    const sunY = cy + sin(sunAngle) * (r * 0.92);

    this.ctx.strokeStyle = isRed ? '#ff5533' : '#f59e0b';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(sunX, sunY);
    this.ctx.stroke();

    this.ctx.fillStyle = isRed ? '#ff6666' : '#fbbf24';
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, 8, 0, PI * 2);
    this.ctx.fill();

    if (this.simData.hasDirectShadow) {
      const shadowAngle = (this.simData.shadowAzimuth - 90) * rad;
      const shadowLenPx = Math.min(r * 0.85, (this.simData.shadowLength / 10) * r * 0.5);
      const shadowX = cx + cos(shadowAngle) * shadowLenPx;
      const shadowY = cy + sin(shadowAngle) * shadowLenPx;

      this.ctx.strokeStyle = isRed ? '#ff3333' : '#38bdf8';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(shadowX, shadowY);
      this.ctx.stroke();

      this.ctx.fillStyle = isRed ? '#ff3333' : '#38bdf8';
      this.ctx.beginPath();
      this.ctx.arc(shadowX, shadowY, 5, 0, PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = isRed ? '#ff4d4d' : '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 4, 0, PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }
}
