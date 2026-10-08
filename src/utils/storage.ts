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

const KEYS = {
  CLEAN_INITIALIZED: 'family_wallet_init_clean_v3',
  TRANSACTIONS: 'family_wallet_tx_v3',
  BUDGETS: 'family_wallet_budgets_v3',
  REGULAR_PAYMENTS: 'family_wallet_bills_v3',
  DEPOSITS: 'family_wallet_deposits_v3',
};

// Ensure old demo data from previous versions is completely wiped
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
      ].forEach((key) => localStorage.removeItem(key));

      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(KEYS.BUDGETS, JSON.stringify({}));
      localStorage.setItem(KEYS.REGULAR_PAYMENTS, JSON.stringify([]));
      localStorage.setItem(KEYS.CLEAN_INITIALIZED, 'true');
    }
  } catch (err) {
    console.error('Storage initialization error', err);
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
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading transactions from localStorage', err);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving transactions to localStorage', err);
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
    return typeof parsed === 'object' && parsed !== null ? parsed : DEFAULT_BUDGETS;
  } catch {
    return DEFAULT_BUDGETS;
  }
}

export function saveBudgets(budgets: CategoryBudgets): void {
  try {
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (err) {
    console.error('Error saving budgets to localStorage', err);
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
    return Array.isArray(parsed) ? parsed : DEFAULT_REGULAR_PAYMENTS;
  } catch {
    return DEFAULT_REGULAR_PAYMENTS;
  }
}

export function saveRegularPayments(payments: RegularPayment[]): void {
  try {
    localStorage.setItem(KEYS.REGULAR_PAYMENTS, JSON.stringify(payments));
  } catch (err) {
    console.error('Error saving regular payments to localStorage', err);
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
    return Array.isArray(parsed) ? parsed : DEFAULT_DEPOSITS;
  } catch {
    return DEFAULT_DEPOSITS;
  }
}

export function saveDeposits(deposits: Deposit[]): void {
  try {
    localStorage.setItem(KEYS.DEPOSITS, JSON.stringify(deposits));
  } catch (err) {
    console.error('Error saving deposits to localStorage', err);
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
