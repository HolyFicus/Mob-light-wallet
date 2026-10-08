import { Deposit } from '../types';

/**
 * Calculates monthly interest earned from a deposit: (amount * (rate / 100)) / 12
 */
export function calculateMonthlyInterest(deposit: Deposit): number {
  if (!deposit || deposit.amount <= 0 || deposit.interestRate <= 0) return 0;
  return Math.round((deposit.amount * (deposit.interestRate / 100)) / 12);
}

/**
 * Calculates annual interest earned from a deposit: amount * (rate / 100)
 */
export function calculateAnnualInterest(deposit: Deposit): number {
  if (!deposit || deposit.amount <= 0 || deposit.interestRate <= 0) return 0;
  return Math.round(deposit.amount * (deposit.interestRate / 100));
}

/**
 * Calculates daily approximate interest
 */
export function calculateDailyInterest(deposit: Deposit): number {
  if (!deposit || deposit.amount <= 0 || deposit.interestRate <= 0) return 0;
  return Math.round((deposit.amount * (deposit.interestRate / 100)) / 365);
}

/**
 * Total capital across all active deposits
 */
export function calculateTotalDeposits(deposits: Deposit[]): number {
  return deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
}

/**
 * Total passive income from interest across all deposits per month
 */
export function calculateTotalMonthlyInterest(deposits: Deposit[]): number {
  return deposits.reduce((sum, d) => sum + calculateMonthlyInterest(d), 0);
}

/**
 * Total passive income per year
 */
export function calculateTotalAnnualInterest(deposits: Deposit[]): number {
  return deposits.reduce((sum, d) => sum + calculateAnnualInterest(d), 0);
}

/**
 * Weighted average interest rate across all deposits
 */
export function calculateWeightedInterestRate(deposits: Deposit[]): number {
  const total = calculateTotalDeposits(deposits);
  if (total <= 0 || deposits.length === 0) return 0;
  const weightedSum = deposits.reduce((sum, d) => sum + (d.amount * d.interestRate), 0);
  return Number((weightedSum / total).toFixed(2));
}

/**
 * Projects future deposit value with compound interest and optional monthly top-ups
 */
export function calculateFutureProjection(
  initialAmount: number,
  annualRate: number,
  months: number,
  monthlyAdd: number = 0
): { finalAmount: number; totalInterest: number; totalContributed: number } {
  let current = initialAmount;
  let totalContributed = initialAmount;
  const monthlyRate = annualRate / 100 / 12;

  for (let i = 0; i < months; i++) {
    const interest = current * monthlyRate;
    current += interest + monthlyAdd;
    totalContributed += monthlyAdd;
  }

  return {
    finalAmount: Math.round(current),
    totalInterest: Math.round(current - totalContributed),
    totalContributed: Math.round(totalContributed),
  };
}
