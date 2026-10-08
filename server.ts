import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gemini AI SDK on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function generateLocalAnalysis(financialContext: any, prompt: string): string {
  if (!financialContext) {
    return 'Данные о доходах и расходах пока отсутствуют. Добавьте первые операции для получения аналитики!';
  }

  const { totalIncome, totalExpense, balance, categoryAnalysis, regularPayments, deposits } = financialContext;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const depositsSum = (deposits || []).reduce((s: number, d: any) => s + (d.amount || 0), 0);
  const monthlyInterestSum = (deposits || []).reduce((s: number, d: any) => s + (d.monthlyInterest || 0), 0);

  const overBudgetCats: string[] = [];
  const nearBudgetCats: string[] = [];

  if (categoryAnalysis) {
    Object.entries(categoryAnalysis).forEach(([cat, data]: [string, any]) => {
      if (data.limit && data.spent > data.limit) {
        overBudgetCats.push(`• **${cat}**: расход ${data.spent.toLocaleString('ru-RU')} ₽ при лимите ${data.limit.toLocaleString('ru-RU')} ₽ (превышение на ${(data.spent - data.limit).toLocaleString('ru-RU')} ₽)`);
      } else if (data.limit && data.percent >= 80) {
        nearBudgetCats.push(`• **${cat}**: использовано ${data.percent}% (${data.spent.toLocaleString('ru-RU')} из ${data.limit.toLocaleString('ru-RU')} ₽)`);
      }
    });
  }

  return `### 📊 Анализ семейного кошелька

**Финансовый итог месяца:**
• **Доходы:** +${(totalIncome || 0).toLocaleString('ru-RU')} ₽
• **Расходы:** -${(totalExpense || 0).toLocaleString('ru-RU')} ₽
• **Текущий баланс:** ${(balance || 0).toLocaleString('ru-RU')} ₽ (норма сбережений: **${savingsRate}%**)
${depositsSum > 0 ? `• **Вклады и накопления:** ${depositsSum.toLocaleString('ru-RU')} ₽ (пассивный доход: +${monthlyInterestSum.toLocaleString('ru-RU')} ₽ / мес)\n` : ''}

${overBudgetCats.length > 0 ? `**⚠️ Превышение лимитов:**\n${overBudgetCats.join('\n')}\n` : '✅ **Бюджет под контролем:** ни по одной категории лимит не превышен.\n'}
${nearBudgetCats.length > 0 ? `**Внимание к категориям (близко к лимиту):**\n${nearBudgetCats.join('\n')}\n` : ''}

**💡 Рекомендация:**
Сохраняйте темп сбережений не менее 15-20% от совокупного дохода. Регулярные пополнения вкладов и контроль лимитов обеспечат финансовую стабильность семьи.`;
}

// API endpoint for AI Financial Assistant
app.post('/api/ai-advisor', async (req, res) => {
  try {
    const { prompt, financialContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Промпт не указан' });
    }

    if (!process.env.GEMINI_API_KEY) {
      const fallbackReply = generateLocalAnalysis(financialContext, prompt);
      return res.json({ reply: fallbackReply });
    }

    const systemInstruction = `Ты — умный семейный финансовый советник в приложении «Семейный кошелёк».
Твоя цель — анализировать финансовые данные семьи (доходы, расходы, категории, бюджетные лимиты, членов семьи, регулярные платежи) и давать конкретные, практичные и доброжелательные рекомендации на русском языке.

Правила:
1. Опирайся СТРОГО на предоставленные данные (месяц, доходы, расходы, баланс, категории, члены семьи, регулярные платежи).
2. Называй точные суммы в рублях (₽) и проценты выполнения бюджетов.
3. Отмечай как успехи (хорошая норма сбережений, удержание в рамках бюджета), так и риски (перерасход, приближение к лимиту, просроченные платежи).
4. Пиши структурированно, понятно, с краткими буллетами, без лишней "воды" и без клише.
5. Не используй markdown-заголовки первого уровня (#), используй жирный шрифт, маркеры и разделы.`;

    const contextSummary = financialContext
      ? `ДАННЫЕ СЕМЕЙНОГО КОШЕЛЬКА ЗА ${financialContext.yearMonth || 'текущий период'}:
- Общий доход: ${financialContext.totalIncome} ₽
- Общий расход: ${financialContext.totalExpense} ₽
- Текущий баланс: ${financialContext.balance} ₽
- Лимиты бюджетов и факт расходов по категориям:
${JSON.stringify(financialContext.categoryAnalysis || {}, null, 2)}
- Вклады и накопительные счета:
${JSON.stringify(financialContext.deposits || [], null, 2)}
- Регулярные платежи семьи:
${JSON.stringify(financialContext.regularPayments || [], null, 2)}
- Последние операции:
${JSON.stringify(financialContext.recentTransactions || [], null, 2)}`
      : 'Данные о финансах пока не переданы.';

    const fullPrompt = `${contextSummary}\n\nВОПРОС ИЛИ ЗАПРОС ПОЛЬЗОВАТЕЛЯ:\n${prompt}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      const reply = response.text || generateLocalAnalysis(financialContext, prompt);
      return res.json({ reply });
    } catch (genError: any) {
      console.warn('Gemini generateContent transient error, using smart fallback analysis:', genError.message);
      const reply = generateLocalAnalysis(financialContext, prompt);
      return res.json({ reply });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || 'Ошибка обработки запроса',
    });
  }
});

// Setup Vite middleware for SPA
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
