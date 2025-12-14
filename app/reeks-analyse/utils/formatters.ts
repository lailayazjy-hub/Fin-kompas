import { format, differenceInDays } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { RiskLevel, SuspenseItem } from '../types';

export const formatCurrency = (amount: number, useKNotation: boolean = true): string => {
  if (useKNotation) {
    const kValue = amount / 1000;
    return `€ ${kValue.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return `€ ${amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyK = (amount: number): string => {
   return formatCurrency(amount, true);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'dd-MM-yyyy');
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'dd-MM-yyyy HH:mm');
};

export const calculateRisk = (entryDate: string): RiskLevel => {
  const days = differenceInDays(new Date(), new Date(entryDate));
  if (days > 90) return RiskLevel.HIGH;
  if (days > 60) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};

export const getDaysOpen = (entryDate: string): number => {
  return differenceInDays(new Date(), new Date(entryDate));
};

export const groupItemsByAccount = (items: SuspenseItem[]) => {
  const groups: Record<string, SuspenseItem[]> = {};
  items.forEach(item => {
    if (!groups[item.accountCode]) {
      groups[item.accountCode] = [];
    }
    groups[item.accountCode].push(item);
  });
  return groups;
};