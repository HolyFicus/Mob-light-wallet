import React, { useState } from 'react';
import { X, Target, Check, AlertCircle } from 'lucide-react';
import { CategoryBudgets, CategoryItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  budgets: CategoryBudgets;
  onSaveBudgets: (newBudgets: CategoryBudgets) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  budgets,
  onSaveBudgets,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [formBudgets, setFormBudgets] = useState<CategoryBudgets>(() => ({ ...budgets }));

  React.useEffect(() => {
    if (isOpen) {
      setFormBudgets({ ...budgets });
    }
  }, [isOpen, budgets]);

  if (!isOpen) return null;

  const handleInputChange = (categoryName: string, value: string) => {
    const cleanNum = value.replace(/\D/g, '');
    const num = cleanNum === '' ? 0 : parseInt(cleanNum, 10);
    setFormBudgets((prev) => ({
      ...prev,
      [categoryName]: num,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBudgets(formBudgets);
    onClose();
  };

  const totalMonthlyBudget = Object.values(formBudgets).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Месячный бюджет категорий
              </h2>
              <p className="text-xs text-slate-500">
                Укажите планируемые лимиты расходов на месяц
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Общий лимит расходов:</span>
            <span className="text-base font-bold text-slate-900">
              {formatCurrency(totalMonthlyBudget)}
            </span>
          </div>

          <div className="space-y-3">
            {expenseCategories.map((cat) => {
              const currentVal = formBudgets[cat.name] ?? 0;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="relative w-36 shrink-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentVal > 0 ? currentVal.toLocaleString('ru-RU') : ''}
                      placeholder="0"
                      onChange={(e) => handleInputChange(cat.name, e.target.value)}
                      className="w-full text-right font-medium text-sm text-slate-900 px-3 py-1.5 pr-7 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      ₽
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 pt-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              При приближении к лимиту (85%) или его превышении шкала категории на панели бюджета
              подсветится предупреждающим цветом (желтым или красным).
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Сохранить бюджеты
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
