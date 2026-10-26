/**
 * StudioTimelineDock.ts - Samlet bund-dock for Fotografiske Signaler – Desktop Studio
 * Erstatter det gamle Vejr-modul og tidsslidere med:
 *  - Række 1: 7-Døgns prognose-vælger + De 4 Fotovindue-Badges (Morgentåge, Morgenlys, Aftenlys, Astro)
 *             med øjeblikkelig klik-for-at-synkronisere + svævende detaljekort ved hover/klik
 *             samt astronomiske hurtigspring (Blå time, Solopgang, Solmiddag, Solnedgang)
 *  - Række 2: Interaktiv 24-timers HTML5 Canvas graf (00:00 -> 23:59) med:
 *             • Farvebånd for Nat / Blå time / Gylden time / Dagslys
 *             • Skydække-søjler (0-100%) time for time
 *             • Solhøjde-kurve (gylden) og Månehøjde-kurve (lilla stiplet)
 *             • Time-for-time vejr-ikoner, temperatur og vind i bunden af grafen
 *             • Trækbar Playhead-linje der scrubber igennem døgnet ved 60 fps!
 */

import { StudioState, StudioSnapshot } from './StudioState.ts';
import { TimeService } from '../shared/services/TimeService.ts';
import { WeatherEngine } from '../modules/weather/calculations/weather-engine.ts';
import { AstroCore } from '../shared/astronomy/AstroCore.ts';

export class StudioTimelineDock {
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isScrubbing = false;
  private latestSnap: StudioSnapshot | null = null;
  private activeDetailType: 'fog' | 'morning' | 'evening' | 'astro' | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderSkeleton();
    this.attachEvents();
  }

  private renderSkeleton(): void {
    this.container.innerHTML = `
      <div class="studio-timeline-dock">
        <!-- RÆKKE 1: 7 DAGE + 4 FOTOVINDUER + HURTIGSPRING -->
        <div class="timeline-top-strip">
          <!-- 7 Dages Vælger -->
          <div class="dock-days-row" id="dockDaysRow"></div>

          <div class="dock-divider"></div>

          <!-- De 4 Fotovinduer for den valgte dag -->
          <div class="dock-events-row" id="dockEventsRow"></div>

          <div class="dock-divider"></div>

          <!-- Astronomiske Hurtigspring -->
          <div class="dock-jumps-row" id="dockJumpsRow"></div>

          <!-- Detalje-popover når man holder musen over eller klikker info på et fotovindue -->
          <div class="dock-event-popover hidden" id="dockEventPopover"></div>
        </div>

        <!-- RÆKKE 2: 24-TIMERS VISUEL LYS-, SOL- & VEJRGRAF -->
        <div class="timeline-canvas-wrap" id="timelineCanvasWrap">
          <canvas id="studioTimelineCanvas"></canvas>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#studioTimelineCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  private attachEvents(): void {
    const scrubFromClientX = (clientX: number) => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const totalMins = Math.round(ratio * 1439);
      const cur = TimeService.getDate();
      const next = new Date(cur);
      next.setHours(Math.floor(totalMins / 60), totalMins % 60, 0, 0);
      TimeService.setDate(next);
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isScrubbing = true;
      scrubFromClientX(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isScrubbing) {
        scrubFromClientX(e.clientX);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isScrubbing = false;
    });

    window.addEventListener('resize', () => {
      if (this.latestSnap) {
        this.draw24hGraph(this.latestSnap);
      }
    });
  }

  public update(snap: StudioSnapshot): void {
    this.latestSnap = snap;
    this.renderDaysStrip(snap);
    this.renderPhotoWindowsStrip(snap);
    this.renderQuickJumps(snap);
    this.draw24hGraph(snap);
  }

  private renderDaysStrip(snap: StudioSnapshot): void {
    const daysEl = this.container.querySelector('#dockDaysRow') as HTMLElement;
    if (!daysEl) return;

    if (snap.days.length === 0) {
      daysEl.innerHTML = `<span style="font-size:11px;color:var(--text-dim);">Henter 7-døgns vejr...</span>`;
      return;
    }

    daysEl.innerHTML = snap.days
      .map((d, i) => {
        const label = i === 0 ? 'I dag' : d.dayName.substring(0, 3);
        const wInfo = WeatherEngine.getWeatherCodeDescription(d.weatherCode);
        return `
          <button class="dock-day-btn ${i === snap.selectedDayIndex ? 'active' : ''}" data-day-idx="${i}" title="${d.dayName} d. ${d.date.getDate()}: ${wInfo.desc}">
            <span class="dd-name">${label} ${d.date.getDate()}.</span>
            <span class="dd-icon">${wInfo.icon}</span>
            <span class="dd-temp tabular-nums">${Math.round(d.minTemp)}°/${Math.round(d.maxTemp)}°</span>
          </button>
        `;
      })
      .join('');

    daysEl.querySelectorAll('[data-day-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn as HTMLElement).dataset.dayIdx);
        StudioState.selectDayIndex(idx);
      });
    });
  }

  private renderPhotoWindowsStrip(snap: StudioSnapshot): void {
    const eventsEl = this.container.querySelector('#dockEventsRow') as HTMLElement;
    const popoverEl = this.container.querySelector('#dockEventPopover') as HTMLElement;
    if (!eventsEl) return;

    const day = snap.selectedDay;
    if (!day) {
      eventsEl.innerHTML = '';
      return;
    }

    const scoreClass = (s: number) => (s >= 70 ? 'score-high' : s >= 45 ? 'score-mid' : 'score-low');

    const fogTime = day.sun.sunrise ? new Date(day.sun.sunrise.getTime() - 30 * 60000) : day.date;
    const mornTime = day.sun.sunrise || day.date;
    const eveTime = day.sun.goldenHourEvening?.start || day.sun.sunset || day.date;
    const astroTime = day.sun.astronomicalDusk || new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 23, 0);

    const items = [
      {
        id: 'fog' as const,
        icon: day.fog.icon,
        title: 'Morgentåge',
        score: day.fog.score,
        time: fogTime,
        summary: `${day.fog.text} (Dugpunkt Δ${day.fog.avgSpread}°C • Fugt ${day.fog.avgHumidity}% • Vind ${day.fog.avgWind} m/s)`
      },
      {
        id: 'morning' as const,
        icon: day.goldenHourMorning.icon,
        title: 'Morgenlys',
        score: day.goldenHourMorning.score,
        time: mornTime,
        summary: `${day.goldenHourMorning.text} (Skyer: Total ${day.goldenHourMorning.clouds.total}%, Lav ${day.goldenHourMorning.clouds.low}%, Høj ${day.goldenHourMorning.clouds.high}%)`
      },
      {
        id: 'evening' as const,
        icon: day.goldenHourEvening.icon,
        title: 'Aftenlys',
        score: day.goldenHourEvening.score,
        time: eveTime,
        summary: `${day.goldenHourEvening.text} (Skyer: Total ${day.goldenHourEvening.clouds.total}%, Lav ${day.goldenHourEvening.clouds.low}%, Høj ${day.goldenHourEvening.clouds.high}%)`
      },
      {
        id: 'astro' as const,
        icon: day.astro.icon,
        title: 'Stjerner & Nat',
        score: day.astro.score,
        time: astroTime,
        summary: `${day.astro.text} • ${day.astro.moonImpact}`
      }
    ];

    eventsEl.innerHTML = items
      .map(
        (it) => `
        <button class="dock-photo-window-pill ${scoreClass(it.score)}" data-win-id="${it.id}" data-win-time="${it.time.getTime()}" title="${it.summary} — Klik for at hoppe til kl. ${TimeService.formatTime(it.time)}">
          <span class="pw-icon">${it.icon}</span>
          <div class="pw-text">
            <span class="pw-title">${it.title} <small class="tabular-nums">${TimeService.formatTime(it.time)}</small></span>
            <span class="pw-score tabular-nums">${it.score}/100</span>
          </div>
        </button>
      `
      )
      .join('');

    eventsEl.querySelectorAll('.dock-photo-window-pill').forEach((btn) => {
      const id = (btn as HTMLElement).dataset.winId as 'fog' | 'morning' | 'evening' | 'astro';
      const item = items.find((x) => x.id === id)!;

      btn.addEventListener('click', () => {
        const ms = Number((btn as HTMLElement).dataset.winTime);
        TimeService.setDate(new Date(ms));
      });

      btn.addEventListener('mouseenter', () => {
        if (!popoverEl) return;
        popoverEl.classList.remove('hidden');
        popoverEl.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <strong>${item.icon} ${item.title} (kl. ${TimeService.formatTime(item.time)})</strong>
            <span class="fs-badge">${item.score}/100</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.35;">${item.summary}</div>
          <div style="font-size:10px;color:var(--accent-sun);margin-top:4px;">Klik på boksen for at sætte tidslinjen og kortet til kl. ${TimeService.formatTime(item.time)}</div>
        `;
      });

      btn.addEventListener('mouseleave', () => {
        popoverEl?.classList.add('hidden');
      });
    });
  }

  private renderQuickJumps(snap: StudioSnapshot): void {
    const jumpsEl = this.container.querySelector('#dockJumpsRow') as HTMLElement;
    if (!jumpsEl) return;

    const st = snap.sunTimes;
    const jumps = [
      { label: 'Blå morgen', time: st.blueHourMorning?.start },
      { label: 'Solopgang', time: st.sunrise },
      { label: 'Solmiddag', time: st.solarNoon },
      { label: 'Gylden aften', time: st.goldenHourEvening?.start },
      { label: 'Solnedgang', time: st.sunset },
      { label: 'Blå aften', time: st.blueHourEvening?.end }
    ].filter((j) => j.time != null);

    jumpsEl.innerHTML = jumps
      .map(
        (j) => `
        <button class="dock-jump-chip" data-jump-ms="${(j.time as Date).getTime()}">
          <span class="dj-time tabular-nums">${TimeService.formatTime(j.time)}</span>
          <span class="dj-label">${j.label}</span>
        </button>
      `
      )
      .join('');

    jumpsEl.querySelectorAll('[data-jump-ms]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ms = Number((btn as HTMLElement).dataset.jumpMs);
        TimeService.setDate(new Date(ms));
      });
    });
  }

  private draw24hGraph(snap: StudioSnapshot): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 1100;
    const h = rect.height || 105;

    if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const isRed = document.body.classList.contains('theme-night-red');
    const graphTop = 6;
    const graphBottom = h - 24; // Nederste 24px er reserveret til time-tal, vejr-ikoner og temperatur
    const graphHeight = graphBottom - graphTop;
    const horizonY = graphTop + graphHeight * 0.62;

    const { lat, lng } = snap.location;
    const baseDay = new Date(snap.date.getFullYear(), snap.date.getMonth(), snap.date.getDate(), 0, 0, 0);

    // 1. Tegn lysfase-baggrundsbånd og beregn sol/måne-punkter hen over de 24 timer
    const steps = 96; // Hvert 15. minut
    const sunPts: Array<{ x: number; y: number; alt: number }> = [];
    const moonPts: Array<{ x: number; y: number; alt: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const mins = (i / steps) * 1440;
      const t = new Date(baseDay.getTime() + mins * 60000);
      const sp = AstroCore.getSunPosition(t, lat, lng);
      const mp = AstroCore.getMoonPosition(t, lat, lng);

      const x = (i / steps) * w;
      const normSun = Math.max(-1, Math.min(1, sp.altitude / 65));
      const sunY = horizonY - normSun * (graphHeight * 0.55);

      const normMoon = Math.max(-1, Math.min(1, mp.altitude / 65));
      const moonY = horizonY - normMoon * (graphHeight * 0.55);

      sunPts.push({ x, y: sunY, alt: sp.altitude });
      moonPts.push({ x, y: moonY, alt: mp.altitude });

      if (i < steps) {
        const segW = w / steps + 1;
        let bandColor = 'rgba(8, 12, 24, 0.55)';
        if (isRed) {
          bandColor = sp.altitude > 0 ? 'rgba(60, 8, 8, 0.35)' : 'rgba(18, 2, 2, 0.55)';
        } else if (sp.altitude >= 6) {
          bandColor = 'rgba(56, 189, 248, 0.08)';
        } else if (sp.altitude >= 0) {
          bandColor = 'rgba(245, 158, 11, 0.22)'; // Gylden time
        } else if (sp.altitude >= -6) {
          bandColor = 'rgba(14, 165, 233, 0.18)'; // Blå time
        } else if (sp.altitude >= -18) {
          bandColor = 'rgba(99, 102, 241, 0.10)'; // Tusmørke
        }
        ctx.fillStyle = bandColor;
        ctx.fillRect(x, graphTop, segW, graphHeight);
      }
    }

    // 2. Tegn Skydække-søjler og time-for-time vejr i bunden for hver af de 24 timer
    const hourly = snap.selectedDay?.hourly || [];
    const colW = w / 24;

    for (let hr = 0; hr < 24; hr++) {
      const xCenter = (hr + 0.5) * colW;
      const hData = hourly.find((item) => item.hour === hr);

      // Lodret timelinje
      ctx.strokeStyle = isRed ? 'rgba(255, 50, 50, 0.1)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hr * colW, 0);
      ctx.lineTo(hr * colW, h);
      ctx.stroke();

      if (hData) {
        // Skydække-søjle fra toppen og nedad
        const cloudH = (hData.cloudTotal / 100) * (graphHeight * 0.42);
        ctx.fillStyle = isRed ? 'rgba(255, 70, 70, 0.14)' : 'rgba(148, 163, 184, 0.16)';
        ctx.fillRect(hr * colW + 2, graphTop, colW - 4, cloudH);
      }

      // Bund-etiket: Klokkeslæt + Vejr-ikon + Temperatur
      ctx.font = '600 10px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isRed ? '#c93434' : '#94a3b8';
      const timeStr = `${String(hr).padStart(2, '0')}`;
      ctx.fillText(timeStr, xCenter, h - 13);

      if (hData) {
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillStyle = isRed ? '#ff6666' : '#e2e8f0';
        ctx.fillText(`${hData.weatherIcon}${Math.round(hData.temp)}°`, xCenter, h - 2);
      }
    }

    // 3. Horisontlinje (0° solhøjde)
    ctx.strokeStyle = isRed ? 'rgba(255, 80, 80, 0.35)' : 'rgba(255, 255, 255, 0.22)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Månehøjde-kurve (stiplet lilla)
    ctx.strokeStyle = isRed ? 'rgba(255, 90, 90, 0.4)' : 'rgba(168, 85, 247, 0.55)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    moonPts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Solhøjde-kurve (gylden)
    ctx.strokeStyle = isRed ? '#ff4d4d' : '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    sunPts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // 6. Aktuel Playhead-linje og Sol-markør
    const curMins = snap.date.getHours() * 60 + snap.date.getMinutes();
    const playheadX = (curMins / 1440) * w;
    const normCurSun = Math.max(-1, Math.min(1, snap.sunPos.altitude / 65));
    const curSunY = horizonY - normCurSun * (graphHeight * 0.55);

    ctx.strokeStyle = isRed ? '#ff6666' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();

    // Sol-kugle på playhead
    ctx.fillStyle = isRed ? '#ff4d4d' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(playheadX, curSunY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#07080a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Playhead tids-badge øverst
    const badgeW = 98;
    const badgeH = 18;
    const bx = Math.max(4, Math.min(w - badgeW - 4, playheadX - badgeW / 2));
    ctx.fillStyle = isRed ? '#ff4d4d' : '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(bx, 2, badgeW, badgeH, 4);
    ctx.fill();

    ctx.fillStyle = '#07080a';
    ctx.font = 'bold 10.5px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${TimeService.formatTime(snap.date)} (${snap.sunPos.altitude >= 0 ? '+' : ''}${snap.sunPos.altitude.toFixed(0)}°)`,
      bx + badgeW / 2,
      14
    );

    ctx.restore();
  }
}
