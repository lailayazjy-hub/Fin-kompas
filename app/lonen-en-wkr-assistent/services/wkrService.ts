import { AnalysisStats } from '../types';

export const calculateWKR = (wageBill: number, expenses: { amount: number; category: string }[]): AnalysisStats => {
  // Rules: 2% over first 400.000, 1.18% over the rest.
  const tier1Limit = 400000;
  const rate1 = 0.02;
  const rate2 = 0.0118;

  let totalSpace = 0;

  if (wageBill <= tier1Limit) {
    totalSpace = wageBill * rate1;
  } else {
    totalSpace = (tier1Limit * rate1) + ((wageBill - tier1Limit) * rate2);
  }

  // Calculate used space (only 'Vrije ruimte' counts towards the budget)
  const usedSpace = expenses
    .filter(e => e.category === 'Vrije ruimte')
    .reduce((sum, e) => sum + e.amount, 0);

  const remainingSpace = totalSpace - usedSpace;
  const exceededAmount = remainingSpace < 0 ? Math.abs(remainingSpace) : 0;
  
  // 80% eindheffing on exceeded amount
  const estimatedTax = exceededAmount * 0.8;

  return {
    usedSpace,
    totalSpace,
    remainingSpace: Math.max(0, remainingSpace),
    percentageUsed: (usedSpace / totalSpace) * 100,
    exceededAmount,
    estimatedTax
  };
};

export const formatCurrency = (amount: number, useK: boolean): string => {
  if (useK && Math.abs(amount) >= 1000) {
    return `€ ${(amount / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
};
