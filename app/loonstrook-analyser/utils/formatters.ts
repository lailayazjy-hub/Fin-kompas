export const formatCurrency = (amount: number, mode: 'full' | 'k'): string => {
  if (mode === 'k') {
    if (Math.abs(amount) >= 1000) {
      return `€ ${(amount / 1000).toFixed(1)}k`;
    }
  }
  
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};
