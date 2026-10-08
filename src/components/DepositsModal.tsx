import React, { useState } from 'react';
import {
  X,
  PiggyBank,
  Plus,
  TrendingUp,
  Percent,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Landmark,
} from 'lucide-react';
import { Deposit } from '../types';
import {
  calculateMonthlyInterest,
  calculateAnnualInterest,
  calculateDailyInterest,
  calculateTotalDeposits,
  calculateTotalMonthlyInterest,
  calculateTotalAnnualInterest,
  calculateWeightedInterestRate,
  calculateFutureProjection,
} from '../utils/depositCalculations';
import { formatCurrency, pluralizeRu } from '../utils/formatters';

interface DepositsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: Deposit[];
  onSaveDeposits: (deposits: Deposit[]) => void;
  onDepositInterestToWallet: (deposit: Deposit, interestAmount: number) => void;
  onTopUpFromWallet?: (deposit: Deposit, topUpAmount: number) => void;
  onWithdrawFromWallet?: (deposit: Deposit, withdrawAmount: number) => void;
}

export const DepositsModal: React.FC<DepositsModalProps> = ({
  isOpen,
  onClose,
  deposits,
  onSaveDeposits,
  onDepositInterestToWallet,
  onTopUpFromWallet,
  onWithdrawFromWallet,
}) => {
  // Tabs: 'list' | 'add' | 'calculator'
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'calculator'>('list');

  // Editing state
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formPayout, setFormPayout] = useState<'wallet' | 'capitalization'>('wallet');
  const [formDayOfMonth, setFormDayOfMonth] = useState('1');
  const [formNotes, setFormNotes] = useState('');

  // Top Up Modal State
  const [topUpDeposit, setTopUpDeposit] = useState<Deposit | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDeductWallet, setTopUpDeductWallet] = useState(true);

  // Withdraw Modal State
  const [withdrawDeposit, setWithdrawDeposit] = useState<Deposit | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddToWallet, setWithdrawAddToWallet] = useState(true);

  // Quick Rate Edit Modal State
  const [rateEditDeposit, setRateEditDeposit] = useState<Deposit | null>(null);
  const [newRateInput, setNewRateInput] = useState('');

  // Delete Confirmation States
  const [inlineDeleteId, setInlineDeleteId] = useState<string | null>(null);
  const [deletingDeposit, setDeletingDeposit] = useState<Deposit | null>(null);

  // Success message toast
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Calculator states
  const [calcInitial, setCalcInitial] = useState('300000');
  const [calcRate, setCalcRate] = useState('18');
  const [calcMonths, setCalcMonths] = useState(12);
  const [calcMonthlyAdd, setCalcMonthlyAdd] = useState('10000');

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 4000);
  };

  const totalDeposits = calculateTotalDeposits(deposits);
  const totalMonthlyInterest = calculateTotalMonthlyInterest(deposits);
  const totalAnnualInterest = calculateTotalAnnualInterest(deposits);
  const weightedRate = calculateWeightedInterestRate(deposits);

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormRate('');
    setFormPayout('wallet');
    setFormDayOfMonth('1');
    setFormNotes('');
    setEditingDepositId(null);
  };

  const handleOpenRateEdit = (deposit: Deposit) => {
    setRateEditDeposit(deposit);
    setNewRateInput(deposit.interestRate.toString());
  };

  const handleSaveRate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rateEditDeposit) return;
    const rawRate = parseFloat(newRateInput.replace(',', '.')) || 0;
    if (rawRate <= 0) return;
    const cleanRate = Math.min(1000, Number(rawRate.toFixed(2)));

    const updated = deposits.map((d) =>
      d.id === rateEditDeposit.id ? { ...d, interestRate: cleanRate } : d
    );
    onSaveDeposits(updated);

    const oldInt = calculateMonthlyInterest(rateEditDeposit);
    const newInt = calculateMonthlyInterest({ ...rateEditDeposit, interestRate: cleanRate });
    const diff = newInt - oldInt;

    showNotification(
      `Ставка вклада «${rateEditDeposit.name}» изменена на ${cleanRate}% годовых! Новый доход: +${formatCurrency(newInt)}/мес (${diff >= 0 ? '+' : ''}${formatCurrency(diff)})`
    );
    setRateEditDeposit(null);
  };

  const handleStartEdit = (deposit: Deposit) => {
    setEditingDepositId(deposit.id);
    setFormName(deposit.name);
    setFormAmount(deposit.amount.toString());
    setFormRate(deposit.interestRate.toString());
    setFormPayout(deposit.interestPayout);
    setFormDayOfMonth(deposit.dayOfMonth.toString());
    setFormNotes(deposit.notes || '');
    setActiveTab('add');
  };

  const handleDeleteDepositById = (id: string) => {
    const depToDelete = deposits.find((d) => d.id === id);
    if (!depToDelete) return;
    const depName = depToDelete.name;
    const updated = deposits.filter((d) => d.id !== id);
    onSaveDeposits(updated);
    setInlineDeleteId(null);
    setDeletingDeposit(null);
    if (editingDepositId === id) {
      resetForm();
      setActiveTab('list');
    }
    showNotification(`Вклад «${depName}» успешно удален`);
  };

  const handleConfirmDelete = () => {
    if (!deletingDeposit) return;
    handleDeleteDepositById(deletingDeposit.id);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseFloat(formAmount.replace(/\s/g, '')) || 0;
    const cleanAmount = Math.min(100_000_000_000, Math.max(0, Math.round(rawAmount)));
    const rawRate = parseFloat(formRate.replace(',', '.')) || 0;
    const cleanRate = Math.min(1000, Math.max(0, Number(rawRate.toFixed(2))));
    const cleanDay = Math.min(31, Math.max(1, parseInt(formDayOfMonth, 10) || 1));

    if (!formName.trim()) return;

    if (editingDepositId) {
      const updated = deposits.map((d) =>
        d.id === editingDepositId
          ? {
              ...d,
              name: formName.trim().slice(0, 100),
              amount: cleanAmount,
              interestRate: cleanRate,
              interestPayout: formPayout,
              dayOfMonth: cleanDay,
              notes: formNotes.trim().slice(0, 500),
            }
          : d
      );
      onSaveDeposits(updated);
      showNotification('Параметры вклада обновлены');
    } else {
      const newDeposit: Deposit = {
        id: `dep-${Date.now()}`,
        name: formName.trim().slice(0, 100),
        amount: cleanAmount,
        interestRate: cleanRate,
        interestPayout: formPayout,
        dayOfMonth: cleanDay,
        notes: formNotes.trim().slice(0, 500),
        createdAt: Date.now(),
      };
      onSaveDeposits([...deposits, newDeposit]);
      showNotification(`Вклад «${newDeposit.name}» успешно открыт!`);
    }

    resetForm();
    setActiveTab('list');
  };

  // Top Up Action
  const handleConfirmTopUp = () => {
    if (!topUpDeposit) return;
    const rawVal = parseFloat(topUpAmount.replace(/\s/g, '')) || 0;
    const addVal = Math.min(100_000_000_000, Math.max(0, Math.round(rawVal)));
    if (addVal <= 0) return;

    const updated = deposits.map((d) =>
      d.id === topUpDeposit.id ? { ...d, amount: d.amount + addVal } : d
    );
    onSaveDeposits(updated);

    if (topUpDeductWallet && onTopUpFromWallet) {
      onTopUpFromWallet(topUpDeposit, addVal);
    }

    showNotification(
      `Вклад пополнен на +${formatCurrency(addVal)}. Новый баланс: ${formatCurrency(
        topUpDeposit.amount + addVal
      )}`
    );
    setTopUpDeposit(null);
    setTopUpAmount('');
  };

  // Withdraw Action
  const handleConfirmWithdraw = () => {
    if (!withdrawDeposit) return;
    const minusVal = parseFloat(withdrawAmount.replace(/\s/g, '')) || 0;
    if (minusVal <= 0) return;
    if (minusVal > withdrawDeposit.amount) {
      showNotification('Сумма снятия превышает баланс вклада!');
      return;
    }

    const updated = deposits.map((d) =>
      d.id === withdrawDeposit.id ? { ...d, amount: Math.max(0, d.amount - minusVal) } : d
    );
    onSaveDeposits(updated);

    if (withdrawAddToWallet && onWithdrawFromWallet) {
      onWithdrawFromWallet(withdrawDeposit, minusVal);
    }

    showNotification(
      `Снято ${formatCurrency(minusVal)}. Остаток на вкладе: ${formatCurrency(
        withdrawDeposit.amount - minusVal
      )}`
    );
    setWithdrawDeposit(null);
    setWithdrawAmount('');
  };

  // Payout Interest Action
  const handleAccrueInterest = (deposit: Deposit) => {
    const monthlyInt = calculateMonthlyInterest(deposit);
    if (monthlyInt <= 0) {
      showNotification('Сумма или ставка процента вклада равна 0. Начисление невозможно.');
      return;
    }

    if (deposit.interestPayout === 'capitalization') {
      // Add directly to deposit
      const updated = deposits.map((d) =>
        d.id === deposit.id ? { ...d, amount: d.amount + monthlyInt } : d
      );
      onSaveDeposits(updated);
      showNotification(
        `Капитализировано: +${formatCurrency(
          monthlyInt
        )} прибавлено к сумме вклада. Новый объем: ${formatCurrency(deposit.amount + monthlyInt)}`
      );
    } else {
      // Add to Wallet as income
      onDepositInterestToWallet(deposit, monthlyInt);
      showNotification(
        `Проценты +${formatCurrency(
          monthlyInt
        )} успешно начислены в доходы семейного кошелька за этот месяц!`
      );
    }
  };

  // Calculator projection
  const calcInitNum = parseFloat(calcInitial) || 0;
  const calcRateNum = parseFloat(calcRate) || 0;
  const calcMonthlyAddNum = parseFloat(calcMonthlyAdd) || 0;
  const calcResult = calculateFutureProjection(
    calcInitNum,
    calcRateNum,
    calcMonths,
    calcMonthlyAddNum
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Вклады и накопительные счета
              </h2>
              <p className="text-xs text-slate-500">
                Учет капитала, расчет процентов и начисление пассивного дохода
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

        {/* Success Toast Banner */}
        {notificationMsg && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Global Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-slate-50 border-b border-slate-100 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Сумма всех вкладов
            </span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5">
              {formatCurrency(totalDeposits)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Доход в месяц
            </span>
            <span className="text-base font-extrabold text-emerald-600 block mt-0.5">
              +{formatCurrency(totalMonthlyInterest)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Доход в год
            </span>
            <span className="text-base font-extrabold text-indigo-600 block mt-0.5">
              +{formatCurrency(totalAnnualInterest)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Средняя ставка
            </span>
            <span className="text-base font-extrabold text-amber-600 block mt-0.5">
              {weightedRate > 0 ? `${weightedRate}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 bg-white gap-2">
          <button
            onClick={() => {
              setActiveTab('list');
              resetForm();
            }}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Мои вклады ({deposits.length})
          </button>
          <button
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'add'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {editingDepositId ? 'Редактировать вклад' : '+ Открыть вклад'}
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'calculator'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Калькулятор доходности
          </button>
        </div>

        {/* Tab 1: Deposits List */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {deposits.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <PiggyBank className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  У вас пока нет открытых вкладов
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Добавьте ваш первый банковский вклад или накопительный счет, чтобы рассчитывать процентный доход и пополнять его в любое время.
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('add');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить вклад</span>
                </button>
              </div>
            ) : (
              deposits.map((dep) => {
                const monthlyInt = calculateMonthlyInterest(dep);
                const annualInt = calculateAnnualInterest(dep);
                const dailyInt = calculateDailyInterest(dep);

                return (
                  <div
                    key={dep.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 shadow-2xs transition-all space-y-3.5"
                  >
                    {/* Top Row: Name, Bank, Rate */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Percent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {dep.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <button
                              type="button"
                              onClick={() => handleOpenRateEdit(dep)}
                              className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer group/rate border border-indigo-100"
                              title="Нажмите, чтобы изменить процентную ставку"
                            >
                              <span>{dep.interestRate}% годовых</span>
                              <Edit2 className="w-2.5 h-2.5 text-indigo-500 opacity-60 group-hover/rate:opacity-100" />
                            </button>
                            <span>•</span>
                            <span>
                              {dep.interestPayout === 'capitalization'
                                ? 'Капитализация'
                                : 'Выплата на счет'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(dep)}
                          className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="Редактировать параметры"
                          aria-label="Редактировать параметры"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setInlineDeleteId(inlineDeleteId === dep.id ? null : dep.id);
                          }}
                          className={`w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer touch-manipulation ${
                            inlineDeleteId === dep.id
                              ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600 ring-offset-1'
                              : 'text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/80'
                          }`}
                          title="Удалить вклад"
                          aria-label={`Удалить вклад ${dep.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Confirmation when Trash Icon is clicked (mobile-first, guaranteed to work) */}
                    {inlineDeleteId === dep.id && (
                      <div className="p-3.5 bg-rose-50/90 border-2 border-rose-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-start gap-2.5 text-xs text-rose-950 font-semibold leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-rose-900">Удалить вклад «{dep.name}»?</div>
                            <div className="text-[11px] font-normal text-rose-700 mt-0.5">
                              Сумма {formatCurrency(dep.amount)} будет убрана из накоплений, начисление процентов прекратится.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setInlineDeleteId(null)}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer touch-manipulation min-h-[38px]"
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDepositById(dep.id)}
                            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer touch-manipulation min-h-[38px]"
                          >
                            Да, удалить вклад
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Middle Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Сумма вклада:</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                          {formatCurrency(dep.amount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 block">Доход в месяц:</span>
                        <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                          +{formatCurrency(monthlyInt)}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[11px] text-slate-500 block">Доход в год:</span>
                        <span className="text-sm font-extrabold text-indigo-600 block mt-0.5">
                          +{formatCurrency(annualInt)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {/* Accrue Interest Button */}
                      <button
                        onClick={() => handleAccrueInterest(dep)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                        title="Начислить проценты за текущий месяц в доход кошелька"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Начислить доход (+{formatCurrency(monthlyInt)})</span>
                      </button>

                      {/* Edit Rate Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenRateEdit(dep)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200/80 text-indigo-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                        title="Быстро изменить процентную ставку"
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>Изменить процент ({dep.interestRate}%)</span>
                      </button>

                      {/* Top Up Button */}
                      <button
                        onClick={() => {
                          setTopUpDeposit(dep);
                          setTopUpAmount('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Пополнить</span>
                      </button>

                      {/* Withdraw Button */}
                      <button
                        onClick={() => {
                          setWithdrawDeposit(dep);
                          setWithdrawAmount('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                        <span>Снять</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setInlineDeleteId(inlineDeleteId === dep.id ? null : dep.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 active:bg-rose-100 border border-slate-200 hover:border-rose-200 text-rose-600 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer touch-manipulation"
                        title="Удалить данный вклад"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Add or Edit Form */}
        {activeTab === 'add' && (
          <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Название вклада или счета *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Например: Вклад Т-Банк, Сбер Накопительный, ВТБ Мои Сбережения"
                className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Сумма вклада (₽) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="300000"
                  className="w-full text-sm font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Процентная ставка (% годовых) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="100"
                  required
                  value={formRate}
                  onChange={(e) => setFormRate(e.target.value)}
                  placeholder="18.5"
                  className="w-full text-sm font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[16, 17, 18, 19, 20, 21, 22].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormRate(r.toString())}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                        formRate === r.toString()
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Способ выплаты процентов
                </label>
                <select
                  value={formPayout}
                  onChange={(e) => setFormPayout(e.target.value as any)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="wallet">Выплата в кошелёк (ежемесячный доход)</option>
                  <option value="capitalization">Капитализация (прибавлять к вкладу)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  День выплаты процентов (число месяца)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formDayOfMonth}
                  onChange={(e) => setFormDayOfMonth(e.target.value)}
                  placeholder="1"
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            {parseFloat(formAmount) > 0 && parseFloat(formRate) > 0 && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-indigo-950 block">
                    Ожидаемый доход по этой ставке:
                  </span>
                  <span className="text-[11px] text-indigo-700 mt-0.5 block">
                    Расчет без учета дополнительных пополнений
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-600 block">
                    +
                    {formatCurrency(
                      Math.round(
                        (parseFloat(formAmount) * (parseFloat(formRate) / 100)) / 12
                      )
                    )}{' '}
                    / мес
                  </span>
                  <span className="text-[11px] font-bold text-indigo-800 block">
                    +
                    {formatCurrency(
                      Math.round(parseFloat(formAmount) * (parseFloat(formRate) / 100))
                    )}{' '}
                    / год
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2.5">
              {editingDepositId ? (
                <button
                  type="button"
                  onClick={() => {
                    const depToDelete = deposits.find((d) => d.id === editingDepositId);
                    if (depToDelete) setDeletingDeposit(depToDelete);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить вклад</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('list');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingDepositId ? 'Сохранить изменения' : 'Создать вклад'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Yield Calculator */}
        {activeTab === 'calculator' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
              Укажите параметры, чтобы рассчитать сложный процент и будущий капитал с учетом ежемесячных довложений.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Начальная сумма вклада (₽)
                </label>
                <input
                  type="number"
                  value={calcInitial}
                  onChange={(e) => setCalcInitial(e.target.value)}
                  className="w-full font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Процентная ставка (% годовых)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                  className="w-full font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ежемесячное пополнение (₽)
                </label>
                <input
                  type="number"
                  value={calcMonthlyAdd}
                  onChange={(e) => setCalcMonthlyAdd(e.target.value)}
                  className="w-full font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Срок размещения
                </label>
                <select
                  value={calcMonths}
                  onChange={(e) => setCalcMonths(parseInt(e.target.value, 10))}
                  className="w-full font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value={3}>3 месяца</option>
                  <option value={6}>6 месяцев</option>
                  <option value={12}>1 год (12 месяцев)</option>
                  <option value={24}>2 года (24 месяца)</option>
                  <option value={36}>3 года (36 месяцев)</option>
                </select>
              </div>
            </div>

            {/* Calculation Output Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 mt-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400">Итоговая сумма накоплений:</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatCurrency(calcResult.finalAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block">Ваши довложения:</span>
                  <span className="font-bold text-slate-200 block mt-0.5">
                    {formatCurrency(calcResult.totalContributed)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Чистый процентный доход:</span>
                  <span className="font-extrabold text-emerald-400 block mt-0.5">
                    +{formatCurrency(calcResult.totalInterest)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Rate Edit Mini Modal Overlay */}
        {rateEditDeposit && (() => {
          const parsedRate = parseFloat(newRateInput.replace(',', '.')) || 0;
          const oldMonthly = calculateMonthlyInterest(rateEditDeposit);
          const newMonthly = calculateMonthlyInterest({
            ...rateEditDeposit,
            interestRate: parsedRate,
          });
          const oldAnnual = calculateAnnualInterest(rateEditDeposit);
          const newAnnual = calculateAnnualInterest({
            ...rateEditDeposit,
            interestRate: parsedRate,
          });
          const diffMonthly = newMonthly - oldMonthly;
          const diffAnnual = newAnnual - oldAnnual;

          return (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        Изменение процентной ставки
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        «{rateEditDeposit.name}» • {formatCurrency(rateEditDeposit.amount)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRateEditDeposit(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveRate} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Новая процентная ставка (% годовых)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Текущая: <strong className="text-slate-700">{rateEditDeposit.interestRate}%</strong>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="100"
                        required
                        autoFocus
                        value={newRateInput}
                        onChange={(e) => setNewRateInput(e.target.value)}
                        placeholder="19.5"
                        className="w-full text-xl font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-10"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        %
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="mt-2.5 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Быстрый выбор популярной ставки:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[16, 17, 18, 19, 20, 21, 22].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setNewRateInput(r.toString())}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              parsedRate === r
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>

                      {/* Delta modifiers (+0.5%, +1%, -0.5%, -1%) */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {[-1, -0.5, +0.5, +1].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => {
                              const cur = parseFloat(newRateInput.replace(',', '.')) || rateEditDeposit.interestRate;
                              const updated = Math.max(0.1, Math.round((cur + delta) * 10) / 10);
                              setNewRateInput(updated.toString());
                            }}
                            className="px-2 py-0.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-100 rounded-md transition-colors cursor-pointer"
                          >
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comparison preview box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      Пересчет дохода с новой ставкой {parsedRate}%:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">В месяц</span>
                        <span className="text-sm font-extrabold text-emerald-600 block mt-0.5">
                          +{formatCurrency(newMonthly)}
                        </span>
                        {diffMonthly !== 0 && (
                          <span
                            className={`text-[10px] font-bold block mt-0.5 ${
                              diffMonthly > 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {diffMonthly > 0 ? `+${formatCurrency(diffMonthly)}` : formatCurrency(diffMonthly)}
                          </span>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">В год</span>
                        <span className="text-sm font-extrabold text-indigo-600 block mt-0.5">
                          +{formatCurrency(newAnnual)}
                        </span>
                        {diffAnnual !== 0 && (
                          <span
                            className={`text-[10px] font-bold block mt-0.5 ${
                              diffAnnual > 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {diffAnnual > 0 ? `+${formatCurrency(diffAnnual)}` : formatCurrency(diffAnnual)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setRateEditDeposit(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Сохранить ставку {parsedRate}%
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Top Up Mini Modal Overlay */}
        {topUpDeposit && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Пополнение вклада «{topUpDeposit.name}»
                </h3>
                <button
                  onClick={() => setTopUpDeposit(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Сумма пополнения (₽)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full text-lg font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deductWallet"
                  checked={topUpDeductWallet}
                  onChange={(e) => setTopUpDeductWallet(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="deductWallet" className="text-xs text-slate-700 select-none">
                  Списать из текущего баланса как расход семьи
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTopUpDeposit(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTopUp}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Пополнить вклад
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Mini Modal Overlay */}
        {withdrawDeposit && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Снятие с вклада «{withdrawDeposit.name}»
                </h3>
                <button
                  onClick={() => setWithdrawDeposit(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Сумма снятия (макс: {formatCurrency(withdrawDeposit.amount)})
                </label>
                <input
                  type="number"
                  min="1"
                  max={withdrawDeposit.amount}
                  required
                  autoFocus
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="30000"
                  className="w-full text-lg font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addToWallet"
                  checked={withdrawAddToWallet}
                  onChange={(e) => setWithdrawAddToWallet(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="addToWallet" className="text-xs text-slate-700 select-none">
                  Зачислить в баланс кошелька как доход
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawDeposit(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWithdraw}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Подтвердить снятие
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal Overlay */}
        {deletingDeposit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Удалить вклад?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Это действие нельзя отменить
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5">
                <div>
                  Название: <strong className="text-slate-900">{deletingDeposit.name}</strong>
                </div>
                <div>
                  Сумма: <strong className="text-slate-900">{formatCurrency(deletingDeposit.amount)}</strong>
                </div>
                <div>
                  Ставка: <strong className="text-indigo-700">{deletingDeposit.interestRate}% годовых</strong>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Вклад будет удален, а расчет процентов больше не будет начисляться в пассивный доход.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingDeposit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer touch-manipulation"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer touch-manipulation"
                >
                  Удалить вклад
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Всего: <strong>{deposits.length} {pluralizeRu(deposits.length, 'вклад', 'вклада', 'вкладов')}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
