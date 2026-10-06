import React from 'react';
import { Users } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FamilyMembersSummaryProps {
  transactions: Transaction[];
  members: string[];
  yearMonth: string;
}

export const FamilyMembersSummary: React.FC<FamilyMembersSummaryProps> = ({
  transactions,
  members,
  yearMonth,
}) => {
  const monthTransactions = transactions.filter((t) => t.date.startsWith(yearMonth));

  const statsByMember = members.map((member) => {
    let expense = 0;
    let income = 0;
    monthTransactions
      .filter((t) => t.member === member)
      .forEach((t) => {
        if (t.type === 'expense') expense += t.amount;
        else income += t.amount;
      });

    return {
      member,
      expense,
      income,
      balance: income - expense,
    };
  });

  const totalExpense = statsByMember.reduce((acc, m) => acc + m.expense, 0);
  const hasOperations = monthTransactions.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            Расходы по членам семьи
          </h3>
          <p className="text-xs text-slate-500">Участие в семейном бюджете за месяц</p>
        </div>
      </div>

      {!hasOperations ? (
        <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
          Данные появятся после добавления первых операций
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {statsByMember.map(({ member, expense, income }) => {
            const share = totalExpense > 0 ? Math.round((expense / totalExpense) * 100) : 0;

            return (
              <div key={member} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                      {member.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800">{member}</span>
                    {share > 0 && (
                      <span className="text-slate-400 text-[11px]">({share}%)</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      -{formatCurrency(expense)}
                    </span>
                    {income > 0 && (
                      <span className="text-[11px] text-emerald-600 font-medium ml-2">
                        (+{formatCurrency(income)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Share bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(share, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
