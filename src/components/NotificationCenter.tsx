import React, { useRef, useEffect } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Settings,
} from 'lucide-react';
import { AppNotification, RegularPayment } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NotificationCenterProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDismiss: (notificationId: string) => void;
  onDismissAll: () => void;
  onPayBillQuick: (payment: RegularPayment) => void;
  onOpenRegularPaymentsModal: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  isOpen,
  onToggle,
  onClose,
  onDismiss,
  onDismissAll,
  onPayBillQuick,
  onOpenRegularPaymentsModal,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={onToggle}
        className={`relative p-2 rounded-xl transition-all ${
          isOpen
            ? 'bg-slate-200 text-slate-800'
            : unreadCount > 0
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        aria-label="Уведомления"
        title="Уведомления и регулярные платежи"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Уведомления</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-slate-200/80 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onDismissAll}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Очистить все
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">Все в порядке!</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Лимиты бюджета соблюдаются, а срочных регулярных платежей сейчас нет.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isOverBudget = notif.type === 'budget_exceeded';
                const isBudgetWarning = notif.type === 'budget_warning';
                const isBillOverdue = notif.type === 'bill_overdue';
                const isBillToday = notif.type === 'bill_today';
                const isBillDue = notif.type === 'bill_due';

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors relative group ${
                      isOverBudget || isBillOverdue || isBillToday
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : 'bg-amber-50/30 hover:bg-amber-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isOverBudget || isBillOverdue || isBillToday
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isOverBudget || isBudgetWarning ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {notif.title}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Action buttons (e.g., quick pay for bill) */}
                        {notif.actionData && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                onPayBillQuick(notif.actionData);
                                onDismiss(notif.id);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>{notif.actionLabel || 'Оплатить'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onDismiss(notif.id)}
                        className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity"
                        title="Скрыть"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with link to regular payments */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                onOpenRegularPaymentsModal();
              }}
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Управление регулярными платежами</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
