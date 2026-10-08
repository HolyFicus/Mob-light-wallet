import { Transaction, Deposit, RegularPayment, CategoryBudgets, TransactionType } from '../types';

/**
 * Strips leading spreadsheet formula triggers (=, +, -, @, \t, \r, %, |) to prevent
 * CSV / Formula Injection attacks (OWASP guidance) when opening exported files
 * in Microsoft Excel, Google Sheets, or LibreOffice, even if preceded by whitespace.
 */
export function sanitizeCsvCell(val: unknown, isNumeric = false): string {
  if (val === null || val === undefined) return '';

  if (isNumeric && typeof val === 'number' && Number.isFinite(val)) {
    return String(Math.round(val));
  }

  let str = String(val);

  // Guard against oversized cells (CSV bomb / buffer overflow)
  if (str.length > 1000) {
    str = str.slice(0, 1000);
  }

  // If cell starts with formula characters (even if preceded by spaces or non-breaking spaces),
  // neutralize by prefixing with a single quote so spreadsheets treat it strictly as literal text.
  if (/^[\s\u00A0]*[=\+\-@\t\r%|]/.test(str)) {
    str = `'${str}`;
  }

  // Quote if contains delimiter, double quotes, or newlines
  if (
    str.includes(';') ||
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Safely sanitizes string inputs to avoid uncontrolled memory bloat or prototype attacks.
 */
export function sanitizeString(val: unknown, maxLen = 200, defaultVal = ''): string {
  if (typeof val !== 'string') return defaultVal;
  return val.trim().slice(0, maxLen);
}

/**
 * Safely sanitizes numeric inputs, ensuring finite positive values within safe ranges.
 */
export function sanitizeNumber(
  val: unknown,
  min = 0,
  max = 100_000_000_000,
  defaultVal = 0
): number {
  if (typeof val !== 'number' && typeof val !== 'string') return defaultVal;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(num)) return defaultVal;
  return Math.min(max, Math.max(min, Math.round(num)));
}

/**
 * Validates and normalizes date string to YYYY-MM-DD.
 */
export function sanitizeDate(val: unknown, defaultDate?: string): string {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }
  if (defaultDate) return defaultDate;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Validates and sanitizes a single Transaction item.
 */
export function sanitizeTransaction(raw: any): Transaction | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const type: TransactionType = raw.type === 'income' ? 'income' : 'expense';
  const amount = sanitizeNumber(raw.amount, 1, 100_000_000_000, 0);
  if (amount <= 0) return null;

  const category = sanitizeString(raw.category, 60, 'Прочее');
  if (!category) return null;

  const date = sanitizeDate(raw.date);
  const comment = sanitizeString(raw.comment, 300, '');
  const id = sanitizeString(raw.id, 64, `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now();

  return {
    id,
    type,
    amount,
    category,
    date,
    comment,
    createdAt,
  };
}

/**
 * Validates and sanitizes a single Deposit item.
 */
export function sanitizeDeposit(raw: any): Deposit | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const name = sanitizeString(raw.name, 100, '');
  if (!name) return null;

  const amount = sanitizeNumber(raw.amount, 0, 100_000_000_000, 0);
  const rawRate = typeof raw.interestRate === 'number' ? raw.interestRate : parseFloat(String(raw.interestRate || 0));
  const interestRate = Number.isFinite(rawRate) ? Math.min(1000, Math.max(0, Number(rawRate.toFixed(2)))) : 0;
  const interestPayout = raw.interestPayout === 'capitalization' ? 'capitalization' : 'wallet';
  const dayOfMonth = Math.min(31, Math.max(1, parseInt(String(raw.dayOfMonth || 1), 10) || 1));
  const notes = sanitizeString(raw.notes, 500, '');
  const id = sanitizeString(raw.id, 64, `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now();

  return {
    id,
    name,
    amount,
    interestRate,
    interestPayout,
    dayOfMonth,
    notes,
    createdAt,
  };
}

/**
 * Validates and sanitizes a single RegularPayment item.
 */
export function sanitizeRegularPayment(raw: any): RegularPayment | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const title = sanitizeString(raw.title, 100, '');
  if (!title) return null;

  const amount = sanitizeNumber(raw.amount, 1, 100_000_000_000, 0);
  if (amount <= 0) return null;

  const dayOfMonth = Math.min(31, Math.max(1, parseInt(String(raw.dayOfMonth || 1), 10) || 1));
  const category = sanitizeString(raw.category, 60, 'Прочее');
  const autoPayNoticeDays = Math.min(30, Math.max(1, parseInt(String(raw.autoPayNoticeDays || 3), 10) || 3));
  const id = sanitizeString(raw.id, 64, `bill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

  return {
    id,
    title,
    amount,
    dayOfMonth,
    category,
    autoPayNoticeDays,
  };
}

/**
 * Validates CategoryBudgets dictionary, strictly blocking prototype pollution keys.
 */
export function sanitizeCategoryBudgets(raw: any): CategoryBudgets {
  const result: CategoryBudgets = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;

  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  for (const [key, val] of Object.entries(raw)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (typeof key !== 'string') continue;

    const cleanKey = sanitizeString(key, 60, '');
    if (!cleanKey) continue;

    const amount = sanitizeNumber(val, 0, 100_000_000_000, 0);
    if (amount > 0) {
      result[cleanKey] = amount;
    }
  }

  return result;
}
