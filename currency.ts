
import { CurrencyCode, CurrencyConfig } from './types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', rate: 1, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, locale: 'de-DE' },
  INR: { code: 'INR', symbol: '₹', rate: 83.5, locale: 'en-IN' },
  RUB: { code: 'RUB', symbol: '₽', rate: 92.0, locale: 'ru-RU' },
};

export const formatAmount = (amount: number, currencyCode: CurrencyCode): string => {
  const config = CURRENCIES[currencyCode];
  if (!config) return `${amount}`;
  
  const convertedAmount = amount * config.rate;
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount);
};
