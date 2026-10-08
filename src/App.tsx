import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  ShieldCheck,
  Download,
  Landmark,
  PiggyBank,
  ArrowUpRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  CategoryBudgets,
  RegularPayment,
  Transaction,
  TransactionType,
  Deposit,
} from './types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from './data/defaultData';
import {
  getCurrentYearMonth,
  getDaysInMonth,
  formatCurrency,
  pluralizeRu,
} from './utils/formatters';
import {
  loadTransactions,
  saveTransactions,
  loadBudgets,
  saveBudgets,
  loadRegularPayments,
  saveRegularPayments,
  loadDeposits,
  saveDeposits,
  resetAllToDefaults,
  clearAllData,
} from './utils/storage';
import {
  calculateTotalDeposits,
  calculateTotalMonthlyInterest,
} from './utils/depositCalculations';
import { exportTransactionsToCsv } from './utils/exportCsv';

import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { BudgetProgressPanel } from './components/BudgetProgressPanel';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { RegularPaymentsModal } from './components/RegularPaymentsModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AuthorBadge } from './components/AuthorBadge';
import { InstallAppModal } from './components/InstallAppModal';
import { DepositsModal } from './components/DepositsModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  // Current selected month (YYYY-MM)
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => getCurrentYearMonth());

  // Persistent States
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [budgets, setBudgets] = useState<CategoryBudgets>(() => loadBudgets());
  const [regularPayments, setRegularPayments] = useState<RegularPayment[]>(() => loadRegularPayments());
  const [deposits, setDeposits] = useState<Deposit[]>(() => loadDeposits());

  // Modals visibility
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRegularPaymentsModalOpen, setIsRegularPaymentsModalOpen] = useState(false);
  const [isDepositsModalOpen, setIsDepositsModalOpen] = useState(false);
  const [isAiAssistantModalOpen, setIsAiAssistantModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // In-app Toast message (replaces window.alert)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // PWA Install capability
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Pre-fill states for TransactionModal
  const [txInitialData, setTxInitialData] = useState<{
    type?: TransactionType;
    amount?: number;
    category?: string;
    comment?: string;
    date?: string;
  }>({});

  // Sync states to localStorage
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    saveRegularPayments(regularPayments);
  }, [regularPayments]);

  // Combined categories list
  const allCategories = useMemo(() => {
    return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  }, []);

  // Filter transactions for current month
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(currentYearMonth));
  }, [transactions, currentYearMonth]);

  // Monthly summary calculations
  const monthlyStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    monthTransactions.forEach((tx) => {
      if (tx.type === 'expense') {
        totalExpense += tx.amount;
      } else {
        totalIncome += tx.amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const daysInMonth = getDaysInMonth(currentYearMonth);
    const avgExpensePerDay = Math.round(totalExpense / (daysInMonth || 30));

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: monthTransactions.length,
      avgExpensePerDay,
    };
  }, [monthTransactions, currentYearMonth]);

  // Handlers for transactions
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...txData } : t))
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxInitialData({});
    setIsTxModalOpen(true);
  };

  const handleOpenAdd = (
    type: TransactionType = 'expense',
    category?: string,
    date?: string
  ) => {
    setEditingTransaction(null);
    setTxInitialData({ type, category, date });
    setIsTxModalOpen(true);
  };

  // Quick Pay regular bill handler
  const handlePayBillQuick = (bill: RegularPayment) => {
    setEditingTransaction(null);
    setTxInitialData({
      type: 'expense',
      amount: bill.amount,
      category: bill.category,
      comment: bill.title,
    });
    setIsTxModalOpen(true);
  };

  // Deposit Handlers
  const handleSaveDeposits = (newDeposits: Deposit[]) => {
    setDeposits(newDeposits);
    saveDeposits(newDeposits);
  };

  const handleDepositInterestToWallet = (deposit: Deposit, interestAmount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: `tx-interest-${Date.now()}`,
      type: 'income',
      amount: interestAmount,
      category: 'Проценты по вкладу',
      date: today,
      comment: `Проценты по вкладу «${deposit.name}» (${deposit.interestRate}% годовых)`,
      createdAt: Date.now(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const handleTopUpFromWallet = (deposit: Deposit, topUpAmount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: `tx-dep-topup-${Date.now()}`,
      type: 'expense',
      amount: topUpAmount,
      category: 'Вклад и накопления',
      date: today,
      comment: `Пополнение вклада «${deposit.name}»`,
      createdAt: Date.now(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const handleWithdrawFromDepositToWallet = (deposit: Deposit, withdrawAmount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: `tx-dep-withdraw-${Date.now()}`,
      type: 'income',
      amount: withdrawAmount,
      category: 'Вклад и накопления',
      date: today,
      comment: `Снятие с вклада «${deposit.name}» в кошелёк`,
      createdAt: Date.now(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const totalDeposits = useMemo(() => calculateTotalDeposits(deposits), [deposits]);
  const totalMonthlyInterest = useMemo(() => calculateTotalMonthlyInterest(deposits), [deposits]);

  // Export / Import
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('В кошельке пока нет операций для экспорта', 'info');
      return;
    }
    exportTransactionsToCsv(transactions);
    showToast(
      `Экспортировано ${transactions.length} ${pluralizeRu(transactions.length, 'операция', 'операции', 'операций')} в CSV`,
      'success'
    );
  };

  const handleExportData = () => {
    const exportObject = {
      transactions,
      budgets,
      regularPayments,
      deposits,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family_wallet_backup_${currentYearMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Резервная копия сохранена', 'success');
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.transactions)) {
          setTransactions(parsed.transactions);
        }
        if (parsed.budgets && typeof parsed.budgets === 'object') {
          setBudgets(parsed.budgets);
        }
        if (Array.isArray(parsed.regularPayments)) {
          setRegularPayments(parsed.regularPayments);
        }
        if (Array.isArray(parsed.deposits)) {
          setDeposits(parsed.deposits);
          saveDeposits(parsed.deposits);
        }
        showToast('Данные успешно импортированы!', 'success');
      } catch (err) {
        showToast('Ошибка при чтении файла JSON. Проверьте формат файла.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    resetAllToDefaults();
    setTransactions(loadTransactions());
    setBudgets(loadBudgets());
    setRegularPayments(loadRegularPayments());
    setDeposits(loadDeposits());
    showToast('Данные сброшены к начальным значениям', 'info');
  };

  const handleClearData = () => {
    clearAllData();
    setTransactions([]);
    setBudgets({});
    setRegularPayments([]);
    setDeposits([]);
    showToast('Все данные кошелька успешно очищены', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* App Header */}
      <Header
        currentYearMonth={currentYearMonth}
        onMonthChange={setCurrentYearMonth}
        onOpenAddModal={() => handleOpenAdd('expense')}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenRegularPaymentsModal={() => setIsRegularPaymentsModalOpen(true)}
        onOpenDepositsModal={() => setIsDepositsModalOpen(true)}
        onOpenAiAssistantModal={() => setIsAiAssistantModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isAppInstalled={isInstalled}
        onPayBillQuick={handlePayBillQuick}
        onExportData={handleExportData}
        onExportCSV={handleExportCSV}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onClearData={handleClearData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* Summary Metric Cards (Итоги: Доходы, Расходы, Баланс, Вклады) */}
        <SummaryCards
          totalIncome={monthlyStats.totalIncome}
          totalExpense={monthlyStats.totalExpense}
          balance={monthlyStats.balance}
          transactionCount={monthlyStats.transactionCount}
          avgExpensePerDay={monthlyStats.avgExpensePerDay}
          totalDeposits={totalDeposits}
          totalMonthlyInterest={totalMonthlyInterest}
          onOpenDepositsModal={() => setIsDepositsModalOpen(true)}
        />

        {/* Core Layout: Operations List on Left, Budget & Member Progress on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Operations List (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Операции за месяц
                </h2>
                <p className="text-xs text-slate-500">
                  Все доходы и расходы семьи с поиском и фильтрацией
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                  title="Экспортировать все операции в CSV для Excel или Google Таблиц"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline">Экспорт в CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
                <button
                  onClick={() => handleOpenAdd('income')}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Доход</span>
                </button>
                <button
                  onClick={() => handleOpenAdd('expense')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Расход</span>
                </button>
              </div>
            </div>

            <TransactionList
              transactions={monthTransactions}
              categories={allCategories}
              currentYearMonth={currentYearMonth}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onOpenAddModal={(initialDate?: string) =>
                handleOpenAdd('expense', undefined, initialDate)
              }
            />
          </div>

          {/* Right Sidebar: Category Budgets & Deposits (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Category Budget Progress Panel */}
            <BudgetProgressPanel
              categories={DEFAULT_EXPENSE_CATEGORIES}
              budgets={budgets}
              transactions={monthTransactions}
              yearMonth={currentYearMonth}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            />

            {/* Deposits and Passive Income Widget */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Вклады и проценты
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Сбережения и пассивный доход
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDepositsModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {deposits.length > 0 ? 'Управление' : '+ Добавить'}
                </button>
              </div>

              {/* Total Balance & Monthly Return */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Сумма вкладов
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 block mt-0.5">
                    {formatCurrency(totalDeposits)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
                    Доход в месяц
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-600 block mt-0.5">
                    +{formatCurrency(totalMonthlyInterest)}
                  </span>
                </div>
              </div>

              {/* Deposit Items Preview */}
              {deposits.length > 0 ? (
                <div className="space-y-2">
                  {deposits.slice(0, 3).map((dep) => (
                    <div
                      key={dep.id}
                      onClick={() => setIsDepositsModalOpen(true)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer group text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-800 block truncate group-hover:text-indigo-600">
                          {dep.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatCurrency(dep.amount)} • {dep.interestRate}% годовых
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 shrink-0">
                        +{formatCurrency(Math.round((dep.amount * (dep.interestRate / 100)) / 12))}/мес
                      </span>
                    </div>
                  ))}
                  {deposits.length > 3 && (
                    <button
                      onClick={() => setIsDepositsModalOpen(true)}
                      className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1"
                    >
                      Ещё {deposits.length - 3} {pluralizeRu(deposits.length - 3, 'вклад', 'вклада', 'вкладов')}...
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 px-2 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500 mb-2">
                    Добавьте вклад или накопительный счет, чтобы рассчитывать проценты как доход.
                  </p>
                  <button
                    onClick={() => setIsDepositsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Рассчитать и открыть вклад</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Assistant Promo Banner */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-indigo-50/80 via-purple-50/40 to-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Советник по финансам
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ИИ проанализирует ваши расходы и подскажет идеи экономии
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiAssistantModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50/80 border border-indigo-200 rounded-xl shadow-2xs transition-colors shrink-0"
              >
                Спросить
              </button>
            </div>
            {/* Install / Add to Desktop Card */}
            {!isInstalled && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                      Установить на рабочий стол
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Быстрый запуск на телефоне или ПК
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInstallModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shrink-0"
                >
                  Добавить
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="sm:hidden fixed bottom-14 right-4 z-20">
        <button
          onClick={() => handleOpenAdd('expense')}
          className="w-13 h-13 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Добавить операцию"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Author Badge in bottom right corner */}
      <AuthorBadge />

      {/* Modals */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isInstallable={isInstallable}
        isIOS={isIOS}
        onInstall={install}
      />
      <DepositsModal
        isOpen={isDepositsModalOpen}
        onClose={() => setIsDepositsModalOpen(false)}
        deposits={deposits}
        onSaveDeposits={handleSaveDeposits}
        onDepositInterestToWallet={handleDepositInterestToWallet}
        onTopUpFromWallet={handleTopUpFromWallet}
        onWithdrawFromWallet={handleWithdrawFromDepositToWallet}
      />
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
          setTxInitialData({});
        }}
        categories={allCategories}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        initialType={txInitialData.type}
        initialAmount={txInitialData.amount}
        initialCategory={txInitialData.category}
        initialComment={txInitialData.comment}
        initialDate={txInitialData.date}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={DEFAULT_EXPENSE_CATEGORIES}
        budgets={budgets}
        onSaveBudgets={setBudgets}
      />

      <RegularPaymentsModal
        isOpen={isRegularPaymentsModalOpen}
        onClose={() => setIsRegularPaymentsModalOpen(false)}
        payments={regularPayments}
        categories={DEFAULT_EXPENSE_CATEGORIES}
        onSavePayments={setRegularPayments}
        onPayNow={handlePayBillQuick}
      />

      <AiAssistantModal
        isOpen={isAiAssistantModalOpen}
        onClose={() => setIsAiAssistantModalOpen(false)}
        yearMonth={currentYearMonth}
        transactions={transactions}
        budgets={budgets}
        regularPayments={regularPayments}
        deposits={deposits}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : 'bg-indigo-50/95 border-indigo-200 text-indigo-900'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
