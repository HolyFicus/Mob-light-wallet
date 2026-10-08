import React, { useState, useRef, useEffect } from 'react';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Calendar,
  MoreVertical,
  Target,
  Repeat,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Landmark,
  FileSpreadsheet,
  AlertCircle,
  Tag,
  History,
  ChevronDown,
  CalendarRange,
} from 'lucide-react';
import {
  getCurrentYearMonth,
  getMonthLabel,
  shiftMonth,
  pluralizeRu,
} from '../utils/formatters';
import { RegularPayment, ViewPeriod, RecordedMonthInfo } from '../types';

interface HeaderProps {
  currentYearMonth: string;
  onMonthChange: (newYM: string) => void;
  viewPeriod?: ViewPeriod;
  onPeriodChange?: (newPeriod: ViewPeriod) => void;
  recordedMonths?: RecordedMonthInfo[];
  totalAllTransactionsCount?: number;
  onOpenAddModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenCategoriesModal: () => void;
  onOpenRegularPaymentsModal: () => void;
  onOpenDepositsModal: () => void;
  onOpenAiAssistantModal: () => void;
  onOpenInstallModal: () => void;
  isAppInstalled?: boolean;
  onPayBillQuick: (bill: RegularPayment) => void;
  onExportData: () => void;
  onExportCSV?: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
  onClearData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentYearMonth,
  onMonthChange,
  viewPeriod = 'month',
  onPeriodChange,
  recordedMonths = [],
  totalAllTransactionsCount = 0,
  onOpenAddModal,
  onOpenBudgetModal,
  onOpenCategoriesModal,
  onOpenRegularPaymentsModal,
  onOpenDepositsModal,
  onOpenAiAssistantModal,
  onOpenInstallModal,
  isAppInstalled,
  onPayBillQuick,
  onExportData,
  onExportCSV,
  onImportData,
  onResetData,
  onClearData,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isArchiveDropdownOpen, setIsArchiveDropdownOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const archiveDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const realCurrentYM = getCurrentYearMonth();
  const isCurrentMonth = currentYearMonth === realCurrentYM;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (archiveDropdownRef.current && !archiveDropdownRef.current.contains(event.target as Node)) {
        setIsArchiveDropdownOpen(false);
      }
    }
    if (isMenuOpen || isArchiveDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isArchiveDropdownOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              Семейный кошелёк
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-500 font-medium">
              Учет финансов и совместный бюджет
            </p>
          </div>
        </div>

        {/* Month Filter Navigator & History Switcher (Center) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {viewPeriod === 'all' ? (
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-2xs">
              <History className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold text-indigo-900 block leading-tight">
                  За всё время
                </span>
                <span className="text-[10px] text-indigo-600 font-medium hidden sm:block">
                  Все {totalAllTransactionsCount} {pluralizeRu(totalAllTransactionsCount, 'операция', 'операции', 'операций')}
                </span>
              </div>
              <button
                onClick={() => onPeriodChange?.('month')}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100/60 px-2 sm:px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors ml-1 cursor-pointer"
                title="Переключиться на просмотр по месяцам"
              >
                По месяцам
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/90 p-1 rounded-xl">
              <button
                onClick={() => {
                  onMonthChange(shiftMonth(currentYearMonth, -1));
                  if (viewPeriod !== 'month') onPeriodChange?.('month');
                }}
                className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Предыдущий месяц"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Dropdown / Picker */}
              <div className="relative" ref={archiveDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsArchiveDropdownOpen(!isArchiveDropdownOpen)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold text-slate-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Выбрать период или архив"
                >
                  <span>{getMonthLabel(currentYearMonth)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Archive & Month Dropdown Menu */}
                {isArchiveDropdownOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Период просмотра
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onPeriodChange?.('all');
                        setIsArchiveDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-bold">За всё время</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {totalAllTransactionsCount} оп.
                      </span>
                    </button>

                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100">
                      Сохраненные месяцы ({recordedMonths.length})
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                      {recordedMonths.map((m) => {
                        const isSelected = viewPeriod === 'month' && m.yearMonth === currentYearMonth;
                        return (
                          <button
                            key={m.yearMonth}
                            type="button"
                            onClick={() => {
                              onMonthChange(m.yearMonth);
                              onPeriodChange?.('month');
                              setIsArchiveDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/80 text-indigo-900 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{m.label}</span>
                            <span
                              className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                                m.count > 0
                                  ? 'bg-slate-100 text-slate-700 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {m.count} оп.
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onMonthChange(shiftMonth(currentYearMonth, 1));
                  if (viewPeriod !== 'month') onPeriodChange?.('month');
                }}
                className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                title="Следующий месяц"
                aria-label="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isCurrentMonth && (
                <button
                  onClick={() => {
                    onMonthChange(realCurrentYM);
                    if (viewPeriod !== 'month') onPeriodChange?.('month');
                  }}
                  className="hidden md:inline-flex text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded-md shadow-2xs ml-1 transition-colors cursor-pointer"
                >
                  Текущий
                </button>
              )}
            </div>
          )}

          {/* Quick "All Time" Toggle Button in Header */}
          {viewPeriod !== 'all' && (
            <button
              onClick={() => onPeriodChange?.('all')}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-200 cursor-pointer"
              title="Показать все операции за всё время"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Вся история</span>
              {totalAllTransactionsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white text-indigo-700 rounded-md border border-slate-200">
                  {totalAllTransactionsCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Install / Add to Desktop Button */}
          {!isAppInstalled && (
            <button
              onClick={onOpenInstallModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/60"
              title="Добавить сайт на рабочий стол телефона или ПК"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span className="hidden lg:inline">На рабочий стол</span>
            </button>
          )}

          {/* Deposits Button */}
          <button
            onClick={onOpenDepositsModal}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/60"
            title="Вклады, проценты и накопления"
          >
            <Landmark className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Вклады</span>
          </button>

          {/* AI Advisor Button */}
          <button
            onClick={onOpenAiAssistantModal}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-linear-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/60"
            title="Спросить ИИ-советника по финансам"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">ИИ-помощник</span>
          </button>

          {/* Settings / More Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              aria-label="Меню настроек"
              title="Меню и управление"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenCategoriesModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-indigo-700 hover:bg-indigo-50/60 font-semibold"
                >
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>Категории и подкатегории</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenBudgetModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Настроить бюджеты</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenRegularPaymentsModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Repeat className="w-4 h-4 text-amber-600" />
                  <span>Регулярные платежи</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenDepositsModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Landmark className="w-4 h-4 text-indigo-600" />
                  <span>Вклады и проценты</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenInstallModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-indigo-700 hover:bg-indigo-50/60 font-semibold"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>На рабочий стол (PWA)</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportCSV?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Экспорт в CSV (Excel / Таблицы)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportData();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Резервная копия (JSON)</span>
                </button>

                <label className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Импорт данных (JSON)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsConfirmClearOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Очистить все данные</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Add Button (Desktop & Mobile) */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Операция</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing All Data */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Очистить все данные?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Это действие необратимо
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Будут безвозвратно удалены все операции, бюджеты, регулярные платежи и вклады. Перед очисткой вы можете сохранить резервную копию JSON.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmClearOpen(false);
                  onClearData();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Да, очистить всё
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
