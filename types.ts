
export interface Transaction {
  id: string; // Unique identifier for management
  Date: string;
  Description: string;
  Amount: number;
  Category: string;
  Notes: string;
  IsSubscription: boolean; 
}

export type CurrencyCode = 'USD' | 'EUR' | 'INR' | 'RUB';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // Relative to USD baseline
  locale: string;
}
