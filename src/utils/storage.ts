import {
  CategoryBudgets,
  RegularPayment,
  Transaction,
} from '../types';
import {
  DEFAULT_BUDGETS,
  DEFAULT_MEMBERS,
  DEFAULT_REGULAR_PAYMENTS,
} from '../data/defaultData';

const KEYS = {
  CLEAN_INITIALIZED: 'family_wallet_init_clean_v3',
  TRANSACTIONS: 'family_wallet_tx_v3',
  MEMBERS: 'family_wallet_members_v3',
  BUDGETS: 'family_wallet_budgets_v3',
  REGULAR_PAYMENTS: 'family_wallet_bills_v3',
  DISMISSED_NOTIFICATIONS: 'family_wallet_dismissed_notifs_v3',
};

// Ensure old demo data from previous versions is completely wiped
function ensureCleanInitialization(): void {
  try {
    if (!localStorage.getItem(KEYS.CLEAN_INITIALIZED)) {
      // Clear any legacy keys with old mock numbers
      ['family_wallet_tx_v2', 'family_wallet_budgets_v2', 'family_wallet_bills_v2', 'family_wallet_dismissed_notifs_v2'].forEach(
        (key) => localStorage.removeItem(key)
      );

      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(KEYS.BUDGETS, JSON.stringify({}));
      localStorage.setItem(KEYS.REGULAR_PAYMENTS, JSON.stringify([]));
      localStorage.setItem(KEYS.DISMISSED_NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
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

export function loadMembers(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.MEMBERS);
    if (!raw) {
      saveMembers(DEFAULT_MEMBERS);
      return DEFAULT_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MEMBERS;
  } catch {
    return DEFAULT_MEMBERS;
  }
}

export function saveMembers(members: string[]): void {
  try {
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  } catch (err) {
    console.error('Error saving members to localStorage', err);
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

export function loadDismissedNotifications(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.DISMISSED_NOTIFICATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDismissedNotifications(ids: string[]): void {
  try {
    localStorage.setItem(KEYS.DISMISSED_NOTIFICATIONS, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving dismissed notifications to localStorage', err);
  }
}

export function resetAllToDefaults(): void {
  saveTransactions([]);
  saveMembers(DEFAULT_MEMBERS);
  saveBudgets({});
  saveRegularPayments([]);
  saveDismissedNotifications([]);
}

export function clearAllData(): void {
  saveTransactions([]);
  saveBudgets({});
  saveRegularPayments([]);
  saveDismissedNotifications([]);
}
