
export interface Transaction {
  Date: string;
  Description: string;
  Amount: number;
  Category: string;
  Notes: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'INR' | 'RUB';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // Relative to USD baseline
  locale: string;
}
