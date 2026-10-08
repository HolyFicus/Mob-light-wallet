import {
  CategoryBudgets,
  RegularPayment,
  Transaction,
  Deposit,
  CategoryItem,
} from '../types';
import {
  DEFAULT_BUDGETS,
  DEFAULT_REGULAR_PAYMENTS,
  DEFAULT_DEPOSITS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../data/defaultData';
import {
  sanitizeTransaction,
  sanitizeDeposit,
  sanitizeRegularPayment,
  sanitizeCategoryBudgets,
  sanitizeCategoriesList,
} from './security';

const KEYS = {
  CLEAN_INITIALIZED: 'family_wallet_init_clean_v3',
  TRANSACTIONS: 'family_wallet_tx_v3',
  BUDGETS: 'family_wallet_budgets_v3',
  REGULAR_PAYMENTS: 'family_wallet_bills_v3',
  DEPOSITS: 'family_wallet_deposits_v3',
  EXPENSE_CATEGORIES: 'family_wallet_expense_cats_v3',
  INCOME_CATEGORIES: 'family_wallet_income_cats_v3',
};

// Ensure old demo data from previous versions is handled cleanly without data loss
// Crucial: NEVER overwrite or delete existing user transactions if they exist in any key
function ensureCleanInitialization(): void {
  try {
    // Check if transactions exist in legacy keys and migrate them if primary is empty
    const currentTxRaw = localStorage.getItem(KEYS.TRANSACTIONS);
    const hasCurrentTx = currentTxRaw && currentTxRaw !== '[]';

    if (!hasCurrentTx) {
      const candidateKeys = [
        'family_wallet_tx_backup_v3',
        'family_wallet_tx_v2',
        'family_wallet_tx',
        'family_wallet_transactions',
        'transactions',
      ];
      for (const k of candidateKeys) {
        try {
          const val = localStorage.getItem(k);
          if (val && val !== '[]') {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(KEYS.TRANSACTIONS, val);
              localStorage.setItem('family_wallet_tx_backup_v3', val);
              break;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (!localStorage.getItem(KEYS.CLEAN_INITIALIZED)) {
      // Clear legacy UI/state keys that don't hold critical user transactions
      [
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
      if (localStorage.getItem(KEYS.EXPENSE_CATEGORIES) === null) {
        localStorage.setItem(KEYS.EXPENSE_CATEGORIES, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
      }
      if (localStorage.getItem(KEYS.INCOME_CATEGORIES) === null) {
        localStorage.setItem(KEYS.INCOME_CATEGORIES, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
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
    let raw = localStorage.getItem(KEYS.TRANSACTIONS);
    
    // Fail-safe: If primary key is empty or missing, check backup and legacy keys
    if (!raw || raw === '[]') {
      const fallbackKeys = [
        'family_wallet_tx_backup_v3',
        'family_wallet_tx_v2',
        'family_wallet_tx',
        'family_wallet_transactions',
        'transactions',
      ];
      for (const fk of fallbackKeys) {
        try {
          const fallbackVal = localStorage.getItem(fk);
          if (fallbackVal && fallbackVal !== '[]') {
            raw = fallbackVal;
            localStorage.setItem(KEYS.TRANSACTIONS, fallbackVal);
            break;
          }
        } catch {
          // continue
        }
      }
    }

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items = parsed
      .map(sanitizeTransaction)
      .filter((t: Transaction | null): t is Transaction => t !== null);

    // If items were successfully parsed, ensure backup key is also synced
    if (items.length > 0) {
      try {
        localStorage.setItem('family_wallet_tx_backup_v3', JSON.stringify(items));
      } catch {
        // ignore
      }
    }

    return items;
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
    const jsonStr = JSON.stringify(sanitized);
    localStorage.setItem(KEYS.TRANSACTIONS, jsonStr);
    
    // Keep secondary backup in case primary key is ever affected
    try {
      localStorage.setItem('family_wallet_tx_backup_v3', jsonStr);
    } catch {
      // ignore
    }
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

export function loadCategories(): { expense: CategoryItem[]; income: CategoryItem[] } {
  try {
    const rawExpense = localStorage.getItem(KEYS.EXPENSE_CATEGORIES);
    const rawIncome = localStorage.getItem(KEYS.INCOME_CATEGORIES);

    let expense: CategoryItem[] = [];
    if (rawExpense) {
      try {
        const parsed = JSON.parse(rawExpense);
        expense = sanitizeCategoriesList(parsed, 'expense');
      } catch {
        expense = [];
      }
    }

    let income: CategoryItem[] = [];
    if (rawIncome) {
      try {
        const parsed = JSON.parse(rawIncome);
        income = sanitizeCategoriesList(parsed, 'income');
      } catch {
        income = [];
      }
    }

    if (expense.length === 0) {
      expense = [...DEFAULT_EXPENSE_CATEGORIES];
      saveCategories(expense, income.length > 0 ? income : DEFAULT_INCOME_CATEGORIES);
    } else {
      // If categories exist but missing default subcategories for common categories, backfill subcategories
      expense = expense.map((cat) => {
        if (!cat.subcategories || cat.subcategories.length === 0) {
          const def = DEFAULT_EXPENSE_CATEGORIES.find((d) => d.name === cat.name);
          if (def?.subcategories) {
            return { ...cat, subcategories: [...def.subcategories] };
          }
        }
        return cat;
      });
    }

    if (income.length === 0) {
      income = [...DEFAULT_INCOME_CATEGORIES];
      saveCategories(expense, income);
    } else {
      income = income.map((cat) => {
        if (!cat.subcategories || cat.subcategories.length === 0) {
          const def = DEFAULT_INCOME_CATEGORIES.find((d) => d.name === cat.name);
          if (def?.subcategories) {
            return { ...cat, subcategories: [...def.subcategories] };
          }
        }
        return cat;
      });
    }

    return { expense, income };
  } catch (err) {
    console.error('Error loading categories from localStorage', err);
    return {
      expense: [...DEFAULT_EXPENSE_CATEGORIES],
      income: [...DEFAULT_INCOME_CATEGORIES],
    };
  }
}

export function saveCategories(expense: CategoryItem[], income: CategoryItem[]): boolean {
  try {
    const sanitizedExpense = sanitizeCategoriesList(expense, 'expense');
    const sanitizedIncome = sanitizeCategoriesList(income, 'income');

    localStorage.setItem(KEYS.EXPENSE_CATEGORIES, JSON.stringify(sanitizedExpense));
    localStorage.setItem(KEYS.INCOME_CATEGORIES, JSON.stringify(sanitizedIncome));
    return true;
  } catch (err) {
    notifyStorageError('сохранение категорий', err);
    return false;
  }
}

export function resetAllToDefaults(): void {
  saveTransactions([]);
  saveBudgets({});
  saveRegularPayments([]);
  saveDeposits([]);
  saveCategories(DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES);
}

export function clearAllData(): void {
  saveTransactions([]);
  saveBudgets({});
  saveRegularPayments([]);
  saveDeposits([]);
  saveCategories(DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES);
}
