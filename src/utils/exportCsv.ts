import { Transaction } from '../types';

/**
 * Escapes a cell value for standard CSV format.
 * Quotes if the value contains delimiter, double quotes, or newlines.
 */
function escapeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  if (
    str.includes(';') ||
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports transactions to a CSV file optimized for Excel (Cyrillic support via UTF-8 BOM)
 * and Google Sheets.
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  filename?: string
): boolean {
  // Semicolon is standard for Russian/European Excel locale
  const delimiter = ';';
  const headers = ['Дата', 'Тип', 'Категория', 'Сумма', 'Комментарий'];

  // Sort by date descending (latest first)
  const sorted = [...(transactions || [])].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt - a.createdAt;
  });

  const rows = sorted.map((tx) => [
    escapeCsvCell(tx.date),
    escapeCsvCell(tx.type === 'expense' ? 'Расход' : 'Доход'),
    escapeCsvCell(tx.category),
    escapeCsvCell(tx.amount),
    escapeCsvCell(tx.comment || ''),
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
