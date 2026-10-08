import { CategoryItem, Transaction, CategoryBudgets, RegularPayment, Deposit } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-groceries',
    name: 'Продукты',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#10b981',
    subcategories: ['Супермаркет', 'Рынок', 'Доставка еды', 'Сладости и выпечка'],
  },
  {
    id: 'cat-transport',
    name: 'Транспорт',
    type: 'expense',
    icon: 'Car',
    color: '#0284c7',
    subcategories: ['Общественный транспорт', 'Бензин', 'Такси', 'Обслуживание авто', 'Парковка'],
  },
  {
    id: 'cat-housing',
    name: 'Жильё',
    type: 'expense',
    icon: 'Home',
    color: '#8b5cf6',
    subcategories: ['Аренда', 'Ипотека', 'ЖКХ и коммуналка', 'Интернет и связь', 'Ремонт и мебель'],
  },
  {
    id: 'cat-entertainment',
    name: 'Развлечения',
    type: 'expense',
    icon: 'Film',
    color: '#f59e0b',
    subcategories: ['Рестораны и кафе', 'Кино и театры', 'Подписки и игры', 'Хобби', 'Путешествия'],
  },
  {
    id: 'cat-health',
    name: 'Здоровье',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#ef4444',
    subcategories: ['Аптека', 'Врачи и клиники', 'Стоматология', 'Спорт и фитнес'],
  },
  {
    id: 'cat-savings',
    name: 'Вклад и накопления',
    type: 'expense',
    icon: 'PiggyBank',
    color: '#6366f1',
    subcategories: ['Пополнение вклада', 'Инвестиции', 'Подушка безопасности'],
  },
  {
    id: 'cat-other',
    name: 'Прочее',
    type: 'expense',
    icon: 'Tag',
    color: '#64748b',
    subcategories: ['Одежда и обувь', 'Техника', 'Подарки', 'Бытовая химия'],
  },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-salary',
    name: 'Зарплата',
    type: 'income',
    icon: 'Briefcase',
    color: '#059669',
    subcategories: ['Основная зарплата', 'Аванс'],
  },
  {
    id: 'cat-interest',
    name: 'Проценты по вкладу',
    type: 'income',
    icon: 'Percent',
    color: '#6366f1',
    subcategories: ['Ежемесячный доход', 'Капитализация'],
  },
  {
    id: 'cat-bonus',
    name: 'Премия',
    type: 'income',
    icon: 'Award',
    color: '#d97706',
    subcategories: ['Квартальная премия', 'Годовой бонус'],
  },
  {
    id: 'cat-side',
    name: 'Подработка',
    type: 'income',
    icon: 'Laptop',
    color: '#2563eb',
    subcategories: ['Фриланс', 'Услуги и консультации'],
  },
  {
    id: 'cat-gift',
    name: 'Подарок',
    type: 'income',
    icon: 'Gift',
    color: '#ec4899',
    subcategories: ['От родных', 'На праздник'],
  },
  {
    id: 'cat-inc-other',
    name: 'Прочее',
    type: 'income',
    icon: 'Coins',
    color: '#64748b',
    subcategories: ['Продажа вещей', 'Кэшбэк и бонусы', 'Возврат долга'],
  },
];

export const DEFAULT_BUDGETS: CategoryBudgets = {};

export const DEFAULT_REGULAR_PAYMENTS: RegularPayment[] = [];

export const DEFAULT_DEPOSITS: Deposit[] = [];

export function generateSeedTransactions(): Transaction[] {
  return [];
}
