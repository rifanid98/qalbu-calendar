import { FastType, DayInfo, HijriDate } from '../types';

// Helper to format YYYY-MM-DD
export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Hijri conversion using Intl API (available in modern browsers)
const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

// For Month names
const hijriMonthFormatter = new Intl.DateTimeFormat('id-u-ca-islamic-umalqura-nu-latn', {
  month: 'long',
});

export const getHijriDate = (date: Date): HijriDate => {
  const parts = hijriFormatter.formatToParts(date);
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '1445', 10);
  
  // We need a separate call for the month name to get the localized string correctly
  const monthName = hijriMonthFormatter.format(date);

  return { day, month, year, monthName };
};

export const getFastTypesForDate = (date: Date, hijri: HijriDate): FastType[] => {
  const types: FastType[] = [];
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // 1. Ramadan (Hijri Month 9)
  if (hijri.month === 9) {
    types.push(FastType.RAMADAN);
    // In Ramadan, other fasts are superseded, but functionally users might track them.
    // Usually, you don't do voluntary fasts during Ramadan because the Fard takes precedence.
    // We will return ONLY Ramadan to avoid confusion in UI.
    return types; 
  }

  // 2. Ayyamul Bidh (13, 14, 15) - prohibited on Tashriq days (11,12,13 Dhul-Hijjah - month 12)
  // And prohibited on Eid (1 Shawwal - month 10, 10 Dhul-Hijjah)
  const isEidAlFitr = hijri.month === 10 && hijri.day === 1;
  const isEidAlAdha = hijri.month === 12 && hijri.day === 10;
  const isTashriq = hijri.month === 12 && (hijri.day === 11 || hijri.day === 12 || hijri.day === 13);

  // Check Ayyamul Bidh
  if ([13, 14, 15].includes(hijri.day)) {
    // Specifically handle the 13th of Dhul-Hijjah which is Tashriq (Haram to fast)
    if (!(hijri.month === 12 && hijri.day === 13)) {
       types.push(FastType.AYYAMUL_BIDH);
    }
  }

  // 3. Senin Kamis
  if (!isEidAlFitr && !isEidAlAdha && !isTashriq) {
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      types.push(FastType.SENIN_KAMIS);
    }
  }

  // 4. Sabtu Mutlak
  if (!isEidAlFitr && !isEidAlAdha && !isTashriq) {
    if (dayOfWeek === 6) {
      types.push(FastType.SABTU_MUTLAK);
    }
  }

  return types;
};

export const generateMonthGrid = (year: number, month: number): DayInfo[] => {
  const grid: DayInfo[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Days from previous month to fill grid
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0-6
  
  // Previous month filler
  for (let i = startDayOfWeek; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    const hijri = getHijriDate(d);
    grid.push({
      date: d,
      dateString: formatDateKey(d),
      isCurrentMonth: false,
      isToday: formatDateKey(new Date()) === formatDateKey(d),
      hijri,
      fastTypes: getFastTypesForDate(d, hijri)
    });
  }

  // Current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    const hijri = getHijriDate(d);
    grid.push({
      date: d,
      dateString: formatDateKey(d),
      isCurrentMonth: true,
      isToday: formatDateKey(new Date()) === formatDateKey(d),
      hijri,
      fastTypes: getFastTypesForDate(d, hijri)
    });
  }

  // Next month filler
  const remainingSlots = 42 - grid.length; // 6 rows * 7 cols = 42
  for (let i = 1; i <= remainingSlots; i++) {
    const d = new Date(year, month + 1, i);
    const hijri = getHijriDate(d);
    grid.push({
      date: d,
      dateString: formatDateKey(d),
      isCurrentMonth: false,
      isToday: formatDateKey(new Date()) === formatDateKey(d),
      hijri,
      fastTypes: getFastTypesForDate(d, hijri)
    });
  }

  return grid;
};
