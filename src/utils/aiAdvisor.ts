export interface FinancialContext {
  yearMonth?: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryAnalysis?: Record<string, any>;
  memberSpending?: Record<string, { expense: number; income: number }>;
  regularPayments?: Array<{
    title: string;
    amount: number;
    dayOfMonth: number;
    category: string;
    member: string;
  }>;
  recentTransactions?: Array<{
    type: string;
    amount: number;
    category: string;
    member: string;
    comment: string;
    date: string;
  }>;
}

export function generateLocalFinancialAnalysis(
  context: FinancialContext,
  prompt: string
): string {
  if (!context || (context.totalIncome === 0 && context.totalExpense === 0)) {
    return 'В кошельке за выбранный месяц пока нет операций. Добавьте первые доходы или расходы, чтобы получить персональный финансовый анализ и рекомендации!';
  }

  const {
    totalIncome,
    totalExpense,
    balance,
    categoryAnalysis,
    memberSpending,
    regularPayments,
  } = context;
  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  const overBudgetCats: string[] = [];
  const nearBudgetCats: string[] = [];

  if (categoryAnalysis) {
    Object.entries(categoryAnalysis).forEach(([cat, data]: [string, any]) => {
      if (data.limit && data.spent > data.limit) {
        overBudgetCats.push(
          `• **${cat}**: расход ${data.spent.toLocaleString('ru-RU')} ₽ при лимите ${data.limit.toLocaleString('ru-RU')} ₽ (превышение на ${(data.spent - data.limit).toLocaleString('ru-RU')} ₽)`
        );
      } else if (data.limit && data.percent >= 80) {
        nearBudgetCats.push(
          `• **${cat}**: использовано ${data.percent}% (${data.spent.toLocaleString('ru-RU')} из ${data.limit.toLocaleString('ru-RU')} ₽)`
        );
      }
    });
  }

  let topSpender = '';
  let maxSpend = 0;
  if (memberSpending) {
    Object.entries(memberSpending).forEach(([member, data]: [string, any]) => {
      if (data.expense > maxSpend) {
        maxSpend = data.expense;
        topSpender = member;
      }
    });
  }

  const pLower = prompt.toLowerCase();

  // Custom prompt matching
  if (pLower.includes('сэконом') || pLower.includes('оптимиз')) {
    return `### 💡 Советы по оптимизации семейного бюджета

1. **Контроль лимитов**:
${
  overBudgetCats.length > 0
    ? `Обратите внимание на статьи перерасхода:\n${overBudgetCats.join('\n')}\nПостарайтесь снизить спонтанные покупки в этих категориях.`
    : 'Все категории расходов укладываются в установленные рамки бюджета — отличный результат!'
}

2. **Правило 50/30/20**:
Постарайтесь направлять до 50% дохода на обязательные нужды (жильё, продукты, регулярные счета), 30% на личные траты и развлечения, а 20% — откладывать в резервный фонд. Сейчас ваша норма сбережений составляет **${savingsRate}%**.

3. **Регулярные платежи**:
Запланировано регулярных обязательств на сумму ${(regularPayments || []).reduce((acc, b) => acc + b.amount, 0).toLocaleString('ru-RU')} ₽. Проверьте подписки и тарифы связи — часто смена пакета экономит 10-15% в год.`;
  }

  if (pLower.includes('кто') || pLower.includes('член') || pLower.includes('семь')) {
    const membersSummary = memberSpending
      ? Object.entries(memberSpending)
          .map(
            ([m, d]) =>
              `• **${m}**: расходы **${d.expense.toLocaleString('ru-RU')} ₽**${d.income > 0 ? `, доходы +${d.income.toLocaleString('ru-RU')} ₽` : ''}`
          )
          .join('\n')
      : 'Информация отсутствует.';

    return `### 👥 Анализ трат по членам семьи

${membersSummary}

${
  topSpender
    ? `Больше всего расходов зафиксировано у **${topSpender}** (${maxSpend.toLocaleString('ru-RU')} ₽).`
    : ''
}

Обсуждайте крупные покупки совместно, чтобы поддерживать семейную финансовую гармонию!`;
  }

  return `### 📊 Анализ семейного кошелька

**Финансовый итог месяца:**
• **Доходы:** +${(totalIncome || 0).toLocaleString('ru-RU')} ₽
• **Расходы:** -${(totalExpense || 0).toLocaleString('ru-RU')} ₽
• **Текущий баланс:** ${(balance || 0).toLocaleString('ru-RU')} ₽ (норма сбережений: **${savingsRate}%**)

${
  overBudgetCats.length > 0
    ? `**⚠️ Превышение лимитов:**\n${overBudgetCats.join('\n')}\n`
    : '✅ **Бюджет под контролем:** ни по одной категории лимит не превышен.\n'
}
${
  nearBudgetCats.length > 0
    ? `**Внимание к категориям (близко к лимиту):**\n${nearBudgetCats.join('\n')}\n`
    : ''
}
${topSpender ? `**Члены семьи:** Основная доля расходов у **${topSpender}** (${maxSpend.toLocaleString('ru-RU')} ₽).\n` : ''}
**💡 Рекомендация:**
${
  balance > 0
    ? 'Положительный баланс позволяет сформировать семейную подушку безопасности на 3–6 месяцев обязательных расходов.'
    : 'Расходы превышают доходы или баланс нулевой — пересмотрите необязательные статьи трат.'
}`;
}
