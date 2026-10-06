import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Sparkles, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import {
  CategoryBudgets,
  RegularPayment,
  Transaction,
  TransactionType,
} from './types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from './data/defaultData';
import {
  getCurrentYearMonth,
  getDaysInMonth,
} from './utils/formatters';
import {
  loadTransactions,
  saveTransactions,
  loadMembers,
  saveMembers,
  loadBudgets,
  saveBudgets,
  loadRegularPayments,
  saveRegularPayments,
  loadDismissedNotifications,
  saveDismissedNotifications,
  resetAllToDefaults,
  clearAllData,
} from './utils/storage';
import { generateActiveNotifications } from './utils/notifications';

import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { BudgetProgressPanel } from './components/BudgetProgressPanel';
import { TransactionList } from './components/TransactionList';
import { FamilyMembersSummary } from './components/FamilyMembersSummary';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { RegularPaymentsModal } from './components/RegularPaymentsModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AuthorBadge } from './components/AuthorBadge';
import { InstallAppModal } from './components/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  // Current selected month (YYYY-MM)
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => getCurrentYearMonth());

  // Persistent States
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [members, setMembers] = useState<string[]>(() => loadMembers());
  const [budgets, setBudgets] = useState<CategoryBudgets>(() => loadBudgets());
  const [regularPayments, setRegularPayments] = useState<RegularPayment[]>(() => loadRegularPayments());
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => loadDismissedNotifications());

  // Modals visibility
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isRegularPaymentsModalOpen, setIsRegularPaymentsModalOpen] = useState(false);
  const [isAiAssistantModalOpen, setIsAiAssistantModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // PWA Install capability
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Pre-fill states for TransactionModal
  const [txInitialData, setTxInitialData] = useState<{
    type?: TransactionType;
    amount?: number;
    category?: string;
    member?: string;
    comment?: string;
  }>({});

  // Sync states to localStorage
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    saveRegularPayments(regularPayments);
  }, [regularPayments]);

  useEffect(() => {
    saveDismissedNotifications(dismissedNotifIds);
  }, [dismissedNotifIds]);

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

  // Active notifications for budgets and bills
  const activeNotifications = useMemo(() => {
    return generateActiveNotifications({
      yearMonth: currentYearMonth,
      transactions,
      budgets,
      regularPayments,
      dismissedNotificationIds: dismissedNotifIds,
    });
  }, [currentYearMonth, transactions, budgets, regularPayments, dismissedNotifIds]);

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

  const handleOpenAdd = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setTxInitialData({ type });
    setIsTxModalOpen(true);
  };

  const handleAddNewMember = (name: string) => {
    if (!members.includes(name)) {
      setMembers((prev) => [...prev, name]);
    }
  };

  // Quick Pay regular bill handler
  const handlePayBillQuick = (bill: RegularPayment) => {
    setEditingTransaction(null);
    setTxInitialData({
      type: 'expense',
      amount: bill.amount,
      category: bill.category,
      member: bill.member,
      comment: bill.title,
    });
    setIsTxModalOpen(true);
  };

  // Notification dismiss handlers
  const handleDismissNotification = (id: string) => {
    setDismissedNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDismissAllNotifications = () => {
    const ids = activeNotifications.map((n) => n.id);
    setDismissedNotifIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  // Export / Import
  const handleExportData = () => {
    const exportObject = {
      transactions,
      members,
      budgets,
      regularPayments,
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
        if (Array.isArray(parsed.members)) {
          setMembers(parsed.members);
        }
        if (parsed.budgets && typeof parsed.budgets === 'object') {
          setBudgets(parsed.budgets);
        }
        if (Array.isArray(parsed.regularPayments)) {
          setRegularPayments(parsed.regularPayments);
        }
        alert('Данные успешно импортированы!');
      } catch (err) {
        alert('Ошибка при чтении файла JSON. Убедитесь в корректности формата.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    resetAllToDefaults();
    setTransactions(loadTransactions());
    setMembers(loadMembers());
    setBudgets(loadBudgets());
    setRegularPayments(loadRegularPayments());
    setDismissedNotifIds([]);
  };

  const handleClearData = () => {
    clearAllData();
    setTransactions([]);
    setBudgets({});
    setRegularPayments([]);
    setDismissedNotifIds([]);
  };

  // Top high-priority notification banner (if budget exceeded or bill overdue)
  const urgentNotification = activeNotifications.find(
    (n) => n.type === 'budget_exceeded' || n.type === 'bill_overdue' || n.type === 'bill_today'
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* App Header */}
      <Header
        currentYearMonth={currentYearMonth}
        onMonthChange={setCurrentYearMonth}
        onOpenAddModal={() => handleOpenAdd('expense')}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        onOpenRegularPaymentsModal={() => setIsRegularPaymentsModalOpen(true)}
        onOpenAiAssistantModal={() => setIsAiAssistantModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        isAppInstalled={isInstalled}
        notifications={activeNotifications}
        onDismissNotification={handleDismissNotification}
        onDismissAllNotifications={handleDismissAllNotifications}
        onPayBillQuick={handlePayBillQuick}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onClearData={handleClearData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* Urgent Notification Banner */}
        {urgentNotification && (
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 mr-1.5">
                  {urgentNotification.title}:
                </span>
                <span className="text-slate-700 truncate">
                  {urgentNotification.message}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {urgentNotification.actionData && (
                <button
                  onClick={() => handlePayBillQuick(urgentNotification.actionData)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] shadow-2xs transition-colors"
                >
                  Оплатить
                </button>
              )}
              <button
                onClick={() => handleDismissNotification(urgentNotification.id)}
                className="text-slate-400 hover:text-slate-700 font-medium text-[11px] px-1.5 py-1"
              >
                Скрыть
              </button>
            </div>
          </div>
        )}

        {/* Summary Metric Cards (Итоги: Доходы, Расходы, Баланс) */}
        <SummaryCards
          totalIncome={monthlyStats.totalIncome}
          totalExpense={monthlyStats.totalExpense}
          balance={monthlyStats.balance}
          transactionCount={monthlyStats.transactionCount}
          avgExpensePerDay={monthlyStats.avgExpensePerDay}
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
              members={members}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onOpenAddModal={() => handleOpenAdd('expense')}
            />
          </div>

          {/* Right Sidebar: Category Budgets Progress & Family Members Breakdown (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Category Budget Progress Panel */}
            <BudgetProgressPanel
              categories={DEFAULT_EXPENSE_CATEGORIES}
              budgets={budgets}
              transactions={monthTransactions}
              yearMonth={currentYearMonth}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            />

            {/* Spending Breakdown by Family Member */}
            <FamilyMembersSummary
              transactions={monthTransactions}
              members={members}
              yearMonth={currentYearMonth}
            />

            {/* AI Assistant Promo Banner */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-indigo-50/80 via-purple-50/40 to-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Советник по семейному бюджету
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
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
          setTxInitialData({});
        }}
        categories={allCategories}
        members={members}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        onAddNewMember={handleAddNewMember}
        initialType={txInitialData.type}
        initialAmount={txInitialData.amount}
        initialCategory={txInitialData.category}
        initialMember={txInitialData.member}
        initialComment={txInitialData.comment}
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
        members={members}
        categories={DEFAULT_EXPENSE_CATEGORIES}
        onSavePayments={setRegularPayments}
        onPayNow={handlePayBillQuick}
      />

      <ManageMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={members}
        onSaveMembers={setMembers}
      />

      <AiAssistantModal
        isOpen={isAiAssistantModalOpen}
        onClose={() => setIsAiAssistantModalOpen(false)}
        yearMonth={currentYearMonth}
        transactions={transactions}
        budgets={budgets}
        regularPayments={regularPayments}
        members={members}
      />
    </div>
  );
}
