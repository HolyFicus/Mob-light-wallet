import React from 'react';
import { Target, Settings2, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { CategoryBudgets, CategoryItem, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetProgressPanelProps {
  categories: CategoryItem[];
  budgets: CategoryBudgets;
  transactions: Transaction[];
  yearMonth: string;
  onOpenBudgetModal: () => void;
}

export const BudgetProgressPanel: React.FC<BudgetProgressPanelProps> = ({
  categories,
  budgets,
  transactions,
  yearMonth,
  onOpenBudgetModal,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Calculate actual spending for current filtered month
  const categorySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.date.startsWith(yearMonth) && t.type === 'expense')
    .forEach((t) => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

  // Calculate total budget and total spending of budgeted categories
  let totalBudget = 0;
  let totalSpentInBudgets = 0;

  const items = expenseCategories.map((cat) => {
    const budget = budgets[cat.name] || 0;
    const spent = categorySpending[cat.name] || 0;
    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const remaining = budget - spent;
    const isOver = spent > budget && budget > 0;

    if (budget > 0) {
      totalBudget += budget;
      totalSpentInBudgets += spent;
    }

    return {
      cat,
      budget,
      spent,
      percentage,
      remaining,
      isOver,
    };
  });

  const overallPercent = totalBudget > 0 ? Math.round((totalSpentInBudgets / totalBudget) * 100) : 0;

  return (
    <aside aria-label="Бюджет категорий" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Бюджет категорий
            </h3>
            <p className="text-xs text-slate-500">Контроль лимитов за месяц</p>
          </div>
        </div>

        <button
          onClick={onOpenBudgetModal}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
          title="Изменить лимиты бюджета"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Настроить</span>
        </button>
      </div>

      {/* Overall monthly budget mini summary */}
      {totalBudget > 0 && (
        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Общий расход по лимитам:</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(totalSpentInBudgets)}{' '}
              <span className="text-slate-400 font-normal">/ {formatCurrency(totalBudget)}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercent > 100
                  ? 'bg-rose-500'
                  : overallPercent >= 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(overallPercent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span
              className={`font-semibold ${
                overallPercent > 100
                  ? 'text-rose-600'
                  : overallPercent >= 85
                  ? 'text-amber-600'
                  : 'text-slate-600'
              }`}
            >
              {overallPercent}% израсходовано
            </span>
            <span className="text-slate-500">
              {totalBudget - totalSpentInBudgets >= 0
                ? `Остаток: ${formatCurrency(totalBudget - totalSpentInBudgets)}`
                : `Превышение: ${formatCurrency(totalSpentInBudgets - totalBudget)}`}
            </span>
          </div>
        </div>
      )}

      {/* Categories Progress List */}
      <div className="space-y-3.5 pt-1">
        {items.map(({ cat, budget, spent, percentage, remaining, isOver }) => {
          if (budget === 0 && spent === 0) return null;

          const hasBudget = budget > 0;
          const isWarning = percentage >= 85 && percentage <= 100;

          return (
            <div key={cat.id} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-800 truncate">
                    {cat.name}
                  </span>
                  {isOver && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      Превышен
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900">{formatCurrency(spent)}</span>
                  {hasBudget && (
                    <span className="text-slate-400 font-normal"> / {formatCurrency(budget)}</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {hasBudget ? (
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Лимит не установлен
                </div>
              )}

              {/* Status details: % & remaining */}
              {hasBudget && (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className={isOver ? 'text-rose-600 font-medium' : isWarning ? 'text-amber-600 font-medium' : ''}>
                    {percentage}% выполнено
                  </span>
                  <span>
                    {isOver ? (
                      <span className="text-rose-600 font-semibold">
                        + {formatCurrency(spent - budget)} сверх лимита
                      </span>
                    ) : (
                      <span>Осталось: {formatCurrency(remaining)}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {totalBudget === 0 && (
          <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">Бюджеты еще не настроены</p>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">
              Установите лимиты расходов, чтобы отслеживать прогресс и контролировать семейный бюджет
            </p>
            <button
              onClick={onOpenBudgetModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-indigo-50/50 transition-colors"
            >
              Задать лимиты
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
