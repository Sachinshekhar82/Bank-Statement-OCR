import React from 'react';
import { Transaction } from '../types';
import { NumberIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface TransactionSummaryProps {
  transactions: Transaction[];
}

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass?: string }> = ({ title, value, icon, colorClass = 'text-gray-200' }) => (
    <div className="bg-gray-800/70 p-6 rounded-lg flex items-center space-x-4">
        <div className="p-3 rounded-full bg-gray-700">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        </div>
    </div>
);

const TransactionSummary: React.FC<TransactionSummaryProps> = ({ transactions }) => {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard 
                title="Total Transactions"
                value={totalTransactions.toString()}
                icon={<NumberIcon className="w-6 h-6 text-blue-400" />}
            />
            <SummaryCard 
                title="Total Income"
                value={`$${totalIncome.toFixed(2)}`}
                icon={<ArrowUpIcon className="w-6 h-6 text-green-400" />}
                colorClass="text-green-400"
            />
            <SummaryCard 
                title="Total Spending"
                value={`$${Math.abs(totalSpending).toFixed(2)}`}
                icon={<ArrowDownIcon className="w-6 h-6 text-red-400" />}
                colorClass="text-red-400"
            />
        </div>
    </div>
  );
};

export default TransactionSummary;