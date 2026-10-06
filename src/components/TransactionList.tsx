import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { CategoryItem, Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateGroupHeading } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  categories: CategoryItem[];
  members: string[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  members,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      // Member
      if (memberFilter !== 'all' && tx.member !== memberFilter) return false;
      // Category
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesComment = tx.comment?.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesMember = tx.member.toLowerCase().includes(q);
        const matchesAmount = tx.amount.toString().includes(q);
        if (!matchesComment && !matchesCategory && !matchesMember && !matchesAmount) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, typeFilter, memberFilter, categoryFilter, searchQuery]);

  // Group by date (descending)
  const groupedTransactions = useMemo(() => {
    // Sort transactions by date descending, then by createdAt descending
    const sorted = [...filteredTransactions].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt - a.createdAt;
    });

    const groups: { date: string; items: Transaction[]; dayTotal: { expense: number; income: number } }[] = [];
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
      {/* Filters and Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Interactive Segmented Control (All / Expenses / Income) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Расходы
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Доходы
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по комментарию, сумме..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Member and Category Sub-Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Все члены семьи</option>
              {members.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

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

          {(memberFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setMemberFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 divide-y divide-slate-100 min-h-[300px]">
        {groupedTransactions.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              {transactions.length === 0 ? 'Семейный кошелёк пуст' : 'Операции не найдены'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {transactions.length === 0
                ? 'В этом месяце пока нет записей. Нажмите «Добавить операцию», чтобы внести первый доход или расход семьи!'
                : 'По выбранным фильтрам или поисковому запросу операции не найдены.'}
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить операцию</span>
            </button>
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.date} className="p-4 sm:p-5">
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 text-xs font-medium text-slate-500">
                <span className="font-semibold text-slate-700">
                  {formatDateGroupHeading(group.date)}
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  {group.dayTotal.expense > 0 && (
                    <span className="text-slate-600">
                      Расход: -{formatCurrency(group.dayTotal.expense)}
                    </span>
                  )}
                  {group.dayTotal.income > 0 && (
                    <span className="text-emerald-600 font-medium">
                      Доход: +{formatCurrency(group.dayTotal.income)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions in Day */}
              <div className="space-y-2">
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
                            backgroundColor: cat?.color || (isExpense ? '#64748b' : '#059669'),
                          }}
                        >
                          <CategoryIcon name={cat?.icon || (isExpense ? 'Tag' : 'Coins')} className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {tx.category}
                            </span>
                          </div>

                          {/* Zero-pill metadata line with typographic separator */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                            <span className="font-medium text-slate-700">{tx.member}</span>
                            {tx.comment && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate text-slate-600">{tx.comment}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-sm sm:text-base font-bold ${
                              isExpense ? 'text-slate-900' : 'text-emerald-600'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>

                        {/* Hover Actions: Edit & Delete */}
                        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
                            title="Редактировать"
                            aria-label="Редактировать"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Удалить"
                            aria-label="Удалить"
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
                              <strong>{formatCurrency(tx.amount)}</strong> от {tx.member}?
                            </p>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                              >
                                Отмена
                              </button>
                              <button
                                onClick={() => confirmDelete(tx.id)}
                                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
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
