import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
} from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  avgExpensePerDay: number;
  totalDeposits?: number;
  totalMonthlyInterest?: number;
  onOpenDepositsModal?: () => void;
  periodLabel?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  balance,
  transactionCount,
  avgExpensePerDay,
  totalDeposits = 0,
  totalMonthlyInterest = 0,
  onOpenDepositsModal,
  periodLabel = 'месяца',
}) => {
  const isPositiveBalance = balance >= 0;
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Баланс (Balance) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Баланс ({periodLabel})
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isPositiveBalance
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isPositiveBalance ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(balance)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            {totalIncome > 0 ? (
              <span>
                Сбережения: <strong className={savingsRate >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{savingsRate}%</strong> от доходов
              </span>
            ) : (
              <span>Всего {transactionCount} операций</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Доходы (Income) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Доходы
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
            +{formatCurrency(totalIncome)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>Поступления в кошелёк</span>
          </div>
        </div>
      </div>

      {/* 3. Расходы (Expenses) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Расходы
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            -{formatCurrency(totalExpense)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>В среднем: ~{formatCurrency(avgExpensePerDay)} / день</span>
          </div>
        </div>
      </div>

      {/* 4. Вклады и накопления (Deposits & Passive Income) */}
      <div
        onClick={onOpenDepositsModal}
        className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
            Вклады и проценты
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
            {formatCurrency(totalDeposits)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold">
              +{formatCurrency(totalMonthlyInterest)} / мес
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold group-hover:underline">
              Вклады →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
