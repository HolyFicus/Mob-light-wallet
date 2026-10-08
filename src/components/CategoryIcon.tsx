import React from 'react';
import {
  ShoppingBag,
  Car,
  Home,
  Film,
  HeartPulse,
  Tag,
  Briefcase,
  Award,
  Laptop,
  Gift,
  Coins,
  DollarSign,
  Coffee,
  Smartphone,
  Utensils,
  Plane,
  HelpCircle,
  Percent,
  PiggyBank,
  Landmark,
  BookOpen,
  Gamepad2,
  Baby,
  Shirt,
  Sparkles,
  Wrench,
  Dumbbell,
  Music,
  GraduationCap,
  Fuel,
  Bus,
  Smile,
  Shield,
  Folder,
  CreditCard,
  TrendingUp,
  Wallet,
  PawPrint,
  Wifi,
  Sparkle,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Car,
  Home,
  Film,
  HeartPulse,
  Tag,
  Briefcase,
  Award,
  Laptop,
  Gift,
  Coins,
  DollarSign,
  Coffee,
  Smartphone,
  Utensils,
  Plane,
  Percent,
  PiggyBank,
  Landmark,
  BookOpen,
  Gamepad2,
  Baby,
  Shirt,
  Sparkles,
  Wrench,
  Dumbbell,
  Music,
  GraduationCap,
  Fuel,
  Bus,
  Smile,
  Shield,
  Folder,
  CreditCard,
  TrendingUp,
  Wallet,
  PawPrint,
  Wifi,
  Sparkle,
};

export const AVAILABLE_CATEGORY_ICONS = [
  { name: 'ShoppingBag', label: 'Покупки' },
  { name: 'Utensils', label: 'Еда и кафе' },
  { name: 'Car', label: 'Автомобиль' },
  { name: 'Fuel', label: 'Бензин' },
  { name: 'Bus', label: 'Транспорт' },
  { name: 'Home', label: 'Дом' },
  { name: 'Film', label: 'Развлечения' },
  { name: 'HeartPulse', label: 'Здоровье' },
  { name: 'Dumbbell', label: 'Спорт' },
  { name: 'PiggyBank', label: 'Накопления' },
  { name: 'Landmark', label: 'Банк и вклады' },
  { name: 'Briefcase', label: 'Работа' },
  { name: 'Award', label: 'Премия' },
  { name: 'Laptop', label: 'Техника и фриланс' },
  { name: 'Gift', label: 'Подарки' },
  { name: 'Coins', label: 'Монеты' },
  { name: 'DollarSign', label: 'Деньги' },
  { name: 'CreditCard', label: 'Карта' },
  { name: 'Coffee', label: 'Кофе' },
  { name: 'Smartphone', label: 'Связь и гаджеты' },
  { name: 'Wifi', label: 'Интернет' },
  { name: 'Plane', label: 'Путешествия' },
  { name: 'BookOpen', label: 'Книги' },
  { name: 'GraduationCap', label: 'Обучение' },
  { name: 'Baby', label: 'Дети' },
  { name: 'PawPrint', label: 'Питомцы' },
  { name: 'Shirt', label: 'Одежда' },
  { name: 'Gamepad2', label: 'Игры' },
  { name: 'Music', label: 'Музыка' },
  { name: 'Wrench', label: 'Ремонт' },
  { name: 'Sparkles', label: 'Красота' },
  { name: 'Shield', label: 'Страховка' },
  { name: 'Tag', label: 'Тег' },
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#10b981', // emerald
  '#059669', // teal green
  '#0284c7', // sky
  '#2563eb', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f59e0b', // amber
  '#d97706', // warm amber
  '#ea580c', // orange
  '#0d9488', // teal
  '#06b6d4', // cyan
  '#64748b', // slate
];

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', size }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};

export function getCategoryColor(categoryName: string, isExpense: boolean = true): string {
  switch (categoryName) {
    case 'Продукты':
      return '#10b981'; // emerald
    case 'Транспорт':
      return '#0284c7'; // sky
    case 'Жильё':
      return '#8b5cf6'; // violet
    case 'Развлечения':
      return '#f59e0b'; // amber
    case 'Здоровье':
      return '#ef4444'; // rose/red
    case 'Зарплата':
      return '#059669'; // teal/emerald
    case 'Проценты по вкладу':
      return '#6366f1'; // indigo
    case 'Вклад и накопления':
      return '#6366f1'; // indigo
    case 'Премия':
      return '#d97706'; // amber
    case 'Подработка':
      return '#2563eb'; // blue
    case 'Подарок':
      return '#ec4899'; // pink
    default:
      return isExpense ? '#64748b' : '#0d9488';
  }
}
