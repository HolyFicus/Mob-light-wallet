export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  comment: string;
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
  autoPayNoticeDays: number; // days before to alert (default 3)
}

export interface Deposit {
  id: string;
  name: string; // e.g. "Вклад Т-Банк", "Накопительный счет Сбер"
  bankName?: string;
  amount: number; // Current principal deposit sum
  interestRate: number; // Annual interest percentage (e.g. 18.5)
  interestPayout: 'wallet' | 'capitalization'; // 'wallet' (выплата в доход) | 'capitalization' (прибавлять к вкладу)
  dayOfMonth: number; // Day of month when interest is paid (1-31)
  notes?: string;
  createdAt: number;
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
