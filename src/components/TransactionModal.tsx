import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Check,
  TrendingDown,
  TrendingUp,
  Settings2,
} from 'lucide-react';
import { CategoryItem, Transaction, TransactionType } from '../types';
import { getTodayDateString } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  onOpenCategoriesModal?: () => void;
  onQuickAddSubcategory?: (categoryName: string, subcategoryName: string) => void;
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
  initialCategory?: string;
  initialSubcategory?: string;
  initialAmount?: number;
  initialComment?: string;
  initialDate?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSave,
  onOpenCategoriesModal,
  onQuickAddSubcategory,
  editingTransaction,
  initialType = 'expense',
  initialCategory,
  initialSubcategory,
  initialAmount,
  initialComment,
  initialDate,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [isAddingCustomSub, setIsAddingCustomSub] = useState(false);
  const [customSubInput, setCustomSubInput] = useState('');
  const [date, setDate] = useState<string>(initialDate || getTodayDateString());
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form state when opened or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setSubcategory(editingTransaction.subcategory || '');
      setDate(editingTransaction.date);
      setComment(editingTransaction.comment || '');
    } else {
      setType(initialType);
      setAmount(initialAmount ? initialAmount.toString() : '');
      setDate(initialDate || getTodayDateString());
      setComment(initialComment || '');

      const filteredCats = categories.filter((c) => c.type === initialType);
      if (initialCategory && filteredCats.some((c) => c.name === initialCategory)) {
        setCategory(initialCategory);
      } else {
        setCategory(filteredCats[0]?.name || '');
      }
      setSubcategory(initialSubcategory || '');
    }
    setIsAddingCustomSub(false);
    setCustomSubInput('');
    setError(null);
  }, [editingTransaction, isOpen, initialType, initialAmount, initialCategory, initialSubcategory, initialComment, initialDate, categories]);

  if (!isOpen) return null;

  const currentCategories = categories.filter((c) => c.type === type);
  const selectedCatObj = currentCategories.find((c) => c.name === category);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCats = categories.filter((c) => c.type === newType);
    if (!newCats.some((c) => c.name === category)) {
      setCategory(newCats[0]?.name || '');
      setSubcategory('');
    }
  };

  const handleCategorySelect = (catName: string) => {
    setCategory(catName);
    setError(null);
    const catObj = currentCategories.find((c) => c.name === catName);
    if (catObj && subcategory && !catObj.subcategories?.includes(subcategory)) {
      setSubcategory('');
    }
  };

  const handleAddCustomSubcategory = () => {
    const cleanSub = customSubInput.trim();
    if (!cleanSub) return;
    setSubcategory(cleanSub);
    if (onQuickAddSubcategory && category) {
      onQuickAddSubcategory(category, cleanSub);
    }
    setCustomSubInput('');
    setIsAddingCustomSub(false);
  };

  const handleAddPreset = (value: number) => {
    const current = parseFloat(amount.replace(/\s/g, '')) || 0;
    setAmount((current + value).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Пожалуйста, укажите корректную сумму больше нуля');
      return;
    }

    if (cleanAmount > 100_000_000_000) {
      setError('Сумма превышает допустимый лимит (100 млрд ₽)');
      return;
    }

    if (!category) {
      setError('Выберите категорию');
      return;
    }

    if (!date) {
      setError('Укажите дату');
      return;
    }

    onSave(
      {
        type,
        amount: Math.round(cleanAmount),
        category: category.trim().slice(0, 60),
        ...(subcategory.trim() ? { subcategory: subcategory.trim().slice(0, 60) } : {}),
        date: date.trim(),
        comment: comment.trim().slice(0, 300),
      },
      editingTransaction?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {editingTransaction ? 'Редактирование операции' : 'Новая операция'}
            </h2>
            <p className="text-xs text-slate-500">
              {type === 'expense' ? 'Запись расхода из семейного бюджета' : 'Запись дохода в семейный бюджет'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Segmented Type Toggle (Расход / Доход) */}
          <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Расход</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Доход</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Сумма операции
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                className="w-full text-2xl font-bold text-slate-900 px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                ₽
              </span>
            </div>

            {/* Quick amount presets */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[500, 1000, 2000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddPreset(val)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors"
                >
                  +{val.toLocaleString('ru-RU')} ₽
                </button>
              ))}
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Категория
              </label>
              {onOpenCategoriesModal && (
                <button
                  type="button"
                  onClick={onOpenCategoriesModal}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Настроить категории</span>
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-0.5">
              {currentCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-sm block truncate ${
                            isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                          }`}
                        >
                          {cat.name}
                        </span>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {cat.subcategories.slice(0, 3).join(', ')}
                            {cat.subcategories.length > 3 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory Picker */}
          {selectedCatObj && (
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Подкатегория (необязательно)</span>
                </label>
                {!isAddingCustomSub && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomSub(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Добавить новую
                  </button>
                )}
              </div>

              {/* Subcategories chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => setSubcategory('')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    !subcategory
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Без подкатегории
                </button>

                {selectedCatObj.subcategories?.map((sub) => {
                  const isSubSelected = subcategory === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubcategory(sub)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        isSubSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>

              {/* Inline input to quickly add custom subcategory */}
              {isAddingCustomSub && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    autoFocus
                    value={customSubInput}
                    onChange={(e) => setCustomSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubcategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCustomSub(false);
                      }
                    }}
                    placeholder="Название подкатегории..."
                    className="flex-1 text-xs text-slate-800 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubcategory}
                    disabled={!customSubInput.trim()}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomSub(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Date & Comment Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Дата</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Comment / Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Комментарий (необязательно)</span>
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Например: Супермаркет, чек"
                className="w-full text-xs text-slate-800 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors ${
                type === 'expense'
                  ? 'bg-slate-900 hover:bg-slate-800'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'Сохранить изменения' : 'Добавить запись'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
