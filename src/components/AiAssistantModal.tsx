import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  HelpCircle,
  TrendingDown,
  Users,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { CategoryBudgets, RegularPayment, Transaction } from '../types';
import { generateLocalFinancialAnalysis } from '../utils/aiAdvisor';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearMonth: string;
  transactions: Transaction[];
  budgets: CategoryBudgets;
  regularPayments: RegularPayment[];
  members: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  yearMonth,
  transactions,
  budgets,
  regularPayments,
  members,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Здравствуйте! Я ваш семейный финансовый ИИ-помощник. Я проанализировал данные вашего кошелька за выбранный месяц: доходы, расходы, категории и бюджетные лимиты. Задайте мне любой вопрос о семейных финансах или выберите одну из тем ниже!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Prepare contextual financial data for AI
  const monthTransactions = transactions.filter((t) => t.date.startsWith(yearMonth));

  let totalIncome = 0;
  let totalExpense = 0;
  const categorySpending: Record<string, number> = {};
  const memberSpending: Record<string, { expense: number; income: number }> = {};

  members.forEach((m) => {
    memberSpending[m] = { expense: 0, income: 0 };
  });

  monthTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      totalExpense += tx.amount;
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
      if (memberSpending[tx.member]) {
        memberSpending[tx.member].expense += tx.amount;
      }
    } else {
      totalIncome += tx.amount;
      if (memberSpending[tx.member]) {
        memberSpending[tx.member].income += tx.amount;
      }
    }
  });

  const categoryAnalysis: Record<string, any> = {};
  Object.keys(budgets).forEach((cat) => {
    const spent = categorySpending[cat] || 0;
    const limit = budgets[cat] || 0;
    categoryAnalysis[cat] = {
      spent,
      limit,
      percent: limit > 0 ? Math.round((spent / limit) * 100) : null,
      status: spent > limit ? 'ПРЕВЫШЕН' : 'В НОРМЕ',
    };
  });

  const financialContext = {
    yearMonth,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryAnalysis,
    memberSpending,
    regularPayments: regularPayments.map((p) => ({
      title: p.title,
      amount: p.amount,
      dayOfMonth: p.dayOfMonth,
      category: p.category,
      member: p.member,
    })),
    recentTransactions: monthTransactions.slice(0, 15).map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      member: t.member,
      comment: t.comment,
      date: t.date,
    })),
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          financialContext,
        }),
      });

      if (!response.ok) {
        // Fallback for static environments (GitHub Pages, etc.)
        const localReply = generateLocalFinancialAnalysis(financialContext, textToSend);
        setMessages((prev) => [...prev, { role: 'assistant', content: localReply }]);
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      console.warn('Network or static environment detected, using client analysis:', err);
      const localReply = generateLocalFinancialAnalysis(financialContext, textToSend);
      setMessages((prev) => [...prev, { role: 'assistant', content: localReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      label: 'Полный анализ бюджета за месяц',
      icon: Lightbulb,
      prompt: 'Сделай подробный финансовый анализ наших трат и доходов за этот месяц. Какие статьи расходов основные и есть ли перерасходы?',
    },
    {
      label: 'Где мы можем сэкономить?',
      icon: TrendingDown,
      prompt: 'Посмотри на категории наших расходов и подскажи 3-4 конкретных способа оптимизировать семейный бюджет.',
    },
    {
      label: 'Анализ трат по членам семьи',
      icon: Users,
      prompt: 'Проанализируй, кто из членов семьи сколько потратил и на какие категории. Дай краткий отчет.',
    },
    {
      label: 'Проверка лимитов и регулярных платежей',
      icon: AlertTriangle,
      prompt: 'Проверь, не превысили ли мы лимиты бюджета по категориям и какие регулярные счета нам предстоит оплатить.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] max-h-[720px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50/50 to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>Семейный ИИ-помощник</span>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Gemini Flash
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Работает напрямую с вашими реальными доходами и расходами
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt buttons */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto flex items-center gap-2 scrollbar-none">
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-900 text-xs font-semibold rounded-lg shadow-2xs transition-all disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg, index) => {
            const isAi = msg.role === 'assistant';
            return (
              <div
                key={index}
                className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAi
                      ? 'bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-2xs'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isAi
                      ? 'bg-slate-50 text-slate-800 border border-slate-100'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Анализирую ваши семейные финансы...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Спросите ИИ о расходах, бюджетах или советах..."
              disabled={isLoading}
              className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
              aria-label="Отправить"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
