import React, { useState } from 'react';
import {
  X,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { CategoryItem, RegularPayment } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface RegularPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: RegularPayment[];
  categories: CategoryItem[];
  onSavePayments: (payments: RegularPayment[]) => void;
  onPayNow: (payment: RegularPayment) => void;
}

export const RegularPaymentsModal: React.FC<RegularPaymentsModalProps> = ({
  isOpen,
  onClose,
  payments,
  categories,
  onSavePayments,
  onPayNow,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDay, setNewDay] = useState('10');
  const [newCategory, setNewCategory] = useState(categories[0]?.name || 'Жильё');
  const [newNoticeDays, setNewNoticeDays] = useState('3');

  if (!isOpen) return null;

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(newAmount.replace(/\s/g, '').replace(',', '.'));
    const dayNum = parseInt(newDay, 10);
    const noticeNum = parseInt(newNoticeDays, 10) || 3;

    if (!newTitle.trim() || isNaN(cleanAmount) || cleanAmount <= 0 || isNaN(dayNum)) {
      return;
    }

    const boundedAmount = Math.min(100_000_000_000, Math.max(1, Math.round(cleanAmount)));

    const newPayment: RegularPayment = {
      id: `bill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newTitle.trim().slice(0, 100),
      amount: boundedAmount,
      dayOfMonth: Math.max(1, Math.min(31, dayNum)),
      category: (newCategory || 'Жильё').slice(0, 60),
      autoPayNoticeDays: Math.max(1, Math.min(30, noticeNum)),
    };

    onSavePayments([...payments, newPayment]);
    setNewTitle('');
    setNewAmount('');
    setIsAdding(false);
  };

  const handleDeletePayment = (id: string) => {
    onSavePayments(payments.filter((p) => p.id !== id));
  };

  const totalRegularMonthly = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Регулярные платежи
              </h2>
              <p className="text-xs text-slate-500">
                Автоматические напоминания о сроках оплаты (аренда, ЖКХ, подписки)
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Всего регулярных платежей:</span>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(totalRegularMonthly)} / месяц
            </span>
          </div>

          {/* List of regular payments */}
          <div className="space-y-2.5">
            {payments.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Регулярные платежи пока не добавлены. Добавьте аренду, ЖКХ или интернет!
              </div>
            ) : (
              payments.map((p) => {
                const catObj = categories.find((c) => c.name === p.category);
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 text-xs"
                        style={{ backgroundColor: catObj?.color || '#64748b' }}
                      >
                        <CategoryIcon name={catObj?.icon || 'Tag'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{p.dayOfMonth}-е число</span>
                          <span>·</span>
                          <span>{p.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-1">
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrency(p.amount)}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onPayNow(p);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Внести как расход сегодня"
                      >
                        Оплатить
                      </button>

                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add form */}
          {isAdding ? (
            <form
              onSubmit={handleAddPayment}
              className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3"
            >
              <div className="text-xs font-bold text-indigo-900">Новый регулярный платеж</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Интернет или Аренда"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Сумма (₽)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="5000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    День месяца (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Категория
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Сохранить
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить регулярный платеж</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
