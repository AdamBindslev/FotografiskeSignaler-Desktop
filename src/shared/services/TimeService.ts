/**
 * TimeService.ts - Fælles tidsstyring og datoformatering for Fotografiske Signaler (§9.2)
 */

export type TimeListener = (date: Date) => void;

export class TimeService {
  private static currentDate: Date = new Date();
  private static listeners: Set<TimeListener> = new Set();

  public static getDate(): Date {
    return new Date(this.currentDate.getTime());
  }

  public static setDate(d: Date): void {
    this.currentDate = new Date(d.getTime());
    this.notifyListeners();
  }

  public static setTimeToNow(): void {
    this.setDate(new Date());
  }

  public static subscribe(listener: TimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    const d = this.getDate();
    this.listeners.forEach((listener) => {
      try {
        listener(d);
      } catch (err) {
        console.error('Fejl i time listener:', err);
      }
    });
  }

  public static formatTime(date: Date | null | undefined): string {
    if (!date || isNaN(date.getTime())) return '--:--';
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  public static formatDateDanish(date: Date): string {
    const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName} d. ${dayNum}. ${monthName}`;
  }

  public static formatShortDate(date: Date): string {
    const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
  }

  public static formatDuration(ms: number): string {
    if (isNaN(ms) || ms < 0) ms = 0;
    const totalMinutes = Math.round(ms / 60000);
    if (totalMinutes < 1) return 'under 1 min';
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours < 24) {
      if (mins === 0) return hours === 1 ? '1 time' : `${hours} timer`;
      return hours === 1 ? `1 t. ${mins} min` : `${hours} t. ${mins} min`;
    }
    const days = Math.floor(hours / 24);
    const remH = Math.round(hours % 24);
    if (days === 1) {
      return remH > 0 ? `1 d. ${remH} t.` : '1 dag';
    }
    return `${days} dage`;
  }

  public static formatIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  public static parseIsoDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split('-');
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1900 || m < 0 || m > 11 || d < 1 || d > 31) return null;
    return new Date(y, m, d);
  }

  public static formatDateWithYearDanish(date: Date): string {
    return `${this.formatDateDanish(date)} ${date.getFullYear()}`;
  }

  public static isToday(date: Date, referenceDate: Date = new Date()): boolean {
    return (
      date.getFullYear() === referenceDate.getFullYear() &&
      date.getMonth() === referenceDate.getMonth() &&
      date.getDate() === referenceDate.getDate()
    );
  }

  public static isTomorrow(date: Date, referenceDate: Date = new Date()): boolean {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.isToday(date, tomorrow);
  }

  public static isYesterday(date: Date, referenceDate: Date = new Date()): boolean {
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isToday(date, yesterday);
  }

  public static getDaysDifference(targetDate: Date, baseDate: Date = new Date()): number {
    const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffMs = target.getTime() - base.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  public static formatRelativeDay(targetDate: Date, baseDate: Date = new Date()): string {
    const diff = this.getDaysDifference(targetDate, baseDate);
    if (diff === 0) return 'I dag';
    if (diff === 1) return 'I morgen';
    if (diff === 2) return 'I overmorgen';
    if (diff === -1) return 'I går';
    if (diff > 0) return `Om ${diff} dage`;
    return `${Math.abs(diff)} dage siden`;
  }

  public static getNextSolsticeOrEquinox(
    type: 'summer-solstice' | 'winter-solstice' | 'spring-equinox' | 'autumn-equinox',
    fromDate: Date = new Date()
  ): Date {
    const year = fromDate.getFullYear();
    let m = 0;
    let d = 0;
    switch (type) {
      case 'summer-solstice':
        m = 5;
        d = 21;
        break;
      case 'autumn-equinox':
        m = 8;
        d = 22;
        break;
      case 'winter-solstice':
        m = 11;
        d = 21;
        break;
      case 'spring-equinox':
        m = 2;
        d = 20;
        break;
    }

    const candidateThisYear = new Date(year, m, d);
    const fromMidnight = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    if (candidateThisYear.getTime() >= fromMidnight.getTime()) {
      return candidateThisYear;
    } else {
      return new Date(year + 1, m, d);
    }
  }
}
