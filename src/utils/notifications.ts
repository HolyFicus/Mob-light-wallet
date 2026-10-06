import { AppNotification, CategoryBudgets, RegularPayment, Transaction } from '../types';
import { formatCurrency } from './formatters';

interface GenerateNotificationsParams {
  yearMonth: string; // e.g. '2026-10'
  transactions: Transaction[];
  budgets: CategoryBudgets;
  regularPayments: RegularPayment[];
  dismissedNotificationIds?: string[];
}

export function generateActiveNotifications({
  yearMonth,
  transactions,
  budgets,
  regularPayments,
  dismissedNotificationIds = [],
}: GenerateNotificationsParams): AppNotification[] {
  const notifications: AppNotification[] = [];

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentDay = now.getDate();

  // 1. Calculate spending per category for selected month
  const categorySpending: Record<string, number> = {};
  const monthTransactions = transactions.filter((t) => t.date.startsWith(yearMonth));

  monthTransactions.forEach((t) => {
    if (t.type === 'expense') {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    }
  });

  // Check budget limits
  Object.entries(budgets).forEach(([category, limit]) => {
    if (!limit || limit <= 0) return;
    const spent = categorySpending[category] || 0;
    const percent = Math.round((spent / limit) * 100);

    if (spent > limit) {
      const overAmount = spent - limit;
      const notifId = `budget-exceeded-${yearMonth}-${category}`;
      if (!dismissedNotificationIds.includes(notifId)) {
        notifications.push({
          id: notifId,
          type: 'budget_exceeded',
          severity: 'danger',
          title: `Превышен бюджет: «${category}»`,
          message: `Израсходовано ${formatCurrency(spent)} из ${formatCurrency(limit)}. Превышение на ${formatCurrency(overAmount)} (${percent}%).`,
          date: yearMonth,
          read: false,
          category,
        });
      }
    } else if (percent >= 85) {
      const remaining = limit - spent;
      const notifId = `budget-warn-${yearMonth}-${category}`;
      if (!dismissedNotificationIds.includes(notifId)) {
        notifications.push({
          id: notifId,
          type: 'budget_warning',
          severity: 'warning',
          title: `Бюджет «${category}» на исходе`,
          message: `Израсходовано ${percent}% лимита (${formatCurrency(spent)} из ${formatCurrency(limit)}). Осталось всего ${formatCurrency(remaining)}.`,
          date: yearMonth,
          read: false,
          category,
        });
      }
    }
  });

  // 2. Regular payments (only evaluate if currently viewing current month or present time)
  if (yearMonth === currentYM) {
    regularPayments.forEach((payment) => {
      // Check if already paid this month:
      // A transaction with matching category and amount (+/- 10%) or comment mentioning title
      const isPaid = monthTransactions.some(
        (t) =>
          t.type === 'expense' &&
          (t.comment.toLowerCase().includes(payment.title.toLowerCase()) ||
            (t.category === payment.category && Math.abs(t.amount - payment.amount) < payment.amount * 0.05))
      );

      if (!isPaid) {
        const diffDays = payment.dayOfMonth - currentDay;

        if (diffDays === 0) {
          const notifId = `bill-today-${currentYM}-${payment.id}`;
          if (!dismissedNotificationIds.includes(notifId)) {
            notifications.push({
              id: notifId,
              type: 'bill_today',
              severity: 'danger',
              title: `Сегодня день оплаты: ${payment.title}`,
              message: `Сумма к оплате: ${formatCurrency(payment.amount)}. Ответственный: ${payment.member}.`,
              date: `${yearMonth}-${String(payment.dayOfMonth).padStart(2, '0')}`,
              read: false,
              billId: payment.id,
              actionLabel: 'Записать расход',
              actionData: payment,
            });
          }
        } else if (diffDays > 0 && diffDays <= (payment.autoPayNoticeDays || 3)) {
          const notifId = `bill-due-${currentYM}-${payment.id}`;
          if (!dismissedNotificationIds.includes(notifId)) {
            notifications.push({
              id: notifId,
              type: 'bill_due',
              severity: 'warning',
              title: `Скоро оплата: ${payment.title}`,
              message: `Через ${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} (${payment.dayOfMonth}-го числа) необходимо оплатить ${formatCurrency(payment.amount)}.`,
              date: `${yearMonth}-${String(payment.dayOfMonth).padStart(2, '0')}`,
              read: false,
              billId: payment.id,
              actionLabel: 'Записать расход',
              actionData: payment,
            });
          }
        } else if (diffDays < 0 && Math.abs(diffDays) <= 15) {
          const notifId = `bill-overdue-${currentYM}-${payment.id}`;
          if (!dismissedNotificationIds.includes(notifId)) {
            notifications.push({
              id: notifId,
              type: 'bill_overdue',
              severity: 'danger',
              title: `Просрочен регулярный платеж: ${payment.title}`,
              message: `Платеж на ${formatCurrency(payment.amount)} должен был быть оплачен ${payment.dayOfMonth}-го числа.`,
              date: `${yearMonth}-${String(payment.dayOfMonth).padStart(2, '0')}`,
              read: false,
              billId: payment.id,
              actionLabel: 'Записать расход',
              actionData: payment,
            });
          }
        }
      }
    });
  }

  return notifications;
}
