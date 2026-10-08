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
  CategoryItem,
  ViewPeriod,
  RecordedMonthInfo,
} from './types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from './data/defaultData';
import {
  getCurrentYearMonth,
  getMonthLabel,
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
  loadCategories,
  saveCategories,
  resetAllToDefaults,
  clearAllData,
} from './utils/storage';
import {
  calculateTotalDeposits,
  calculateTotalMonthlyInterest,
} from './utils/depositCalculations';
import { exportTransactionsToCsv } from './utils/exportCsv';
import {
  sanitizeTransaction,
  sanitizeDeposit,
  sanitizeRegularPayment,
  sanitizeCategoryBudgets,
  sanitizeCategoriesList,
} from './utils/security';

import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { BudgetProgressPanel } from './components/BudgetProgressPanel';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { RegularPaymentsModal } from './components/RegularPaymentsModal';
import { CategoriesModal } from './components/CategoriesModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AuthorBadge } from './components/AuthorBadge';
import { InstallAppModal } from './components/InstallAppModal';
import { DepositsModal } from './components/DepositsModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  // Current selected month (YYYY-MM)
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => getCurrentYearMonth());

  // Period view mode: 'month' | 'all' | 'custom'
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('month');
  const [customRangeStart, setCustomRangeStart] = useState<string>('');
  const [customRangeEnd, setCustomRangeEnd] = useState<string>('');

  // Persistent States
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [budgets, setBudgets] = useState<CategoryBudgets>(() => loadBudgets());
  const [regularPayments, setRegularPayments] = useState<RegularPayment[]>(() => loadRegularPayments());
  const [deposits, setDeposits] = useState<Deposit[]>(() => loadDeposits());
  const [categoriesState, setCategoriesState] = useState<{
    expense: CategoryItem[];
    income: CategoryItem[];
  }>(() => loadCategories());

  // Modals visibility
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categoriesModalInitialType, setCategoriesModalInitialType] = useState<TransactionType>('expense');
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

  // Listen for storage quota or write failure events
  useEffect(() => {
    const handleStorageError = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string; message: string }>;
      showToast(customEvent.detail?.message || 'Ошибка хранилища браузера', 'error');
    };
    window.addEventListener('family-wallet-storage-error', handleStorageError);
    return () => {
      window.removeEventListener('family-wallet-storage-error', handleStorageError);
    };
  }, []);

  // PWA Install capability
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Pre-fill states for TransactionModal
  const [txInitialData, setTxInitialData] = useState<{
    type?: TransactionType;
    amount?: number;
    category?: string;
    subcategory?: string;
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

  useEffect(() => {
    saveCategories(categoriesState.expense, categoriesState.income);
  }, [categoriesState]);

  // Combined categories list
  const allCategories = useMemo(() => {
    return [...categoriesState.expense, ...categoriesState.income];
  }, [categoriesState]);

  // Category and Subcategory Management Handlers
  const handleSaveCategory = (updatedCat: CategoryItem, oldName?: string) => {
    setCategoriesState((prev) => {
      const isExp = updatedCat.type === 'expense';
      const targetList = isExp ? prev.expense : prev.income;
      let newList: CategoryItem[];
      if (targetList.some((c) => c.id === updatedCat.id)) {
        newList = targetList.map((c) => (c.id === updatedCat.id ? updatedCat : c));
      } else {
        newList = [...targetList, updatedCat];
      }
      const newExpense = isExp ? newList : prev.expense;
      const newIncome = isExp ? prev.income : newList;
      saveCategories(newExpense, newIncome);
      return { expense: newExpense, income: newIncome };
    });

    // Cascading updates when a category is renamed
    if (oldName && oldName !== updatedCat.name) {
      setTransactions((prev) =>
        prev.map((t) => (t.category === oldName ? { ...t, category: updatedCat.name } : t))
      );

      setBudgets((prev) => {
        if (prev[oldName] !== undefined) {
          const updated = { ...prev };
          updated[updatedCat.name] = updated[oldName];
          delete updated[oldName];
          return updated;
        }
        return prev;
      });

      setRegularPayments((prev) =>
        prev.map((p) => (p.category === oldName ? { ...p, category: updatedCat.name } : p))
      );

      showToast(`Категория переименована в «${updatedCat.name}» во всех операциях`, 'success');
    } else {
      showToast(`Категория «${updatedCat.name}» сохранена`, 'success');
    }
  };

  const handleDeleteCategory = (catToDelete: CategoryItem) => {
    setCategoriesState((prev) => {
      const newExpense = prev.expense.filter((c) => c.id !== catToDelete.id);
      const newIncome = prev.income.filter((c) => c.id !== catToDelete.id);
      saveCategories(newExpense, newIncome);
      return { expense: newExpense, income: newIncome };
    });

    // Migrate operations with this category to 'Прочее'
    setTransactions((prev) =>
      prev.map((t) => (t.category === catToDelete.name ? { ...t, category: 'Прочее' } : t))
    );

    // Remove from budgets if exists
    setBudgets((prev) => {
      if (prev[catToDelete.name] !== undefined) {
        const copy = { ...prev };
        delete copy[catToDelete.name];
        return copy;
      }
      return prev;
    });

    // Update regular payments
    setRegularPayments((prev) =>
      prev.map((p) => (p.category === catToDelete.name ? { ...p, category: 'Прочее' } : p))
    );

    showToast(`Категория «${catToDelete.name}» удалена`, 'info');
  };

  const handleQuickAddSubcategory = (catName: string, newSub: string) => {
    setCategoriesState((prev) => {
      const updateList = (list: CategoryItem[]) =>
        list.map((c) => {
          if (c.name === catName) {
            const subs = c.subcategories || [];
            if (!subs.includes(newSub)) {
              return { ...c, subcategories: [...subs, newSub] };
            }
          }
          return c;
        });

      const newExpense = updateList(prev.expense);
      const newIncome = updateList(prev.income);
      saveCategories(newExpense, newIncome);
      return { expense: newExpense, income: newIncome };
    });
    showToast(`Подкатегория «${newSub}» добавлена в «${catName}»`, 'success');
  };

  // Filter transactions for current month (used for monthly budget panel)
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(currentYearMonth));
  }, [transactions, currentYearMonth]);

  // All months in which user has recorded transactions
  const recordedMonths = useMemo<RecordedMonthInfo[]>(() => {
    const monthMap = new Map<string, { count: number; expense: number; income: number }>();
    const realYM = getCurrentYearMonth();
    if (!monthMap.has(realYM)) {
      monthMap.set(realYM, { count: 0, expense: 0, income: 0 });
    }
    if (!monthMap.has(currentYearMonth)) {
      monthMap.set(currentYearMonth, { count: 0, expense: 0, income: 0 });
    }

    transactions.forEach((tx) => {
      const ym = tx.date.slice(0, 7);
      const curr = monthMap.get(ym) || { count: 0, expense: 0, income: 0 };
      curr.count += 1;
      if (tx.type === 'expense') curr.expense += tx.amount;
      else curr.income += tx.amount;
      monthMap.set(ym, curr);
    });

    return Array.from(monthMap.entries())
      .map(([ym, data]) => ({
        yearMonth: ym,
        label: getMonthLabel(ym),
        count: data.count,
        expense: data.expense,
        income: data.income,
      }))
      .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  }, [transactions, currentYearMonth]);

  // Active transactions according to viewPeriod
  const activeTransactions = useMemo(() => {
    if (viewPeriod === 'all') {
      return transactions;
    }
    if (viewPeriod === 'custom') {
      return transactions.filter((tx) => {
        if (customRangeStart && tx.date < customRangeStart) return false;
        if (customRangeEnd && tx.date > customRangeEnd) return false;
        return true;
      });
    }
    return monthTransactions;
  }, [transactions, viewPeriod, monthTransactions, customRangeStart, customRangeEnd]);

  // Summary calculations for the active view period
  const activeStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    activeTransactions.forEach((tx) => {
      if (tx.type === 'expense') {
        totalExpense += tx.amount;
      } else {
        totalIncome += tx.amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const days = viewPeriod === 'month' ? getDaysInMonth(currentYearMonth) : 30;
    const avgExpensePerDay = Math.round(totalExpense / (days || 30));

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: activeTransactions.length,
      avgExpensePerDay,
    };
  }, [activeTransactions, viewPeriod, currentYearMonth]);

  // Period label for summary cards
  const periodLabel = useMemo(() => {
    if (viewPeriod === 'all') return 'за всё время';
    if (viewPeriod === 'custom') {
      if (customRangeStart && customRangeEnd) {
        return `с ${customRangeStart} по ${customRangeEnd}`;
      }
      return 'за период';
    }
    return `за ${getMonthLabel(currentYearMonth)}`;
  }, [viewPeriod, currentYearMonth, customRangeStart, customRangeEnd]);

  // Handlers for transactions
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) => {
        const next = prev.map((t) => (t.id === existingId ? { ...t, ...txData } : t));
        saveTransactions(next);
        return next;
      });
      showToast('Операция обновлена и надежно сохранена', 'success');
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => {
        const next = [newTx, ...prev];
        saveTransactions(next);
        return next;
      });

      const txYearMonth = newTx.date.slice(0, 7);
      if (viewPeriod === 'month' && txYearMonth !== currentYearMonth) {
        setCurrentYearMonth(txYearMonth);
        showToast(
          `Операция на сумму ${formatCurrency(txData.amount)} сохранена. Открыт месяц ${getMonthLabel(txYearMonth)}.`,
          'success'
        );
      } else {
        showToast(`Операция на сумму ${formatCurrency(txData.amount)} сохранена`, 'success');
      }
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
    date?: string,
    subcategory?: string
  ) => {
    setEditingTransaction(null);
    setTxInitialData({ type, category, date, subcategory });
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
      categories: categoriesState,
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
    // 1. File extension validation
    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('Поддерживаются только файлы резервной копии .json', 'error');
      return;
    }

    // 2. File size limit to protect against browser freeze / DoS (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Файл слишком велик (максимум 5 МБ)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content || typeof content !== 'string') {
          showToast('Не удалось прочитать содержимое файла', 'error');
          return;
        }

        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          showToast('Некорректная структура файла резервной копии', 'error');
          return;
        }

        let importedTxCount = 0;
        let importedDepCount = 0;

        // Protection against excessive memory consumption / browser lockup
        const MAX_TRANSACTIONS = 20_000;
        const MAX_ENTRIES = 200;

        // 3. Validate and sanitize transactions
        if (Array.isArray(parsed.transactions)) {
          const rawList = parsed.transactions.slice(0, MAX_TRANSACTIONS);
          const validTx = rawList
            .map(sanitizeTransaction)
            .filter((t: Transaction | null): t is Transaction => t !== null);
          setTransactions(validTx);
          saveTransactions(validTx);
          importedTxCount = validTx.length;
        }

        // 4. Validate and sanitize category budgets (immune to prototype pollution)
        if (parsed.budgets && typeof parsed.budgets === 'object') {
          const validBudgets = sanitizeCategoryBudgets(parsed.budgets);
          setBudgets(validBudgets);
          saveBudgets(validBudgets);
        }

        // 5. Validate and sanitize regular payments
        if (Array.isArray(parsed.regularPayments)) {
          const rawPayments = parsed.regularPayments.slice(0, MAX_ENTRIES);
          const validPayments = rawPayments
            .map(sanitizeRegularPayment)
            .filter((p: RegularPayment | null): p is RegularPayment => p !== null);
          setRegularPayments(validPayments);
          saveRegularPayments(validPayments);
        }

        // 6. Validate and sanitize deposits
        if (Array.isArray(parsed.deposits)) {
          const rawDeposits = parsed.deposits.slice(0, MAX_ENTRIES);
          const validDeposits = rawDeposits
            .map(sanitizeDeposit)
            .filter((d: Deposit | null): d is Deposit => d !== null);
          setDeposits(validDeposits);
          saveDeposits(validDeposits);
          importedDepCount = validDeposits.length;
        }

        // 7. Validate and sanitize custom categories if included
        if (parsed.categories && typeof parsed.categories === 'object') {
          const impExp = sanitizeCategoriesList(parsed.categories.expense, 'expense');
          const impInc = sanitizeCategoriesList(parsed.categories.income, 'income');
          if (impExp.length > 0 || impInc.length > 0) {
            const finalExp = impExp.length > 0 ? impExp : categoriesState.expense;
            const finalInc = impInc.length > 0 ? impInc : categoriesState.income;
            setCategoriesState({ expense: finalExp, income: finalInc });
            saveCategories(finalExp, finalInc);
          }
        }

        showToast(
          `Данные успешно импортированы: ${importedTxCount} ${pluralizeRu(importedTxCount, 'операция', 'операции', 'операций')}, ${importedDepCount} ${pluralizeRu(importedDepCount, 'вклад', 'вклада', 'вкладов')}`,
          'success'
        );
      } catch {
        showToast('Ошибка при чтении файла JSON. Проверьте формат файла.', 'error');
      }
    };
    reader.onerror = () => {
      showToast('Ошибка чтения файла с диска', 'error');
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    resetAllToDefaults();
    setTransactions(loadTransactions());
    setBudgets(loadBudgets());
    setRegularPayments(loadRegularPayments());
    setDeposits(loadDeposits());
    setCategoriesState(loadCategories());
    showToast('Данные сброшены к начальным значениям', 'info');
  };

  const handleClearData = () => {
    clearAllData();
    setTransactions([]);
    setBudgets({});
    setRegularPayments([]);
    setDeposits([]);
    setCategoriesState(loadCategories());
    showToast('Все данные кошелька успешно очищены', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* App Header */}
      <Header
        currentYearMonth={currentYearMonth}
        onMonthChange={setCurrentYearMonth}
        viewPeriod={viewPeriod}
        onPeriodChange={setViewPeriod}
        recordedMonths={recordedMonths}
        totalAllTransactionsCount={transactions.length}
        onOpenAddModal={() => handleOpenAdd('expense')}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onOpenCategoriesModal={() => {
          setCategoriesModalInitialType('expense');
          setIsCategoriesModalOpen(true);
        }}
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
          totalIncome={activeStats.totalIncome}
          totalExpense={activeStats.totalExpense}
          balance={activeStats.balance}
          transactionCount={activeStats.transactionCount}
          avgExpensePerDay={activeStats.avgExpensePerDay}
          totalDeposits={totalDeposits}
          totalMonthlyInterest={totalMonthlyInterest}
          periodLabel={periodLabel}
          onOpenDepositsModal={() => setIsDepositsModalOpen(true)}
        />

        {/* Core Layout: Operations List on Left, Budget & Member Progress on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Operations List (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {viewPeriod === 'all'
                    ? 'История операций за всё время'
                    : viewPeriod === 'custom'
                    ? 'Операции за выбранный период'
                    : 'Операции за месяц'}
                </h2>
                <p className="text-xs text-slate-500">
                  {viewPeriod === 'all'
                    ? `Всего ${transactions.length} сохраненных операций в кошельке`
                    : 'Все доходы и расходы семьи с поиском, историей и фильтрацией'}
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
              transactions={activeTransactions}
              allTransactions={transactions}
              categories={allCategories}
              currentYearMonth={currentYearMonth}
              viewPeriod={viewPeriod}
              onPeriodChange={setViewPeriod}
              onMonthChange={setCurrentYearMonth}
              recordedMonths={recordedMonths}
              customRangeStart={customRangeStart}
              customRangeEnd={customRangeEnd}
              onCustomRangeChange={(s, e) => {
                setCustomRangeStart(s);
                setCustomRangeEnd(e);
              }}
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
              categories={categoriesState.expense}
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
        onOpenCategoriesModal={() => {
          setCategoriesModalInitialType(txInitialData.type || 'expense');
          setIsCategoriesModalOpen(true);
        }}
        onQuickAddSubcategory={handleQuickAddSubcategory}
        editingTransaction={editingTransaction}
        initialType={txInitialData.type}
        initialAmount={txInitialData.amount}
        initialCategory={txInitialData.category}
        initialSubcategory={txInitialData.subcategory}
        initialComment={txInitialData.comment}
        initialDate={txInitialData.date}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        expenseCategories={categoriesState.expense}
        incomeCategories={categoriesState.income}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        initialType={categoriesModalInitialType}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categoriesState.expense}
        budgets={budgets}
        onSaveBudgets={setBudgets}
        onOpenCategoriesModal={() => {
          setCategoriesModalInitialType('expense');
          setIsCategoriesModalOpen(true);
        }}
      />

      <RegularPaymentsModal
        isOpen={isRegularPaymentsModalOpen}
        onClose={() => setIsRegularPaymentsModalOpen(false)}
        payments={regularPayments}
        categories={categoriesState.expense}
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
