import { getTodayDateString } from './formatters';

export interface MonthWeek {
  weekNumber: number; // 1, 2, 3, 4, 5, 6
  label: string; // e.g. "1-я неделя"
  shortLabel: string; // "1 нед"
  dateRangeText: string; // e.g. "1–4 окт"
  fullRangeText: string; // e.g. "1–4 октября"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startDay: number; // 1
  endDay: number; // 4
  dayDates: string[]; // ['2026-10-01', '2026-10-02', ...]
  isCurrentWeek: boolean;
  daysCount: number;
}

export interface WeekDayInfo {
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1-31
  dayOfWeekName: string; // "Понедельник"
  dayOfWeekShort: string; // "Пн"
  isToday: boolean;
}

const RU_DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const RU_DAYS_FULL = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

const MONTH_NAMES_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/**
 * Calculates calendar weeks (Monday to Sunday) for a given YYYY-MM month.
 * A week starts on Monday (or day 1 of month) and ends on Sunday (or last day of month).
 */
export function getMonthWeeks(yearMonth: string): MonthWeek[] {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = getTodayDateString();
  const monthGenitive = MONTH_NAMES_GENITIVE[month - 1] || '';
  const monthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '');

  const weeks: MonthWeek[] = [];
  let currentDays: string[] = [];
  let weekNumber = 1;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month - 1, day);
    const dayOfWeek = dayDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const dateStr = `${yearStr}-${monthStr.padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    currentDays.push(dateStr);

    // Close week on Sunday (0) or on the last day of month
    if (dayOfWeek === 0 || day === daysInMonth) {
      const firstDateStr = currentDays[0];
      const lastDateStr = currentDays[currentDays.length - 1];
      const startDay = parseInt(firstDateStr.split('-')[2], 10);
      const endDay = parseInt(lastDateStr.split('-')[2], 10);

      const rangeText =
        startDay === endDay ? `${startDay} ${monthShort}` : `${startDay}–${endDay} ${monthShort}`;
      const fullRangeText =
        startDay === endDay
          ? `${startDay} ${monthGenitive}`
          : `${startDay}–${endDay} ${monthGenitive}`;

      weeks.push({
        weekNumber,
        label: `${weekNumber}-я неделя`,
        shortLabel: `${weekNumber} нед`,
        dateRangeText: rangeText,
        fullRangeText,
        startDate: firstDateStr,
        endDate: lastDateStr,
        startDay,
        endDay,
        dayDates: [...currentDays],
        isCurrentWeek: currentDays.includes(todayStr),
        daysCount: currentDays.length,
      });

      weekNumber++;
      currentDays = [];
    }
  }

  return weeks;
}

/**
 * Returns breakdown of each day in a week with day of week names and dates.
 */
export function getDaysOfWeekInfo(dayDates: string[]): WeekDayInfo[] {
  const todayStr = getTodayDateString();

  return dayDates.map((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeekIndex = dateObj.getDay();

    return {
      date: dateStr,
      dayNumber: d,
      dayOfWeekName: RU_DAYS_FULL[dayOfWeekIndex],
      dayOfWeekShort: RU_DAYS_SHORT[dayOfWeekIndex],
      isToday: dateStr === todayStr,
    };
  });
}
