import { Transaction } from '../types';
import { sanitizeCsvCell } from './security';

/**
 * Exports transactions to a CSV file optimized for Excel (Cyrillic support via UTF-8 BOM)
 * and Google Sheets, hardened against CSV Formula Injection attacks.
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  filename?: string
): boolean {
  // Semicolon is standard for Russian/European Excel locale
  const delimiter = ';';
  const headers = ['Дата', 'Тип', 'Категория', 'Подкатегория', 'Сумма', 'Комментарий'];

  // Sort by date descending (latest first)
  const sorted = [...(transactions || [])].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt - a.createdAt;
  });

  const rows = sorted.map((tx) => [
    sanitizeCsvCell(tx.date, false),
    sanitizeCsvCell(tx.type === 'expense' ? 'Расход' : 'Доход', false),
    sanitizeCsvCell(tx.category, false),
    sanitizeCsvCell(tx.subcategory || '', false),
    sanitizeCsvCell(tx.amount, true),
    sanitizeCsvCell(tx.comment || '', false),
  ]);

  const csvContent = [
    headers.join(delimiter),
    ...rows.map((row) => row.join(delimiter)),
  ].join('\r\n');

  // Prepend UTF-8 BOM so Excel automatically recognizes Russian UTF-8 text without garbled characters
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split('T')[0];
  const downloadName = filename || `transactions_export_${today}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', downloadName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
