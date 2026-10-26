/**
 * triangle-visualizer.ts - Grafisk vektor-rendering af Eksponeringstrekanten,
 * EV-lysmåler og dynamisk histogram for Fotografiske Signaler.
 */

import { ExposureEngine } from '../calculations/exposure-engine.ts';

export interface TriangleRenderData {
  aperture: number;
  shutter: number;
  iso: number;
  ev100: number;
  evCurrent: number;
  targetEv: number;
  deltaEv: number;
  isLocked: boolean;
  baseline: {
    aperture: number;
    shutter: number;
    iso: number;
    ev: number;
  } | null;
}

export class TriangleVisualizer {
  private svgEl: SVGSVGElement;
  private meterEl: HTMLElement;
  private histSvgEl: SVGSVGElement;
  private statusTextEl: HTMLElement;

  constructor(
    svgEl: SVGSVGElement,
    meterEl: HTMLElement,
    histSvgEl: SVGSVGElement,
    statusTextEl: HTMLElement
  ) {
    this.svgEl = svgEl;
    this.meterEl = meterEl;
    this.histSvgEl = histSvgEl;
    this.statusTextEl = statusTextEl;
  }

  public render(data: TriangleRenderData): void {
    this.renderTriangle(data);
    this.renderMeter(data);
    this.renderHistogram(data);
  }

  private renderTriangle(data: TriangleRenderData): void {
    // Dimensioner i viewBox: 0 0 400 320
    // Vertices:
    // Top (Blænde): x = 200, y = 45
    // Venstre (Lukker): x = 50, y = 265
    // Højre (ISO): x = 350, y = 265
    const topX = 200, topY = 45;
    const leftX = 50, leftY = 265;
    const rightX = 350, rightY = 265;
    const centerX = 200, centerY = 191;

    // Forskyd midterbalancemarkør efter deltaEv (-3 til +3)
    // Hvis overeksponeret (delta > 0), trækkes mod et lysende centrum/udvidelse
    // Hvis balanceret (delta = 0), præcist i midten
    const clampDelta = Math.max(-3, Math.min(3, data.deltaEv));
    const offsetX = (clampDelta / 3) * 22;
    const offsetY = -(clampDelta / 3) * 16;
    const indicatorX = centerX + offsetX;
    const indicatorY = centerY + offsetY;

    // Farve for balancestatus
    let balanceColor = 'var(--accent-exposure, #a855f7)';
    let balanceGlow = 'rgba(168, 85, 247, 0.4)';
    if (Math.abs(data.deltaEv) <= 0.33) {
      balanceColor = 'var(--accent-success, #10b981)';
      balanceGlow = 'rgba(16, 185, 129, 0.5)';
    } else if (data.deltaEv > 1.5 || data.deltaEv < -1.5) {
      balanceColor = 'var(--accent-danger, #ef4444)';
      balanceGlow = 'rgba(239, 68, 68, 0.5)';
    } else {
      balanceColor = 'var(--accent-warning, #f59e0b)';
      balanceGlow = 'rgba(245, 158, 11, 0.5)';
    }

    this.svgEl.innerHTML = `
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${balanceGlow}" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
        <linearGradient id="edgeGradTopLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8" />
        </linearGradient>
        <linearGradient id="edgeGradTopRight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#a855f7" stop-opacity="0.8" />
        </linearGradient>
        <linearGradient id="edgeGradBottom" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#a855f7" stop-opacity="0.8" />
        </linearGradient>
      </defs>

      <!-- Trekant flade -->
      <polygon points="${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}"
               fill="var(--bg-surface-elevated, #161b22)"
               fill-opacity="0.55"
               stroke="var(--border-subtle, rgba(255,255,255,0.1))"
               stroke-width="1.5" />

      <!-- Vektorlinjer fra centrum til hjørner -->
      <line x1="${topX}" y1="${topY}" x2="${centerX}" y2="${centerY}" stroke="var(--border-subtle)" stroke-dasharray="3,3" />
      <line x1="${leftX}" y1="${leftY}" x2="${centerX}" y2="${centerY}" stroke="var(--border-subtle)" stroke-dasharray="3,3" />
      <line x1="${rightX}" y1="${rightY}" x2="${centerX}" y2="${centerY}" stroke="var(--border-subtle)" stroke-dasharray="3,3" />

      <!-- Farvede trekantkanter -->
      <line x1="${topX}" y1="${topY}" x2="${leftX}" y2="${leftY}" stroke="url(#edgeGradTopLeft)" stroke-width="2.5" />
      <line x1="${topX}" y1="${topY}" x2="${rightX}" y2="${rightY}" stroke="url(#edgeGradTopRight)" stroke-width="2.5" />
      <line x1="${leftX}" y1="${leftY}" x2="${rightX}" y2="${rightY}" stroke="url(#edgeGradBottom)" stroke-width="2.5" />

      <!-- Lysbalance glød i centrum -->
      <circle cx="${indicatorX}" cy="${indicatorY}" r="38" fill="url(#centerGlow)" />
      <circle cx="${indicatorX}" cy="${indicatorY}" r="8" fill="${balanceColor}" stroke="#ffffff" stroke-width="2" />
      <circle cx="${indicatorX}" cy="${indicatorY}" r="2" fill="#000000" />

      <!-- TOP VERTEX: BLÆNDE -->
      <g transform="translate(${topX}, ${topY})">
        <circle cx="0" cy="0" r="22" fill="var(--bg-card, #0f1217)" stroke="#f59e0b" stroke-width="2" />
        <text x="0" y="-2" font-size="11" font-weight="800" fill="#f59e0b" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">f/${data.aperture}</text>
        <text x="0" y="8" font-size="8" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="middle">BLÆNDE</text>
        <!-- Pædagogisk undertitel -->
        <text x="0" y="-28" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle">Dybdeskarphed & Lys</text>
      </g>

      <!-- VENSTRE VERTEX: LUKKERTID -->
      <g transform="translate(${leftX}, ${leftY})">
        <circle cx="0" cy="0" r="24" fill="var(--bg-card, #0f1217)" stroke="#38bdf8" stroke-width="2" />
        <text x="0" y="-2" font-size="11" font-weight="800" fill="#38bdf8" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">${ExposureEngine.formatShutterSpeed(data.shutter)}</text>
        <text x="0" y="8" font-size="8" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="middle">LUKKER</text>
        <!-- Pædagogisk undertitel -->
        <text x="0" y="32" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle">Bevægelse & Frys</text>
      </g>

      <!-- HØJRE VERTEX: ISO -->
      <g transform="translate(${rightX}, ${rightY})">
        <circle cx="0" cy="0" r="24" fill="var(--bg-card, #0f1217)" stroke="#a855f7" stroke-width="2" />
        <text x="0" y="-2" font-size="11" font-weight="800" fill="#a855f7" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">${data.iso}</text>
        <text x="0" y="8" font-size="8" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="middle">ISO</text>
        <!-- Pædagogisk undertitel -->
        <text x="0" y="32" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle">Lysfølsomhed & Støj</text>
      </g>

      <!-- Center EV Badge -->
      <g transform="translate(${centerX}, ${centerY + 45})">
        <rect x="-42" y="-12" width="84" height="24" rx="12" fill="var(--bg-surface-elevated, #161b22)" stroke="var(--border-subtle)" />
        <text x="0" y="1" font-size="10" font-weight="700" fill="var(--text-main)" text-anchor="middle" dominant-baseline="middle" font-family="var(--font-mono)">EV ${data.evCurrent.toFixed(1)}</text>
      </g>
    `;
  }

  private renderMeter(data: TriangleRenderData): void {
    // DeltaEv: -3 (undereksponeret) til +3 (overeksponeret)
    // I fri tilstand vises måleren neutralt i midten
    const effectiveDelta = data.isLocked ? data.deltaEv : 0;
    const clampDelta = Math.max(-3, Math.min(3, effectiveDelta));
    const percent = ((clampDelta + 3) / 6) * 100;

    let deltaFormatted = `${effectiveDelta >= 0 ? '+' : ''}${effectiveDelta.toFixed(1)} EV`;
    let statusClass = 'status-balanced';
    let statusLabel = 'Balanceret eksponering';
    let adviceText = 'Kombinationen matcher dit låste udgangspunkt.';

    if (!data.isLocked) {
      statusClass = 'status-balanced';
      statusLabel = 'Fri tilstand • Indstil måling';
      adviceText = 'Juster blænde, lukker og ISO til hvad dit kamera måler, og tryk derefter på "Lås som udgangspunkt".';
    } else if (effectiveDelta <= -0.2) {
      statusClass = 'status-under';
      statusLabel = `Undereksponeret (${deltaFormatted})`;
      adviceText = 'Indstillingerne har nået grænsen og lukker mindre lys ind end dit låste udgangspunkt.';
    } else if (effectiveDelta >= 0.2) {
      statusClass = 'status-over';
      statusLabel = `Overeksponeret (${deltaFormatted})`;
      adviceText = 'Indstillingerne har nået grænsen og lukker mere lys ind end dit låste udgangspunkt.';
    }

    this.meterEl.innerHTML = `
      <div class="ev-meter-scale">
        <div class="meter-tick" style="left: 0%;"><span>-3</span></div>
        <div class="meter-tick" style="left: 16.66%;"><span>-2</span></div>
        <div class="meter-tick" style="left: 33.33%;"><span>-1</span></div>
        <div class="meter-tick center" style="left: 50%;"><span>0</span></div>
        <div class="meter-tick" style="left: 66.66%;"><span>+1</span></div>
        <div class="meter-tick" style="left: 83.33%;"><span>+2</span></div>
        <div class="meter-tick" style="left: 100%;"><span>+3</span></div>
        
        <!-- Nål -->
        <div class="meter-needle ${statusClass}" style="left: ${percent}%;"></div>
      </div>
    `;

    const lockStatusHeader = data.isLocked && data.baseline
      ? `🔒 LÅST TIL EV ${data.baseline.ev.toFixed(1)}`
      : `🔓 FRI MÅLING (EV ${data.evCurrent.toFixed(1)})`;

    this.statusTextEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <span class="fs-badge badge-${statusClass}">${statusLabel}</span>
        <span style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted);">${lockStatusHeader}</span>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; margin: 0;">${adviceText}</p>
    `;
  }

  private renderHistogram(data: TriangleRenderData): void {
    const width = 240;
    const height = 60;
    const pathD = ExposureEngine.generateHistogramPath(data.deltaEv, width, height);

    // Farve og clipping advarsler
    const isShadowClip = data.deltaEv < -1.8;
    const isHighlightClip = data.deltaEv > 1.8;

    this.histSvgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.histSvgEl.innerHTML = `
      <defs>
        <linearGradient id="histGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="var(--accent-exposure, #a855f7)" stop-opacity="0.8" />
          <stop offset="100%" stop-color="var(--accent-exposure, #a855f7)" stop-opacity="0.1" />
        </linearGradient>
      </defs>

      <!-- Histogram grid linjer for zoner (skygger, mellemtoner, højlys) -->
      <line x1="${width * 0.33}" y1="0" x2="${width * 0.33}" y2="${height}" stroke="var(--border-subtle)" stroke-dasharray="2,2" />
      <line x1="${width * 0.66}" y1="0" x2="${width * 0.66}" y2="${height}" stroke="var(--border-subtle)" stroke-dasharray="2,2" />

      <!-- Selve kurven -->
      <path d="${pathD}" fill="url(#histGradient)" stroke="var(--accent-exposure, #a855f7)" stroke-width="1.5" />

      <!-- Clipping indikatorer i kanterne -->
      ${isShadowClip ? `<rect x="0" y="0" width="4" height="${height}" fill="var(--accent-danger, #ef4444)" opacity="0.9" />` : ''}
      ${isHighlightClip ? `<rect x="${width - 4}" y="0" width="4" height="${height}" fill="var(--accent-danger, #ef4444)" opacity="0.9" />` : ''}
    `;
  }
}
