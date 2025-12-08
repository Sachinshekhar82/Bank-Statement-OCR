
import React from 'react';
import { Transaction, CurrencyCode } from '../types';
import { NumberIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { formatAmount } from '../currency';

interface TransactionSummaryProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass?: string }> = ({ title, value, icon, colorClass = 'text-gray-200' }) => (
    <div className="bg-gray-800/70 p-6 rounded-lg flex items-center space-x-4 border border-gray-700/50 hover:border-gray-600 transition-colors duration-300">
        <div className="p-3 rounded-full bg-gray-700 shadow-inner">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400 font-medium">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
        </div>
    </div>
);

const TransactionSummary: React.FC<TransactionSummaryProps> = ({ transactions, currency }) => {
  if (transactions.length === 0) {
    return null;
  }

  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter(t => t.Amount > 0)
    .reduce((sum, t) => sum + t.Amount, 0);
  const totalSpending = transactions
    .filter(t => t.Amount < 0)
    .reduce((sum, t) => sum + t.Amount, 0);

  return (
    <div className="w-full mb-8 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SummaryCard 
                title="Total Transactions"
                value={totalTransactions.toString()}
                icon={<NumberIcon className="w-6 h-6 text-blue-400" />}
            />
            <SummaryCard 
                title="Total Income"
                value={formatAmount(totalIncome, currency)}
                icon={<ArrowUpIcon className="w-6 h-6 text-green-400" />}
                colorClass="text-green-400"
            />
            <SummaryCard 
                title="Total Spending"
                value={formatAmount(Math.abs(totalSpending), currency)}
                icon={<ArrowDownIcon className="w-6 h-6 text-red-400" />}
                colorClass="text-red-400"
            />
        </div>
    </div>
  );
};

export default TransactionSummary;
