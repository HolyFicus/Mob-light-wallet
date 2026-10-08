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
} from 'lucide-react';
import {
  getCurrentYearMonth,
  getMonthLabel,
  shiftMonth,
} from '../utils/formatters';
import { RegularPayment } from '../types';

interface HeaderProps {
  currentYearMonth: string;
  onMonthChange: (newYM: string) => void;
  onOpenAddModal: () => void;
  onOpenBudgetModal: () => void;
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
  onOpenAddModal,
  onOpenBudgetModal,
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
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const realCurrentYM = getCurrentYearMonth();
  const isCurrentMonth = currentYearMonth === realCurrentYM;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

        {/* Month Filter Navigator (Center) */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100/90 p-1 rounded-xl">
          <button
            onClick={() => onMonthChange(shiftMonth(currentYearMonth, -1))}
            className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            title="Предыдущий месяц"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-slate-800 px-2 sm:px-3 text-center whitespace-nowrap">
              {getMonthLabel(currentYearMonth)}
            </span>
            <input
              type="month"
              value={currentYearMonth}
              onChange={(e) => {
                if (e.target.value) onMonthChange(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              title="Выбрать месяц"
            />
          </div>

          <button
            onClick={() => onMonthChange(shiftMonth(currentYearMonth, 1))}
            className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            title="Следующий месяц"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={() => onMonthChange(realCurrentYM)}
              className="hidden md:inline-flex text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded-md shadow-2xs ml-1 transition-colors"
            >
              Текущий
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
