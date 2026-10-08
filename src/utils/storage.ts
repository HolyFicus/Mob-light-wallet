import {
  CategoryBudgets,
  RegularPayment,
  Transaction,
  Deposit,
} from '../types';
import {
  DEFAULT_BUDGETS,
  DEFAULT_REGULAR_PAYMENTS,
  DEFAULT_DEPOSITS,
} from '../data/defaultData';
import {
  sanitizeTransaction,
  sanitizeDeposit,
  sanitizeRegularPayment,
  sanitizeCategoryBudgets,
} from './security';

const KEYS = {
  CLEAN_INITIALIZED: 'family_wallet_init_clean_v3',
  TRANSACTIONS: 'family_wallet_tx_v3',
  BUDGETS: 'family_wallet_budgets_v3',
  REGULAR_PAYMENTS: 'family_wallet_bills_v3',
  DEPOSITS: 'family_wallet_deposits_v3',
};

// Ensure old demo data from previous versions is completely wiped
// Crucial: NEVER overwrite existing user data if it already exists in localStorage
function ensureCleanInitialization(): void {
  try {
    if (!localStorage.getItem(KEYS.CLEAN_INITIALIZED)) {
      // Clear any legacy keys with old mock numbers
      [
        'family_wallet_tx_v2',
        'family_wallet_budgets_v2',
        'family_wallet_bills_v2',
        'family_wallet_dismissed_notifs_v2',
        'family_wallet_members_v3',
        'family_wallet_dismissed_notifs_v3',
      ].forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      });

      // Only initialize empty containers if user has no existing records saved
      if (localStorage.getItem(KEYS.TRANSACTIONS) === null) {
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
      }
      if (localStorage.getItem(KEYS.BUDGETS) === null) {
        localStorage.setItem(KEYS.BUDGETS, JSON.stringify({}));
      }
      if (localStorage.getItem(KEYS.REGULAR_PAYMENTS) === null) {
        localStorage.setItem(KEYS.REGULAR_PAYMENTS, JSON.stringify([]));
      }
      localStorage.setItem(KEYS.CLEAN_INITIALIZED, 'true');
    }
  } catch (err) {
    console.error('Storage initialization error', err);
  }
}

// Helper to notify application if browser storage quota is exceeded
function notifyStorageError(action: string, error: unknown): void {
  console.error(`Storage error during ${action}:`, error);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('family-wallet-storage-error', {
        detail: {
          action,
          message:
            error instanceof Error && error.name === 'QuotaExceededError'
              ? 'Память браузера переполнена! Сохраните резервную копию на диск.'
              : 'Ошибка сохранения в хранилище браузера.',
        },
      })
    );
  }
}

// Run cleanup immediately on load
ensureCleanInitialization();

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    if (!raw) {
      saveTransactions([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeTransaction)
      .filter((t: Transaction | null): t is Transaction => t !== null);
  } catch (err) {
    console.error('Error loading transactions from localStorage', err);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): boolean {
  try {
    const sanitized = Array.isArray(transactions)
      ? transactions
          .map(sanitizeTransaction)
          .filter((t: Transaction | null): t is Transaction => t !== null)
      : [];
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    notifyStorageError('сохранение операций', err);
    return false;
  }
}

export function loadBudgets(): CategoryBudgets {
  try {
    const raw = localStorage.getItem(KEYS.BUDGETS);
    if (!raw) {
      saveBudgets(DEFAULT_BUDGETS);
      return DEFAULT_BUDGETS;
    }
    const parsed = JSON.parse(raw);
    return sanitizeCategoryBudgets(parsed);
  } catch {
    return DEFAULT_BUDGETS;
  }
}

export function saveBudgets(budgets: CategoryBudgets): boolean {
  try {
    const sanitized = sanitizeCategoryBudgets(budgets);
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    notifyStorageError('сохранение бюджетов', err);
    return false;
  }
}

export function loadRegularPayments(): RegularPayment[] {
  try {
    const raw = localStorage.getItem(KEYS.REGULAR_PAYMENTS);
    if (!raw) {
      saveRegularPayments(DEFAULT_REGULAR_PAYMENTS);
      return DEFAULT_REGULAR_PAYMENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_REGULAR_PAYMENTS;
    return parsed
      .map(sanitizeRegularPayment)
      .filter((p: RegularPayment | null): p is RegularPayment => p !== null);
  } catch {
    return DEFAULT_REGULAR_PAYMENTS;
  }
}

export function saveRegularPayments(payments: RegularPayment[]): boolean {
  try {
    const sanitized = Array.isArray(payments)
      ? payments
          .map(sanitizeRegularPayment)
          .filter((p: RegularPayment | null): p is RegularPayment => p !== null)
      : [];
    localStorage.setItem(KEYS.REGULAR_PAYMENTS, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    notifyStorageError('сохранение регулярных платежей', err);
    return false;
  }
}

export function loadDeposits(): Deposit[] {
  try {
    const raw = localStorage.getItem(KEYS.DEPOSITS);
    if (!raw) {
      saveDeposits(DEFAULT_DEPOSITS);
      return DEFAULT_DEPOSITS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_DEPOSITS;
    return parsed
      .map(sanitizeDeposit)
      .filter((d: Deposit | null): d is Deposit => d !== null);
  } catch {
    return DEFAULT_DEPOSITS;
  }
}

export function saveDeposits(deposits: Deposit[]): boolean {
  try {
    const sanitized = Array.isArray(deposits)
      ? deposits
          .map(sanitizeDeposit)
          .filter((d: Deposit | null): d is Deposit => d !== null)
      : [];
    localStorage.setItem(KEYS.DEPOSITS, JSON.stringify(sanitized));
    return true;
  } catch (err) {
    notifyStorageError('сохранение вкладов', err);
    return false;
  }
}

export function resetAllToDefaults(): void {
  saveTransactions([]);
  saveBudgets({});
  saveRegularPayments([]);
  saveDeposits([]);
}

export function clearAllData(): void {
  saveTransactions([]);
  saveBudgets({});
  saveRegularPayments([]);
  saveDeposits([]);
}
