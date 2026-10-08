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
};

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
