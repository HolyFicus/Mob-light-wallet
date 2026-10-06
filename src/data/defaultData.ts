import { CategoryItem, Transaction, CategoryBudgets, RegularPayment } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: 'cat-groceries', name: 'Продукты', type: 'expense', icon: 'ShoppingBag', color: '#10b981' },
  { id: 'cat-transport', name: 'Транспорт', type: 'expense', icon: 'Car', color: '#0284c7' },
  { id: 'cat-housing', name: 'Жильё', type: 'expense', icon: 'Home', color: '#8b5cf6' },
  { id: 'cat-entertainment', name: 'Развлечения', type: 'expense', icon: 'Film', color: '#f59e0b' },
  { id: 'cat-health', name: 'Здоровье', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'cat-other', name: 'Прочее', type: 'expense', icon: 'Tag', color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'cat-salary', name: 'Зарплата', type: 'income', icon: 'Briefcase', color: '#059669' },
  { id: 'cat-bonus', name: 'Премия', type: 'income', icon: 'Award', color: '#d97706' },
  { id: 'cat-side', name: 'Подработка', type: 'income', icon: 'Laptop', color: '#2563eb' },
  { id: 'cat-gift', name: 'Подарок', type: 'income', icon: 'Gift', color: '#ec4899' },
  { id: 'cat-inc-other', name: 'Прочее', type: 'income', icon: 'Coins', color: '#64748b' },
];

export const DEFAULT_MEMBERS: string[] = ['Папа', 'Мама', 'Сын', 'Дочь'];

export const DEFAULT_BUDGETS: CategoryBudgets = {};

export const DEFAULT_REGULAR_PAYMENTS: RegularPayment[] = [];

export function generateSeedTransactions(): Transaction[] {
  return [];
}
