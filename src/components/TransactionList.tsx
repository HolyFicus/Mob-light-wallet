import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { CategoryItem, Transaction, TransactionType } from '../types';
import {
  formatCurrency,
  formatDateGroupHeading,
  getCurrentYearMonth,
  getMonthLabel,
  pluralizeRu,
} from '../utils/formatters';
import {
  getMonthWeeks,
  getDaysOfWeekInfo,
  MonthWeek,
} from '../utils/weekCalculations';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  categories: CategoryItem[];
  currentYearMonth?: string;
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
  categories,
  currentYearMonth = getCurrentYearMonth(),
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Week & Day Navigation
  const monthWeeks = useMemo(() => getMonthWeeks(currentYearMonth), [currentYearMonth]);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | 'all'>(() => {
    const weeks = getMonthWeeks(currentYearMonth);
    const cur = weeks.find((w) => w.isCurrentWeek);
    return cur ? cur.weekNumber : (weeks.length > 0 ? 1 : 'all');
  });
  const [selectedDayDate, setSelectedDayDate] = useState<string>('all');

  // Auto-select the current week when viewing the current month, or the 1st week for past/future months
  useEffect(() => {
    const curWeek = monthWeeks.find((w) => w.isCurrentWeek);
    if (curWeek) {
      setSelectedWeekNum(curWeek.weekNumber);
    } else if (monthWeeks.length > 0) {
      setSelectedWeekNum(1);
    } else {
      setSelectedWeekNum('all');
    }
    setSelectedDayDate('all');
  }, [currentYearMonth, monthWeeks]);

  // Current active week object
  const selectedWeek = useMemo(() => {
    if (selectedWeekNum === 'all') return null;
    return monthWeeks.find((w) => w.weekNumber === selectedWeekNum) || null;
  }, [monthWeeks, selectedWeekNum]);

  // Calculate statistics per week
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

    // Count transactions per day
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

  // Navigation handlers
  const handlePrevWeek = () => {
    if (selectedWeekNum === 'all') {
      setSelectedWeekNum(1);
    } else if (selectedWeekNum > 1) {
      setSelectedWeekNum(selectedWeekNum - 1);
    }
    setSelectedDayDate('all');
  };

  const handleNextWeek = () => {
    if (selectedWeekNum === 'all') {
      setSelectedWeekNum(1);
    } else if (selectedWeekNum < monthWeeks.length) {
      setSelectedWeekNum(selectedWeekNum + 1);
    }
    setSelectedDayDate('all');
  };

  const handleSelectWeek = (weekNum: number | 'all') => {
    setSelectedWeekNum(weekNum);
    setSelectedDayDate('all');
  };

  // Filter transactions by week, day, type, category, and search query
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Week filter
      if (selectedWeek && !selectedWeek.dayDates.includes(tx.date)) {
        return false;
      }

      // 2. Day filter within week
      if (selectedDayDate !== 'all' && tx.date !== selectedDayDate) {
        return false;
      }

      // 3. Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // 4. Category filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      // 5. Search query (instant filtering by comments, categories, or amounts)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanDigits = q.replace(/\s/g, '');
        const matchesComment = tx.comment?.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesAmount = cleanDigits !== '' && !isNaN(Number(cleanDigits)) && tx.amount.toString().includes(cleanDigits);
        if (!matchesComment && !matchesCategory && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedWeek, selectedDayDate, typeFilter, categoryFilter, searchQuery]);

  // Total matching transactions across the whole month for the current search query
  const totalMonthSearchMatches = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase().trim();
    const cleanDigits = q.replace(/\s/g, '');
    return transactions.filter((tx) => {
      const matchesComment = tx.comment?.toLowerCase().includes(q);
      const matchesCategory = tx.category.toLowerCase().includes(q);
      const matchesAmount = cleanDigits !== '' && !isNaN(Number(cleanDigits)) && tx.amount.toString().includes(cleanDigits);
      return matchesComment || matchesCategory || matchesAmount;
    }).length;
  }, [searchQuery, transactions]);

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

  // Selected week totals
  const currentWeekMetrics = useMemo(() => {
    if (!selectedWeek) {
      let expense = 0;
      let income = 0;
      transactions.forEach((tx) => {
        if (tx.type === 'expense') expense += tx.amount;
        else income += tx.amount;
      });
      return {
        expense,
        income,
        balance: income - expense,
        count: transactions.length,
      };
    }
    const currentStats = weekStats[selectedWeek.weekNumber] || { expense: 0, income: 0, count: 0 };
    return {
      expense: currentStats.expense,
      income: currentStats.income,
      balance: currentStats.income - currentStats.expense,
      count: currentStats.count,
    };
  }, [selectedWeek, transactions, weekStats]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
      {/* 1. Week Switcher & Navigation Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Операции по неделям
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                  {monthWeeks.length} {pluralizeRu(monthWeeks.length, 'неделя', 'недели', 'недель')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {getMonthLabel(currentYearMonth)} • переключайтесь между неделями месяца
              </p>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrevWeek}
              disabled={selectedWeekNum === 1 || selectedWeekNum === 'all'}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Предыдущая неделя"
              aria-label="Предыдущая неделя"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              disabled={
                selectedWeekNum === 'all' || selectedWeekNum === monthWeeks.length
              }
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="Следующая неделя"
              aria-label="Следующая неделя"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Week Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {monthWeeks.map((w) => {
            const isSelected = selectedWeekNum === w.weekNumber;
            const stats = weekStats[w.weekNumber] || { count: 0, expense: 0, income: 0 };

            return (
              <button
                key={w.weekNumber}
                onClick={() => handleSelectWeek(w.weekNumber)}
                className={`group relative px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <span>{w.label}</span>
                <span
                  className={`text-[10px] ${
                    isSelected ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  ({w.dateRangeText})
                </span>

                {/* Operations count pill */}
                {stats.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-800'
                    }`}
                  >
                    {stats.count}
                  </span>
                )}

                {/* Current Week indicator dot */}
                {w.isCurrentWeek && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                    }`}
                    title="Текущая неделя"
                  />
                )}
              </button>
            );
          })}

          <button
            onClick={() => handleSelectWeek('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              selectedWeekNum === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Весь месяц ({transactions.length})
          </button>
        </div>

        {/* Selected Week Overview Card */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm">
                {selectedWeek
                  ? `${selectedWeek.label}: ${selectedWeek.fullRangeText}`
                  : `Все операции за ${getMonthLabel(currentYearMonth)}`}
              </span>
              {selectedWeek?.isCurrentWeek && (
                <span className="ml-2 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                  Идет сейчас
                </span>
              )}
            </div>

            {/* Quick Week Totals */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="text-slate-600 font-medium">
                Расход: <strong className="text-rose-600">-{formatCurrency(currentWeekMetrics.expense)}</strong>
              </span>
              {currentWeekMetrics.income > 0 && (
                <span className="text-slate-600 font-medium">
                  Доход: <strong className="text-emerald-600">+{formatCurrency(currentWeekMetrics.income)}</strong>
                </span>
              )}
              <span className="text-slate-600 font-medium">
                Баланс:{' '}
                <strong
                  className={
                    currentWeekMetrics.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }
                >
                  {currentWeekMetrics.balance >= 0 ? '+' : ''}
                  {formatCurrency(currentWeekMetrics.balance)}
                </strong>
              </span>
              <span className="text-slate-500 font-medium">
                Операций: <strong className="text-slate-800">{currentWeekMetrics.count}</strong>
              </span>
            </div>
          </div>

          {/* Interactive Day Chips within the Selected Week */}
          {selectedWeek && weekDaysInfo.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedDayDate('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedDayDate === 'all'
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Вся неделя
              </button>

              {weekDaysInfo.map((d) => {
                const isDaySelected = selectedDayDate === d.date;
                return (
                  <button
                    key={d.date}
                    onClick={() =>
                      setSelectedDayDate(isDaySelected ? 'all' : d.date)
                    }
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
                          isDaySelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-200/60 text-indigo-900'
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
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Control (All / Expenses / Income) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl shrink-0">
            <button
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
              placeholder="Поиск по комментариям или категориям..."
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

        {/* Category Filter & Search Counter */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
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
              onClick={() => {
                setCategoryFilter('all');
                setSearchQuery('');
                setSelectedDayDate('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 cursor-pointer"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* 3. Daily Transactions in Selected Week */}
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
                {selectedWeekNum !== 'all' && totalMonthSearchMatches > 0
                  ? `В текущей неделе совпадений нет, но найдено ${totalMonthSearchMatches} ${pluralizeRu(totalMonthSearchMatches, 'операция', 'операции', 'операций')} в других неделях этого месяца.`
                  : 'Не найдено операций с такой категорией, суммой или комментарием. Попробуйте изменить запрос.'}
              </p>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                {selectedWeekNum !== 'all' && totalMonthSearchMatches > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectWeek('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Искать за весь месяц ({totalMonthSearchMatches})</span>
                  </button>
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
            </div>
          ) : (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                {selectedWeek
                  ? `На ${selectedWeek.label} (${selectedWeek.dateRangeText}) пока нет операций`
                  : 'Операции не найдены'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {transactions.length === 0
                  ? 'В этом месяце пока нет записей. Нажмите «Добавить операцию», чтобы внести первый доход или расход!'
                  : 'По выбранной неделе или фильтрам операции отсутствуют.'}
              </p>
              <button
                onClick={() =>
                  onOpenAddModal(
                    selectedDayDate !== 'all' ? selectedDayDate : selectedWeek?.startDate
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить операцию</span>
              </button>
            </div>
          )
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.date} className="p-4 sm:p-5">
              {/* Day Header with Day of Week and Totals */}
              <div className="flex items-center justify-between pb-3 text-xs font-medium text-slate-500 border-b border-slate-100/80 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">
                    {formatDateGroupHeading(group.date)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    • {group.items.length} {pluralizeRu(group.items.length, 'операция', 'операции', 'операций')}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  {group.dayTotal.expense > 0 && (
                    <span className="text-slate-600">
                      Расход: <strong className="text-slate-900 font-bold">-{formatCurrency(group.dayTotal.expense)}</strong>
                    </span>
                  )}
                  {group.dayTotal.income > 0 && (
                    <span className="text-emerald-600 font-medium">
                      Доход: <strong className="font-bold">+{formatCurrency(group.dayTotal.income)}</strong>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenAddModal(group.date)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-colors cursor-pointer"
                    title={`Добавить операцию на этот день (${formatDateGroupHeading(group.date)})`}
                    aria-label="Добавить операцию"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day's Transactions List */}
              <div className="space-y-1.5">
                {group.items.map((tx) => {
                  const cat = categoryMap[tx.category];
                  const isExpense = tx.type === 'expense';
                  const isBeingDeleted = deletingId === tx.id;

                  return (
                    <div
                      key={tx.id}
                      className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all"
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{
                            backgroundColor:
                              cat?.color || (isExpense ? '#64748b' : '#059669'),
                          }}
                        >
                          <CategoryIcon
                            name={cat?.icon || (isExpense ? 'Tag' : 'Coins')}
                            className="w-4 h-4"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {highlightMatch(tx.category, searchQuery)}
                            </span>
                          </div>

                          {/* Metadata line */}
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
                            onClick={() => onEdit(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Редактировать"
                            aria-label="Редактировать операцию"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
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
                                onClick={() => setDeletingId(null)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                Отмена
                              </button>
                              <button
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
          ))
        )}
      </div>
    </div>
  );
};
