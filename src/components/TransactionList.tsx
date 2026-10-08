import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CalendarRange,
  X,
  History,
  ChevronDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CategoryItem, Transaction, TransactionType, ViewPeriod, RecordedMonthInfo } from '../types';
import {
  formatCurrency,
  formatDateGroupHeading,
  getCurrentYearMonth,
  getMonthLabel,
  pluralizeRu,
  shiftMonth,
} from '../utils/formatters';
import {
  getMonthWeeks,
  getDaysOfWeekInfo,
  MonthWeek,
} from '../utils/weekCalculations';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[]; // Active transactions for current view
  allTransactions?: Transaction[]; // Complete set of all stored transactions
  categories: CategoryItem[];
  currentYearMonth?: string;
  viewPeriod?: ViewPeriod;
  onPeriodChange?: (period: ViewPeriod) => void;
  onMonthChange?: (yearMonth: string) => void;
  recordedMonths?: RecordedMonthInfo[];
  customRangeStart?: string;
  customRangeEnd?: string;
  onCustomRangeChange?: (start: string, end: string) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: (initialDate?: string) => void;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const q = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return text;
  return (
    <>
      {text.substring(0, index)}
      <mark className="bg-amber-100 text-amber-900 rounded-xs px-0.5 font-bold">
        {text.substring(index, index + q.length)}
      </mark>
      {text.substring(index + q.length)}
    </>
  );
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  allTransactions = [],
  categories,
  currentYearMonth = getCurrentYearMonth(),
  viewPeriod = 'month',
  onPeriodChange,
  onMonthChange,
  recordedMonths = [],
  customRangeStart = '',
  customRangeEnd = '',
  onCustomRangeChange,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchAcrossAllHistory, setSearchAcrossAllHistory] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Month archive dropdown
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const archiveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (archiveRef.current && !archiveRef.current.contains(e.target as Node)) {
        setIsArchiveOpen(false);
      }
    }
    if (isArchiveOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isArchiveOpen]);

  // Week & Day Navigation (Used when in Month view)
  const monthWeeks = useMemo(() => getMonthWeeks(currentYearMonth), [currentYearMonth]);
  
  // Default to 'all' so that all transactions for the month are visible at once!
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | 'all'>('all');
  const [selectedDayDate, setSelectedDayDate] = useState<string>('all');

  // Reset day selection when month changes, keeping all weeks visible by default
  useEffect(() => {
    setSelectedWeekNum('all');
    setSelectedDayDate('all');
  }, [currentYearMonth]);

  // Current active week object (if a specific week is chosen)
  const selectedWeek = useMemo(() => {
    if (selectedWeekNum === 'all') return null;
    return monthWeeks.find((w) => w.weekNumber === selectedWeekNum) || null;
  }, [monthWeeks, selectedWeekNum]);

  // Calculate statistics per week within the active month
  const weekStats = useMemo(() => {
    const stats: Record<number, { count: number; expense: number; income: number }> = {};
    monthWeeks.forEach((w) => {
      stats[w.weekNumber] = { count: 0, expense: 0, income: 0 };
    });

    transactions.forEach((tx) => {
      const week = monthWeeks.find((w) => w.dayDates.includes(tx.date));
      if (week) {
        stats[week.weekNumber].count += 1;
        if (tx.type === 'expense') stats[week.weekNumber].expense += tx.amount;
        else stats[week.weekNumber].income += tx.amount;
      }
    });

    return stats;
  }, [transactions, monthWeeks]);

  // Daily statistics for the selected week
  const weekDaysInfo = useMemo(() => {
    if (!selectedWeek) return [];
    const baseDays = getDaysOfWeekInfo(selectedWeek.dayDates);

    const dayCounts: Record<string, { count: number; expense: number; income: number }> = {};
    selectedWeek.dayDates.forEach((d) => {
      dayCounts[d] = { count: 0, expense: 0, income: 0 };
    });

    transactions.forEach((tx) => {
      if (dayCounts[tx.date]) {
        dayCounts[tx.date].count += 1;
        if (tx.type === 'expense') dayCounts[tx.date].expense += tx.amount;
        else dayCounts[tx.date].income += tx.amount;
      }
    });

    return baseDays.map((d) => ({
      ...d,
      txCount: dayCounts[d.date]?.count || 0,
      expense: dayCounts[d.date]?.expense || 0,
      income: dayCounts[d.date]?.income || 0,
    }));
  }, [selectedWeek, transactions]);

  // Base list of transactions to filter from (if searchAcrossAllHistory is on, use allTransactions)
  const baseTransactions = useMemo(() => {
    if (searchAcrossAllHistory && allTransactions.length > 0) {
      return allTransactions;
    }
    return transactions;
  }, [transactions, allTransactions, searchAcrossAllHistory]);

  // Filter transactions by week, day, type, category, and search query
  const filteredTransactions = useMemo(() => {
    return baseTransactions.filter((tx) => {
      // 1. Week filter (only if not searching all history and week is selected)
      if (!searchAcrossAllHistory && viewPeriod === 'month' && selectedWeek && !selectedWeek.dayDates.includes(tx.date)) {
        return false;
      }

      // 2. Day filter within week
      if (!searchAcrossAllHistory && viewPeriod === 'month' && selectedDayDate !== 'all' && tx.date !== selectedDayDate) {
        return false;
      }

      // 3. Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // 4. Category filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      // 5. Search query (instant filtering by comments, categories, subcategories, or amounts)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanDigits = q.replace(/\s/g, '');
        const matchesComment = tx.comment?.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesSubcategory = tx.subcategory?.toLowerCase().includes(q);
        const matchesAmount = cleanDigits !== '' && !isNaN(Number(cleanDigits)) && tx.amount.toString().includes(cleanDigits);
        if (!matchesComment && !matchesCategory && !matchesSubcategory && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [baseTransactions, searchAcrossAllHistory, viewPeriod, selectedWeek, selectedDayDate, typeFilter, categoryFilter, searchQuery]);

  // Total matching transactions across the ENTIRE wallet history for search query
  const totalAllHistoryMatches = useMemo(() => {
    if (!searchQuery.trim() || allTransactions.length === 0) return 0;
    const q = searchQuery.toLowerCase().trim();
    const cleanDigits = q.replace(/\s/g, '');
    return allTransactions.filter((tx) => {
      const matchesComment = tx.comment?.toLowerCase().includes(q);
      const matchesCategory = tx.category.toLowerCase().includes(q);
      const matchesSubcategory = tx.subcategory?.toLowerCase().includes(q);
      const matchesAmount = cleanDigits !== '' && !isNaN(Number(cleanDigits)) && tx.amount.toString().includes(cleanDigits);
      return matchesComment || matchesCategory || matchesSubcategory || matchesAmount;
    }).length;
  }, [searchQuery, allTransactions]);

  // Group by date (descending)
  const groupedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt - a.createdAt;
    });

    const groups: {
      date: string;
      items: Transaction[];
      dayTotal: { expense: number; income: number };
    }[] = [];
    const map = new Map<string, Transaction[]>();

    sorted.forEach((tx) => {
      const currentList = map.get(tx.date) || [];
      currentList.push(tx);
      map.set(tx.date, currentList);
    });

    map.forEach((items, date) => {
      let expense = 0;
      let income = 0;
      items.forEach((t) => {
        if (t.type === 'expense') expense += t.amount;
        else income += t.amount;
      });
      groups.push({ date, items, dayTotal: { expense, income } });
    });

    return groups;
  }, [filteredTransactions]);

  // Grouped by Month when in "All Time" mode
  const monthGroups = useMemo(() => {
    if (viewPeriod !== 'all' && !searchAcrossAllHistory) return [];

    const monthMap = new Map<string, {
      yearMonth: string;
      label: string;
      items: Transaction[];
      totalExpense: number;
      totalIncome: number;
    }>();

    filteredTransactions.forEach((tx) => {
      const ym = tx.date.slice(0, 7);
      const curr = monthMap.get(ym) || {
        yearMonth: ym,
        label: getMonthLabel(ym),
        items: [],
        totalExpense: 0,
        totalIncome: 0,
      };
      curr.items.push(tx);
      if (tx.type === 'expense') curr.totalExpense += tx.amount;
      else curr.totalIncome += tx.amount;
      monthMap.set(ym, curr);
    });

    return Array.from(monthMap.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  }, [filteredTransactions, viewPeriod, searchAcrossAllHistory]);

  const categoryMap = useMemo(() => {
    const map: Record<string, CategoryItem> = {};
    categories.forEach((c) => {
      map[c.name] = c;
    });
    return map;
  }, [categories]);

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
  };

  // Totals for the currently active filtered selection
  const activeMetrics = useMemo(() => {
    let expense = 0;
    let income = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'expense') expense += tx.amount;
      else income += tx.amount;
    });
    return {
      expense,
      income,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Latest month with recorded transactions (for empty-month jump banner)
  const latestRecordedMonth = useMemo(() => {
    const m = recordedMonths.find((r) => r.count > 0);
    return m?.yearMonth || null;
  }, [recordedMonths]);

  // Quick preset ranges
  const applyPresetRange = (preset: '30' | '90' | 'thisYear' | 'lastYear') => {
    const now = new Date();
    const endStr = now.toISOString().slice(0, 10);
    let startStr = '';

    if (preset === '30') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startStr = d.toISOString().slice(0, 10);
    } else if (preset === '90') {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      startStr = d.toISOString().slice(0, 10);
    } else if (preset === 'thisYear') {
      startStr = `${now.getFullYear()}-01-01`;
    } else if (preset === 'lastYear') {
      startStr = `${now.getFullYear() - 1}-01-01`;
      const endLast = `${now.getFullYear() - 1}-12-31`;
      onCustomRangeChange?.(startStr, endLast);
      return;
    }

    onCustomRangeChange?.(startStr, endStr);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
      {/* 1. Period Selector Header (За месяц / За всё время / Период дат) */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Period Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => {
                onPeriodChange?.('month');
                setSearchAcrossAllHistory(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                viewPeriod === 'month' && !searchAcrossAllHistory
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>За месяц</span>
              <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">
                ({getMonthLabel(currentYearMonth)})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPeriodChange?.('all');
                setSearchAcrossAllHistory(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                viewPeriod === 'all' || searchAcrossAllHistory
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>За всё время</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/90 text-slate-700 font-bold">
                {allTransactions.length > 0 ? allTransactions.length : transactions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPeriodChange?.('custom');
                setSearchAcrossAllHistory(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                viewPeriod === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 text-indigo-600" />
              <span>Диапазон</span>
            </button>
          </div>

          {/* Month Controls or Archive button */}
          {viewPeriod === 'month' && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => onMonthChange?.(shiftMonth(currentYearMonth, -1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Предыдущий месяц"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative" ref={archiveRef}>
                <button
                  type="button"
                  onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="Выбрать месяц из архива"
                >
                  <span>{getMonthLabel(currentYearMonth)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isArchiveOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-left">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      История по месяцам
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                      {recordedMonths.map((m) => (
                        <button
                          key={m.yearMonth}
                          type="button"
                          onClick={() => {
                            onMonthChange?.(m.yearMonth);
                            setIsArchiveOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                            m.yearMonth === currentYearMonth
                              ? 'bg-indigo-50 text-indigo-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{m.label}</span>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                              m.count > 0 ? 'bg-slate-100 text-slate-700 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {m.count} оп.
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => onMonthChange?.(shiftMonth(currentYearMonth, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Следующий месяц"
                aria-label="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Custom Date Range Picker Bar */}
        {viewPeriod === 'custom' && (
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">С даты:</span>
                <input
                  type="date"
                  value={customRangeStart}
                  onChange={(e) => onCustomRangeChange?.(e.target.value, customRangeEnd)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-600">По:</span>
                <input
                  type="date"
                  value={customRangeEnd}
                  onChange={(e) => onCustomRangeChange?.(customRangeStart, e.target.value)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyPresetRange('30')}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  30 дней
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetRange('90')}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  90 дней
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetRange('thisYear')}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  Этот год
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetRange('lastYear')}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  Прошлый год
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Month View: Week Switcher Tabs (Default: "Весь месяц") */}
        {viewPeriod === 'month' && !searchAcrossAllHistory && (
          <div className="space-y-2 pt-1 border-t border-slate-200/50">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {/* "Весь месяц" is the first tab to prevent hiding earlier weeks */}
              <button
                type="button"
                onClick={() => {
                  setSelectedWeekNum('all');
                  setSelectedDayDate('all');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedWeekNum === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                <span>Весь месяц</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedWeekNum === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {transactions.length}
                </span>
              </button>

              {/* Specific week tabs */}
              {monthWeeks.map((w) => {
                const isSelected = selectedWeekNum === w.weekNumber;
                const stats = weekStats[w.weekNumber] || { count: 0, expense: 0, income: 0 };

                return (
                  <button
                    key={w.weekNumber}
                    type="button"
                    onClick={() => {
                      setSelectedWeekNum(w.weekNumber);
                      setSelectedDayDate('all');
                    }}
                    className={`group relative px-2.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span>{w.label}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      ({w.dateRangeText})
                    </span>

                    {stats.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {stats.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* If a specific week is chosen, show daily filter chips */}
            {selectedWeek && weekDaysInfo.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedDayDate('all')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    selectedDayDate === 'all'
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Вся неделя ({weekStats[selectedWeek.weekNumber]?.count || 0})
                </button>

                {weekDaysInfo.map((d) => {
                  const isDaySelected = selectedDayDate === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDayDate(isDaySelected ? 'all' : d.date)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg whitespace-nowrap transition-all shrink-0 flex items-center gap-1 cursor-pointer border ${
                        isDaySelected
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                          : d.isToday
                          ? 'bg-indigo-50/80 text-indigo-800 border-indigo-200 font-semibold hover:bg-indigo-100'
                          : d.txCount > 0
                          ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                          : 'bg-white text-slate-400 border-slate-200/60 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {d.dayOfWeekShort} {d.dayNumber}
                      </span>
                      {d.isToday && (
                        <span
                          className={`text-[9px] uppercase px-1 rounded-sm ${
                            isDaySelected ? 'bg-white/20 text-white' : 'bg-indigo-200/60 text-indigo-900'
                          }`}
                        >
                          Сегодня
                        </span>
                      )}
                      {d.txCount > 0 && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDaySelected ? 'bg-white' : 'bg-emerald-500'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All Time Mode Summary Banner */}
        {viewPeriod === 'all' && (
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900">
                Полная история кошелька
              </span>
              <span className="text-slate-500">
                • {filteredTransactions.length} {pluralizeRu(filteredTransactions.length, 'операция', 'операции', 'операций')}
              </span>
            </div>
            <div className="flex items-center gap-3 font-medium">
              <span className="text-slate-600">
                Расход: <strong className="text-rose-600">-{formatCurrency(activeMetrics.expense)}</strong>
              </span>
              <span className="text-slate-600">
                Доход: <strong className="text-emerald-600">+{formatCurrency(activeMetrics.income)}</strong>
              </span>
              <span className="text-slate-600">
                Баланс:{' '}
                <strong className={activeMetrics.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {activeMetrics.balance >= 0 ? '+' : ''}{formatCurrency(activeMetrics.balance)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Helpful banner when current month has 0 operations, but other months have operations */}
      {transactions.length === 0 && allTransactions.length > 0 && viewPeriod === 'month' && !searchQuery && (
        <div className="p-4 mx-4 my-3 bg-indigo-50/90 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                В {getMonthLabel(currentYearMonth)} операций пока нет
              </h4>
              <p className="text-xs text-slate-600">
                Все ваши записи сохранены! В кошельке имеется {allTransactions.length} {pluralizeRu(allTransactions.length, 'операция', 'операции', 'операций')} за предыдущие периоды.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onPeriodChange?.('all')}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              Показать за всё время
            </button>
            {latestRecordedMonth && latestRecordedMonth !== currentYearMonth && (
              <button
                type="button"
                onClick={() => onMonthChange?.(latestRecordedMonth)}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-slate-50 border border-indigo-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                К последним ({getMonthLabel(latestRecordedMonth)})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Filters & Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Control (All / Expenses / Income) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все ({filteredTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Расходы
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Доходы
            </button>
          </div>

          {/* Search Input for Comments & Categories with Instant Filtering */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по комментариям, категориям или суммам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Очистить поиск"
                aria-label="Очистить поиск"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter & Global History Search Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Все категории</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {searchQuery.trim() && (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                Найдено: {filteredTransactions.length}
              </span>
            )}

            {(categoryFilter !== 'all' || searchQuery || selectedDayDate !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                  setSelectedDayDate('all');
                  setSearchAcrossAllHistory(false);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 cursor-pointer"
              >
                Сбросить фильтры
              </button>
            )}
          </div>

          {/* Toggle for searching all history when in month view */}
          {viewPeriod === 'month' && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={searchAcrossAllHistory}
                onChange={(e) => setSearchAcrossAllHistory(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium">Искать по всей истории ({allTransactions.length})</span>
            </label>
          )}
        </div>

        {/* Notice if search has matches in other months */}
        {searchQuery.trim() && !searchAcrossAllHistory && viewPeriod === 'month' && totalAllHistoryMatches > filteredTransactions.length && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2">
            <span>
              В текущем месяце найдено {filteredTransactions.length}, но в других месяцах есть еще{' '}
              <strong>{totalAllHistoryMatches - filteredTransactions.length}</strong> {pluralizeRu(totalAllHistoryMatches - filteredTransactions.length, 'совпадение', 'совпадения', 'совпадений')}!
            </span>
            <button
              type="button"
              onClick={() => setSearchAcrossAllHistory(true)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0 cursor-pointer"
            >
              Показать все ({totalAllHistoryMatches})
            </button>
          </div>
        )}
      </div>

      {/* 3. Operations List */}
      <div className="flex-1 divide-y divide-slate-100 min-h-[300px]">
        {groupedTransactions.length === 0 ? (
          searchQuery.trim() ? (
            <div className="py-14 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                Ничего не найдено по запросу «{searchQuery}»
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                Не найдено операций с такой категорией, подкатегорией, суммой или комментарием.
              </p>

              {totalAllHistoryMatches > 0 && !searchAcrossAllHistory && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setSearchAcrossAllHistory(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Искать во всей истории кошелька ({totalAllHistoryMatches})</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Очистить поиск</span>
              </button>
            </div>
          ) : (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                {viewPeriod === 'all'
                  ? 'В кошельке пока нет сохраненных операций'
                  : selectedWeek
                  ? `На ${selectedWeek.label} (${selectedWeek.dateRangeText}) нет операций`
                  : `В ${getMonthLabel(currentYearMonth)} нет операций`}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {allTransactions.length > 0 && viewPeriod === 'month'
                  ? `У вас сохранено ${allTransactions.length} операций за другие периоды.`
                  : 'Нажмите «Добавить операцию», чтобы внести доход или расход.'}
              </p>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                {allTransactions.length > 0 && viewPeriod === 'month' && (
                  <button
                    type="button"
                    onClick={() => onPeriodChange?.('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Показать операции за всё время</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenAddModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить операцию</span>
                </button>
              </div>
            </div>
          )
        ) : (
          groupedTransactions.map((group, groupIdx) => {
            const hasPrev = groupIdx > 0;
            const prevGroup = hasPrev ? groupedTransactions[groupIdx - 1] : null;
            const isNewMonth = !prevGroup || prevGroup.date.slice(0, 7) !== group.date.slice(0, 7);
            const groupYearMonth = group.date.slice(0, 7);

            return (
              <div key={group.date} className="divide-y divide-slate-50">
                {/* Month Separator Header when viewing across multiple months */}
                {(viewPeriod === 'all' || searchAcrossAllHistory || viewPeriod === 'custom') && isNewMonth && (
                  <div className="bg-slate-100/90 px-4 sm:px-5 py-2.5 border-y border-slate-200/80 flex items-center justify-between text-xs sticky top-16 z-20 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="font-extrabold text-slate-900 text-sm">
                        {getMonthLabel(groupYearMonth)}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {monthGroups.find((m) => m.yearMonth === groupYearMonth)?.items.length || ''} оп.
                    </span>
                  </div>
                )}

                {/* Day Header with Date & Day Subtotals */}
                <div className="bg-slate-50/70 px-4 sm:px-5 py-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateGroupHeading(group.date)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({group.items.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px]">
                    {group.dayTotal.income > 0 && (
                      <span className="text-emerald-600 font-bold">
                        +{formatCurrency(group.dayTotal.income)}
                      </span>
                    )}
                    {group.dayTotal.expense > 0 && (
                      <span className="text-slate-700 font-bold">
                        -{formatCurrency(group.dayTotal.expense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Operations within this Date */}
                <div className="divide-y divide-slate-100">
                  {group.items.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const catObj = categoryMap[tx.category];
                    const isBeingDeleted = deletingId === tx.id;

                    return (
                      <div
                        key={tx.id}
                        className="px-4 sm:px-5 py-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between group"
                      >
                        {/* Left: Category Icon, Category, Subcategory & Comment */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                            style={{
                              backgroundColor: `${catObj?.color || '#64748b'}18`,
                              color: catObj?.color || '#64748b',
                            }}
                          >
                            <CategoryIcon
                              name={catObj?.icon || 'Tag'}
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              size={18}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {highlightMatch(tx.category, searchQuery)}
                              </span>

                              {/* Subcategory Tag if present */}
                              {tx.subcategory && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {highlightMatch(tx.subcategory, searchQuery)}
                                </span>
                              )}
                            </div>

                            {tx.comment && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                                <span className="truncate text-slate-600">
                                  {highlightMatch(tx.comment, searchQuery)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                          <span
                            className={`text-sm sm:text-base font-extrabold tracking-tight ${
                              isExpense ? 'text-slate-900' : 'text-emerald-600'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatCurrency(tx.amount)}
                          </span>

                          <div className="flex items-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => onEdit(tx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Редактировать"
                              aria-label="Редактировать операцию"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Удалить"
                              aria-label="Удалить операцию"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Delete Confirmation Popup */}
                        {isBeingDeleted && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                              <div className="flex items-center gap-3 mb-3 text-rose-600">
                                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">
                                  Удалить операцию?
                                </h4>
                              </div>
                              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                Вы уверены, что хотите удалить операцию «{tx.category}» на сумму{' '}
                                <strong>{formatCurrency(tx.amount)}</strong>?
                              </p>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                >
                                  Отмена
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(tx.id)}
                                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
