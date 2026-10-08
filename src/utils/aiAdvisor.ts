export interface FinancialContext {
  yearMonth?: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryAnalysis?: Record<string, any>;
  regularPayments?: Array<{
    title: string;
    amount: number;
    dayOfMonth: number;
    category: string;
  }>;
  deposits?: Array<{
    name: string;
    amount: number;
    interestRate: number;
    monthlyInterest: number;
    interestPayout: string;
  }>;
  recentTransactions?: Array<{
    type: string;
    amount: number;
    category: string;
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
    regularPayments,
    deposits,
  } = context;

  const depositsSum = (deposits || []).reduce((s, d) => s + (d.amount || 0), 0);
  const monthlyInterestSum = (deposits || []).reduce((s, d) => s + (d.monthlyInterest || 0), 0);
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

  const pLower = prompt.toLowerCase();

  // Custom prompt matching
  if (pLower.includes('вклад') || pLower.includes('процент') || pLower.includes('накоп')) {
    return `### 🏦 Анализ вкладов и пассивного дохода

• **Сумма на вкладах:** ${depositsSum.toLocaleString('ru-RU')} ₽
• **Ожидаемый пассивный доход:** +${monthlyInterestSum.toLocaleString('ru-RU')} ₽ / месяц (+${(monthlyInterestSum * 12).toLocaleString('ru-RU')} ₽ / год)
${deposits && deposits.length > 0 ? `• **Ваши вклады:**\n${deposits.map(d => `  - **${d.name}**: ${d.amount.toLocaleString('ru-RU')} ₽ под ${d.interestRate}% годовых (+${d.monthlyInterest.toLocaleString('ru-RU')} ₽/мес)`).join('\n')}` : '• У вас пока нет открытых вкладов. Откройте вклад в разделе «Вклады и проценты», чтобы получать пассивный доход!'}

💡 **Совет**: Регулярное пополнение вклада в день зарплаты и капитализация процентов ускоряют рост капитала.`;
  }

  if (pLower.includes('сэконом') || pLower.includes('оптимиз')) {
    return `### 💡 Советы по оптимизации бюджета

1. **Контроль лимитов**:
${
  overBudgetCats.length > 0
    ? `Обратите внимание на статьи перерасхода:\n${overBudgetCats.join('\n')}\nПостарайтесь снизить спонтанные покупки в этих категориях.`
    : 'Все категории расходов укладываются в установленные рамки бюджета — отличный результат!'
}

2. **Правило 50/30/20**:
Постарайтесь направлять до 50% дохода на обязательные нужды (жильё, продукты, регулярные счета), 30% на личные траты и развлечения, а 20% — откладывать на вклады и накопительные счета. Сейчас ваша норма сбережений составляет **${savingsRate}%**.

3. **Регулярные платежи**:
Запланировано регулярных обязательств на сумму ${(regularPayments || []).reduce((acc, b) => acc + b.amount, 0).toLocaleString('ru-RU')} ₽. Проверьте подписки и тарифы связи — часто смена пакета экономит 10-15% в год.`;
  }

  return `### 📊 Анализ финансов за месяц

**Финансовый итог месяца:**
• **Доходы:** +${(totalIncome || 0).toLocaleString('ru-RU')} ₽
• **Расходы:** -${(totalExpense || 0).toLocaleString('ru-RU')} ₽
• **Текущий баланс:** ${(balance || 0).toLocaleString('ru-RU')} ₽ (норма сбережений: **${savingsRate}%**)
${
  depositsSum > 0
    ? `• **Вклады и накопления:** ${depositsSum.toLocaleString('ru-RU')} ₽ (пассивный доход: +${monthlyInterestSum.toLocaleString('ru-RU')} ₽ / мес)\n`
    : ''
}

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
**💡 Рекомендация:**
${
  balance > 0
    ? 'Положительный баланс позволяет регулярно пополнять вклады и сформировать финансовую подушку безопасности на 3–6 месяцев обязательных расходов.'
    : 'Расходы превышают доходы или баланс нулевой — пересмотрите необязательные статьи трат.'
}`;
}
