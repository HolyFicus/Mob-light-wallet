export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace('.0', '')} млн ₽`;
  }
  if (Math.abs(amount) >= 100_000) {
    return `${Math.round(amount / 1000)} тыс. ₽`;
  }
  return formatCurrency(amount);
}

const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export function getMonthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  return `${MONTH_NAMES[month] || ''} ${year}`;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftMonth(yearMonth: string, offset: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1 + offset;

  const date = new Date(year, month, 1);
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

export function formatDateGroupHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetClean = new Date(targetDate);
  targetClean.setHours(0, 0, 0, 0);

  const isToday = targetClean.getTime() === today.getTime();
  const isYesterday = targetClean.getTime() === yesterday.getTime();

  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  }).format(targetDate);

  if (isToday) {
    return `Сегодня, ${formatted}`;
  }
  if (isYesterday) {
    return `Вчера, ${formatted}`;
  }
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getDaysInMonth(yearMonth: string): number {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  return new Date(year, month, 0).getDate();
}

/**
 * Returns correct Russian plural form for a given number.
 * e.g. pluralizeRu(count, 'операция', 'операции', 'операций')
 * e.g. pluralizeRu(count, 'неделя', 'недели', 'недель')
 * e.g. pluralizeRu(count, 'вклад', 'вклада', 'вкладов')
 */
export function pluralizeRu(
  n: number,
  one: string,
  few: string,
  many: string
): string {
  const abs = Math.abs(Math.round(n)) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (rem > 1 && rem < 5) return few;
  if (rem === 1) return one;
  return many;
}
