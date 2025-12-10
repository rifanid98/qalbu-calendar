export enum FastType {
  RAMADAN = 'RAMADAN',
  AYYAMUL_BIDH = 'AYYAMUL_BIDH',
  SENIN_KAMIS = 'SENIN_KAMIS',
  SABTU_MUTLAK = 'SABTU_MUTLAK',
  NONE = 'NONE'
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

export interface DayInfo {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  hijri: HijriDate;
  fastTypes: FastType[];
}

export interface UserProfile {
  id: string;
  name: string;
  completedDates: Record<string, boolean>; // key: YYYY-MM-DD
}

export interface AppState {
  profiles: UserProfile[];
  activeProfileId: string;
  theme: 'light' | 'dark' | 'system';
}

export const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
