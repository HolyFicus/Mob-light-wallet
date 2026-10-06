export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  comment: string;
  member: string; // Family member name
  createdAt: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

// Category budgets mapped as { [categoryName]: budgetAmount }
export type CategoryBudgets = Record<string, number>;

export interface CategoryBudgetProgress {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  color: string;
  icon: string;
}

export interface RegularPayment {
  id: string;
  title: string;
  amount: number;
  dayOfMonth: number; // 1-31
  category: string;
  member: string;
  autoPayNoticeDays: number; // days before to alert (default 3)
}

export type NotificationType = 'budget_exceeded' | 'budget_warning' | 'bill_due' | 'bill_today' | 'bill_overdue' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string; // ISO string or YYYY-MM-DD
  read: boolean;
  category?: string;
  billId?: string;
  severity: 'warning' | 'danger' | 'info';
  actionLabel?: string;
  actionData?: any;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  avgExpensePerDay: number;
  topExpenseCategory: { name: string; amount: number } | null;
  totalBudget: number;
  budgetUtilization: number;
}
