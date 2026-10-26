/**
 * index.ts - Vejr Desktop Panel
 * Synkroniserer med Global Master-Tid og Lokation, og sender aktuelt skydække til WorkspaceState (for Auto-EV).
 * Klik på fotovinduer eller på en time-kolonne sætter Master-Tiden, så Sol- og Kort-panelet straks drejer til det valgte tidspunkt!
 */

import { ModuleInstance } from '../../app/ModuleRegistry.ts';
import { WorkspaceState } from '../../app/WorkspaceState.ts';
import { WeatherEngine, DayForecast, ForecastResult, EventTiming } from './calculations/weather-engine.ts';
import { LocationService, GeoLocation } from '../../shared/services/LocationService.ts';
import { TimeService } from '../../shared/services/TimeService.ts';
import './weather.css';

export default class WeatherModule implements ModuleInstance {
  private container!: HTMLElement;
  private currentLocation: GeoLocation = LocationService.getLocation();
  private selectedDayIndex: number = 0;
  private forecastData: any = null;
  private parsedDays: DayForecast[] = [];
  private isCachedForecast: boolean = false;
  private cacheUpdatedAt: Date | null = null;
  private isLoading: boolean = false;

  private unsubLocation: (() => void) | null = null;
  private unsubTime: (() => void) | null = null;

  public async mount(container: HTMLElement): Promise<void> {
    this.container = container;
    this.currentLocation = LocationService.getLocation();
    this.render();
    this.attachEventListeners();
    await this.loadWeather();

    this.unsubLocation = LocationService.subscribe(async (loc) => {
      this.currentLocation = loc;
      await this.loadWeather(false);
    });

    this.unsubTime = TimeService.subscribe((d) => {
      this.syncDayWithMasterDate(d);
      this.broadcastCloudCoverForTime(d);
    });
  }

  public onActivate(): void {
    this.renderSelectedDay();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="weather-container desktop-weather-panel">
        <!-- OFFLINE STATUS BANNER -->
        <div class="weather-status-banner" id="weatherStatusBanner">
          <span id="weatherStatusText">Offline tilstand – gemt vejrudsigt</span>
          <span id="weatherStatusTime" style="font-family: var(--font-mono); font-weight: 700;"></span>
        </div>

        <!-- 7 DAGES VÆLGER + OPDATER KNAP -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div class="days-scroll-wrap" id="weatherDaysScroll" style="flex:1;">
            <div style="color: var(--text-dim); font-size: 13px; padding: 10px;">Henter 7-døgns vejrudsigt...</div>
          </div>
          <button class="fs-btn" id="btnWeatherRefresh" style="padding: 6px 10px; font-size: 11px; min-height: 32px; white-space: nowrap;" title="Hent frisk vejrudsigt fra Open-Meteo">
            🔄 Opdater
          </button>
        </div>

        <!-- INDHOLD FOR DEN VALGTE DAG -->
        <div id="weatherSelectedDayWrap"></div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    this.container.querySelector('#btnWeatherRefresh')?.addEventListener('click', () => {
      this.loadWeather(true);
    });
  }

  private syncDayWithMasterDate(masterDate: Date): void {
    if (this.parsedDays.length === 0) return;
    const foundIdx = this.parsedDays.findIndex(
      (d) =>
        d.date.getFullYear() === masterDate.getFullYear() &&
        d.date.getMonth() === masterDate.getMonth() &&
        d.date.getDate() === masterDate.getDate()
    );
    if (foundIdx !== -1 && foundIdx !== this.selectedDayIndex) {
      this.selectedDayIndex = foundIdx;
      const scrollEl = this.container.querySelector('#weatherDaysScroll');
      if (scrollEl) {
        scrollEl.querySelectorAll('.day-tab-card').forEach((c) => c.classList.remove('active'));
        scrollEl.querySelector(`[data-day="${this.selectedDayIndex}"]`)?.classList.add('active');
      }
      this.renderSelectedDay();
    } else {
      // Opdater aktiv time-markering i time-for-time tabellen
      this.highlightActiveHourOnTable(masterDate.getHours());
    }
  }

  private highlightActiveHourOnTable(hour: number): void {
    this.container.querySelectorAll('.hourly-col[data-hour]').forEach((col) => {
      const h = Number((col as HTMLElement).dataset.hour);
      col.classList.toggle('hourly-master-selected', h === hour);
    });
  }

  private broadcastCloudCoverForTime(date: Date): void {
    const day = this.parsedDays[this.selectedDayIndex];
    if (!day || !day.hourly) return;
    const hObj = day.hourly.find((h) => h.hour === date.getHours());
    if (hObj) {
      WorkspaceState.setCloudCoverForCurrentTime(hObj.cloudTotal);
    }
  }

  private async loadWeather(forceRefresh: boolean = false): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const result: ForecastResult = await WeatherEngine.fetchForecast(
        this.currentLocation.lat,
        this.currentLocation.lng,
        forceRefresh
      );

      this.forecastData = result.forecast;
      this.isCachedForecast = result.isCached;
      this.cacheUpdatedAt = result.updatedAt;

      this.parsedDays = [];
      for (let i = 0; i < 7; i++) {
        const parsed = WeatherEngine.parseDayData(this.forecastData, i, this.currentLocation.lat, this.currentLocation.lng);
        if (parsed) this.parsedDays.push(parsed);
      }

      this.renderDaysScroll();
      this.renderSelectedDay();
      this.renderStatusBanner();
      this.broadcastCloudCoverForTime(TimeService.getDate());
    } catch (err) {
      console.error('Fejl ved indlæsning af vejr:', err);
      const wrap = this.container.querySelector('#weatherSelectedDayWrap');
      if (wrap) {
        wrap.innerHTML = `
          <div class="fs-card" style="border-color:var(--accent-danger);">
            <h4 style="color:var(--accent-danger);margin-bottom:6px;">Kunne ikke hente vejrdata</h4>
            <p style="color:var(--text-muted);font-size:13px;">${(err as Error).message || 'Tjek din internetforbindelse'}</p>
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  private renderStatusBanner(): void {
    const banner = this.container.querySelector('#weatherStatusBanner') as HTMLElement;
    const timeEl = this.container.querySelector('#weatherStatusTime');
    if (!banner) return;

    if (this.isCachedForecast && this.cacheUpdatedAt) {
      banner.classList.add('active');
      if (timeEl) timeEl.textContent = `Hentet kl. ${TimeService.formatTime(this.cacheUpdatedAt)}`;
    } else {
      banner.classList.remove('active');
    }
  }

  public selectDay(idx: number): void {
    this.selectedDayIndex = Math.min(6, Math.max(0, idx));
    const scrollEl = this.container.querySelector('#weatherDaysScroll');
    if (scrollEl) {
      scrollEl.querySelectorAll('.day-tab-card').forEach((c) => c.classList.remove('active'));
      scrollEl.querySelector(`[data-day="${this.selectedDayIndex}"]`)?.classList.add('active');
    }

    // Synkroniser Master-Dato med den valgte dag (bevar klokkeslæt)
    const targetDay = this.parsedDays[this.selectedDayIndex];
    if (targetDay) {
      const cur = TimeService.getDate();
      const next = new Date(targetDay.date);
      next.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
      TimeService.setDate(next);
    }

    this.renderSelectedDay();
  }

  private renderDaysScroll(): void {
    const scrollEl = this.container.querySelector('#weatherDaysScroll');
    if (!scrollEl || this.parsedDays.length === 0) return;

    scrollEl.innerHTML = this.parsedDays
      .map((day, idx) => {
        const isToday = idx === 0;
        const name = isToday ? 'I dag' : day.dayName.substring(0, 3);
        const iconInfo = WeatherEngine.getWeatherCodeDescription(day.weatherCode);

        return `
        <div class="day-tab-card ${idx === this.selectedDayIndex ? 'active' : ''}" data-day="${idx}">
          <span class="day-name">${name}</span>
          <span class="day-date">${day.date.getDate()}</span>
          <span class="day-icon">${iconInfo.icon}</span>
          <span class="day-temp-range">${Math.round(day.minTemp)}° / ${Math.round(day.maxTemp)}°</span>
        </div>
      `;
      })
      .join('');

    scrollEl.querySelectorAll('[data-day]').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = Number((card as HTMLElement).dataset.day);
        this.selectDay(idx);
      });
    });
  }

  private renderSelectedDay(): void {
    const wrap = this.container.querySelector('#weatherSelectedDayWrap');
    if (!wrap || !this.parsedDays[this.selectedDayIndex]) return;

    const day = this.parsedDays[this.selectedDayIndex];
    const sun = day.sun;
    const moon = day.moon;
    const fog = day.fog;
    const morning = day.goldenHourMorning;
    const evening = day.goldenHourEvening;
    const astro = day.astro;
    const now = new Date();
    const masterDate = TimeService.getDate();
    const isToday = this.selectedDayIndex === 0;
    const isTomorrow = this.selectedDayIndex === 1;

    const fogStart = sun.civilDawn || (sun.sunrise ? new Date(sun.sunrise.getTime() - 45 * 60 * 1000) : null);
    const fogEnd = sun.sunriseEnd || (sun.sunrise ? new Date(sun.sunrise.getTime() + 65 * 60 * 1000) : null);
    const fogTiming: EventTiming = WeatherEngine.getEventTiming(fogStart, fogEnd, this.selectedDayIndex, day.date, 'fog', fog.score, now);

    const mStart = (sun.blueHourMorning && sun.blueHourMorning.start) || (sun.sunrise ? new Date(sun.sunrise.getTime() - 50 * 60 * 1000) : null);
    const mEnd = (sun.goldenHourMorning && sun.goldenHourMorning.end) || (sun.sunrise ? new Date(sun.sunrise.getTime() + 45 * 60 * 1000) : null);
    const morningTiming: EventTiming = WeatherEngine.getEventTiming(mStart, mEnd, this.selectedDayIndex, day.date, 'morning', morning.score, now);

    const eStart = (sun.goldenHourEvening && sun.goldenHourEvening.start) || (sun.sunset ? new Date(sun.sunset.getTime() - 45 * 60 * 1000) : null);
    const eEnd = (sun.blueHourEvening && sun.blueHourEvening.end) || (sun.sunset ? new Date(sun.sunset.getTime() + 45 * 60 * 1000) : null);
    const eveningTiming: EventTiming = WeatherEngine.getEventTiming(eStart, eEnd, this.selectedDayIndex, day.date, 'evening', evening.score, now);

    let aStart: Date | null = null;
    let aEnd: Date | null = null;
    if (sun.astronomicalDusk) {
      if (isToday && sun.astronomicalDawn && now < sun.astronomicalDawn) {
        aStart = new Date(sun.astronomicalDusk.getTime() - 24 * 60 * 60 * 1000);
        aEnd = sun.astronomicalDawn;
      } else {
        aStart = sun.astronomicalDusk;
        aEnd = sun.astronomicalDawn
          ? new Date(sun.astronomicalDawn.getTime() + 24 * 60 * 60 * 1000)
          : new Date(aStart.getTime() + 9 * 60 * 60 * 1000);
      }
    }
    const astroTiming: EventTiming = WeatherEngine.getEventTiming(aStart, aEnd, this.selectedDayIndex, day.date, 'astro', astro.score, now);

    const getScoreClass = (score: number) => {
      if (score >= 70) return 'score-high';
      if (score >= 40) return 'score-moderate';
      return 'score-low';
    };

    const renderTimingBanner = (t: EventTiming) => `
      <div class="card-timing-banner ${t.bannerClass}">
        <div class="timing-banner-left">
          <span class="timing-icon">${t.icon}</span>
          <span class="timing-label">${t.label}</span>
        </div>
        <span class="timing-banner-pill">${t.pill}</span>
      </div>
    `;

    const currentHour = now.getHours();
    const masterHour = masterDate.getHours();

    wrap.innerHTML = `
      <!-- ASTRONOMISK OVERBLIK (SOL & MÅNE) -->
      <div class="astro-overview-grid" style="margin-top:8px;">
        <div class="astro-sub-card">
          <div class="astro-sub-title"><span>☀️</span> Soltider (${day.dayName})</div>
          <div class="astro-sub-val tabular-nums">${TimeService.formatTime(sun.sunrise)} / ${TimeService.formatTime(sun.sunset)}</div>
          <div class="astro-sub-detail">Solopgang • Solnedgang</div>
          <div class="astro-sub-detail" style="color:var(--golden-primary);">Gylden aften: ${TimeService.formatTime(sun.goldenHourEvening?.start)} - ${TimeService.formatTime(sun.sunset)}</div>
        </div>

        <div class="astro-sub-card">
          <div class="astro-sub-title"><span>${moon.icon}</span> Måne</div>
          <div class="astro-sub-val tabular-nums">${moon.fraction}% • ${moon.name}</div>
          <div class="astro-sub-detail">Op: ${TimeService.formatTime(day.moonTimes?.rise)} • Ned: ${TimeService.formatTime(day.moonTimes?.set)}</div>
          <div class="astro-sub-detail" style="color:var(--accent-weather);">Astro nat: ${sun.nightSky?.start ? `${TimeService.formatTime(sun.nightSky.start)} - ${TimeService.formatTime(sun.nightSky.end)}` : 'Lyse nætter'}</div>
        </div>
      </div>

      <!-- FOTOGRAFISKE ANALYSE-KORT (2x2 Grid på Desktop) -->
      <div class="photo-event-grid desktop-weather-cards" style="margin-top: 10px;">
        <!-- 1. Morgentåge & Dis -->
        <div class="photo-card ${fogTiming.isPassed ? 'card-event-passed' : ''}">
          ${renderTimingBanner(fogTiming)}
          <div class="photo-card-top">
            <span class="photo-card-title">${fog.icon} Morgentåge & Dis</span>
            <span class="photo-score-badge ${getScoreClass(fog.score)}">${fog.score}/100 • ${fog.level}</span>
          </div>
          <div class="photo-card-time">
            Tidsvindue: ca. ${TimeService.formatTime(fogStart)} - ${TimeService.formatTime(fogEnd)}
          </div>
          <div class="photo-card-desc">${fog.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">Dugpunkt: Δ${fog.avgSpread}°C • Fugt: ${fog.avgHumidity}% • Vind: ${fog.avgWind} m/s</span>
            <button class="btn-goto-sol" data-time="${(fogStart || sun.sunrise || day.date).getTime()}">
              Synk Sol til kl. ${TimeService.formatTime(fogStart || sun.sunrise)} →
            </button>
          </div>
        </div>

        <!-- 2. Gylden Time Morgen -->
        <div class="photo-card ${morningTiming.isPassed ? 'card-event-passed' : ''}">
          ${renderTimingBanner(morningTiming)}
          <div class="photo-card-top">
            <span class="photo-card-title">${morning.icon} Morgenlys (Solopgang)</span>
            <span class="photo-score-badge ${getScoreClass(morning.score)}">${morning.score}/100</span>
          </div>
          <div class="photo-card-time">
            Gylden time: ${TimeService.formatTime(sun.sunrise)} - ${TimeService.formatTime(sun.goldenHourMorning?.end)}
          </div>
          <div class="photo-card-desc">${morning.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">Skyer: ${morning.clouds.total}% (L:${morning.clouds.low}% M:${morning.clouds.mid}% H:${morning.clouds.high}%)</span>
            <button class="btn-goto-sol" data-time="${sun.sunrise ? sun.sunrise.getTime() : day.date.getTime()}">
              Synk Sol til Solopgang →
            </button>
          </div>
        </div>

        <!-- 3. Gylden Time Aften & Solnedgang -->
        <div class="photo-card ${eveningTiming.isPassed ? 'card-event-passed' : ''}">
          ${renderTimingBanner(eveningTiming)}
          <div class="photo-card-top">
            <span class="photo-card-title">${evening.icon} Aftenlys (Solnedgang)</span>
            <span class="photo-score-badge ${getScoreClass(evening.score)}">${evening.score}/100</span>
          </div>
          <div class="photo-card-time">
            Gylden time: ${TimeService.formatTime(sun.goldenHourEvening?.start)} - ${TimeService.formatTime(sun.sunset)}
          </div>
          <div class="photo-card-desc">${evening.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">Skyer: ${evening.clouds.total}% (L:${evening.clouds.low}% M:${evening.clouds.mid}% H:${evening.clouds.high}%)</span>
            <button class="btn-goto-sol" data-time="${(sun.goldenHourEvening?.start || sun.sunset || day.date).getTime()}">
              Synk Sol til Aftenlys →
            </button>
          </div>
        </div>

        <!-- 4. Stjernehimmel & Nat (Astro) -->
        <div class="photo-card ${astroTiming.isPassed ? 'card-event-passed' : ''}">
          ${renderTimingBanner(astroTiming)}
          <div class="photo-card-top">
            <span class="photo-card-title">${astro.icon} Stjernehimmel (Astro)</span>
            <span class="photo-score-badge ${getScoreClass(astro.score)}">${astro.score}/100 • ${astro.status}</span>
          </div>
          <div class="photo-card-time">
            Astro mørke: ${sun.nightSky?.start ? `${TimeService.formatTime(sun.nightSky.start)} - ${TimeService.formatTime(sun.nightSky.end)}` : 'Lyse nætter'}
          </div>
          <div class="photo-card-desc">${astro.text}</div>
          <div class="photo-card-footer">
            <span style="font-size:11px;color:var(--text-dim);">${astro.moonImpact}</span>
            ${
              sun.nightSky?.start
                ? `<button class="btn-goto-sol" data-time="${sun.nightSky.start.getTime()}">Synk til Astro-nat →</button>`
                : ''
            }
          </div>
        </div>
      </div>

      <!-- TIME-FOR-TIME TABEL (Klik på en time synkroniserer Master-Tid!) -->
      <div class="fs-card" style="margin-top: 10px; margin-bottom: 0;">
        <div class="fs-card-header" style="margin-bottom:8px;">
          <span class="fs-card-title">Time-for-time vejrdata <span style="font-size:10px;font-weight:400;color:var(--text-dim);text-transform:none;">(Klik på en time for at synkronisere Sol & Kort)</span></span>
          <span class="fs-badge">${day.dayName}</span>
        </div>
        <div class="hourly-table-wrap">
          <div class="hourly-scroll">
            ${day.hourly
              .map((h) => {
                let hourClass = 'hourly-col';
                let hourBadgeContent = `<span class="hour-badge">${String(h.hour).padStart(2, '0')}:00</span>`;

                if (isToday) {
                  if (h.hour < currentHour) {
                    hourClass += ' hourly-past-hour';
                  } else if (h.hour === currentHour) {
                    hourClass += ' hourly-current-hour';
                    hourBadgeContent += `<span class="hour-now-badge">NU</span>`;
                  }
                }
                if (h.hour === masterHour) {
                  hourClass += ' hourly-master-selected';
                }

                return `
                <div class="${hourClass}" data-hour="${h.hour}" style="cursor:pointer;" title="Klik for at sætte klokkeslæt til kl. ${String(h.hour).padStart(2, '0')}:00">
                  ${hourBadgeContent}
                  <span>${h.weatherIcon}</span>
                  <span class="hour-temp">${Math.round(h.temp)}°</span>
                  <span class="hour-clouds">☁️ ${h.cloudTotal}%</span>
                  <span class="hour-wind">💨 ${h.windSpeed.toFixed(0)}m/s</span>
                  <span style="font-size:9px;color:var(--text-dim);">${(h.visibility / 1000).toFixed(0)}km</span>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;

    // Klik på "Synk Sol til..." knapper opdaterer Master-Tiden live (ingen side-navigation nødvendig!)
    wrap.querySelectorAll('.btn-goto-sol').forEach((btn) => {
      btn.addEventListener('click', () => {
        const timeMs = Number((btn as HTMLElement).dataset.time);
        const targetDate = new Date(timeMs);
        TimeService.setDate(targetDate);
      });
    });

    // Klik på en time i time-for-time tabellen sætter Master-Tiden til den pågældende time
    wrap.querySelectorAll('.hourly-col[data-hour]').forEach((col) => {
      col.addEventListener('click', () => {
        const h = Number((col as HTMLElement).dataset.hour);
        const target = new Date(day.date);
        target.setHours(h, 0, 0, 0);
        TimeService.setDate(target);
      });
    });
  }
}
