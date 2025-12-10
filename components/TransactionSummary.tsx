
import React, { useMemo } from 'react';
import { Transaction, CurrencyCode } from '../types';
import { NumberIcon, ArrowUpIcon, ArrowDownIcon, CheckIcon } from './icons';
import { formatAmount } from '../currency';

interface TransactionSummaryProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

const SummaryCard: React.FC<{ 
    title: string; 
    value: string; 
    icon?: React.ReactNode; 
    subtext?: string; 
    gradientFrom: string; 
    gradientTo: string;
    colSpan?: string; 
}> = ({ title, value, icon, subtext, gradientFrom, gradientTo, colSpan = "" }) => (
    <div className={`relative overflow-hidden p-5 rounded-2xl border border-white/5 backdrop-blur-md shadow-lg group ${colSpan} flex flex-col justify-between`}>
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-15 transition-opacity duration-500`}></div>
        
        <div className="relative z-10 flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{value}</p>
            </div>
            {icon && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/80">
                    {icon}
                </div>
            )}
        </div>
        {subtext && <p className="relative z-10 text-xs text-gray-500 mt-2 font-medium">{subtext}</p>}
    </div>
);

const TransactionSummary: React.FC<TransactionSummaryProps> = ({ transactions, currency }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalIncome = 0;
    let totalSpending = 0;
    let subCount = 0;
    let subTotal = 0;
    let spentThisWeek = 0;
    let spentThisMonth = 0;

    transactions.forEach(t => {
        const amount = t.Amount;
        const date = new Date(t.Date);
        
        if (amount > 0) {
            totalIncome += amount;
        } else {
            const expense = Math.abs(amount);
            totalSpending += expense;
            
            // Time periods
            if (date >= startOfWeek) spentThisWeek += expense;
            if (date >= startOfMonth) spentThisMonth += expense;
        }

        if (t.IsSubscription) {
            subCount++;
            subTotal += Math.abs(amount);
        }
    });

    const balance = totalIncome - totalSpending;

    return { totalIncome, totalSpending, balance, subCount, subTotal, spentThisWeek, spentThisMonth };
  }, [transactions]);

  return (
    <div className="w-full animate-fade-in h-full flex flex-col space-y-4">
        {/* Main Balance Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard 
                title="Current Balance"
                value={formatAmount(stats.balance, currency)}
                icon={<NumberIcon className={`w-6 h-6 ${stats.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`} />}
                gradientFrom={stats.balance >= 0 ? "from-blue-600" : "from-red-900"}
                gradientTo={stats.balance >= 0 ? "to-cyan-900" : "to-red-950"}
                colSpan="md:col-span-1"
            />
             <SummaryCard 
                title="Total Cash In"
                value={formatAmount(stats.totalIncome, currency)}
                icon={<ArrowUpIcon className="w-6 h-6 text-emerald-400" />}
                gradientFrom="from-emerald-600"
                gradientTo="to-green-900"
            />
            <SummaryCard 
                title="Total Cash Out"
                value={formatAmount(stats.totalSpending, currency)}
                icon={<ArrowDownIcon className="w-6 h-6 text-rose-400" />}
                gradientFrom="from-rose-600"
                gradientTo="to-red-900"
            />
        </div>

        {/* Detailed Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard 
                title="Spent This Week"
                value={formatAmount(stats.spentThisWeek, currency)}
                gradientFrom="from-orange-600"
                gradientTo="to-amber-900"
            />
            <SummaryCard 
                title="Spent This Month"
                value={formatAmount(stats.spentThisMonth, currency)}
                gradientFrom="from-pink-600"
                gradientTo="to-purple-900"
            />
            <SummaryCard 
                title="Subscriptions"
                value={stats.subCount.toString()}
                subtext={`Est. ${formatAmount(stats.subTotal, currency)}`}
                gradientFrom="from-purple-600"
                gradientTo="to-indigo-900"
            />
             <SummaryCard 
                title="Net Flow"
                value={formatAmount(stats.balance, currency)}
                subtext="All Time"
                gradientFrom="from-gray-700"
                gradientTo="to-gray-900"
            />
        </div>
    </div>
  );
};

export default TransactionSummary;
