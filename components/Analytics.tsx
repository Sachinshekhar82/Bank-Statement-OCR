
import React, { useMemo } from 'react';
import { Transaction, CurrencyCode } from '../types';
import { formatAmount } from '../currency';
import { ChartIcon } from './icons';

interface AnalyticsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const Analytics: React.FC<AnalyticsProps> = ({ transactions, currency }) => {
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.Amount < 0);
    const groups: Record<string, number> = {};
    let totalExpense = 0;

    expenses.forEach(t => {
      const amount = Math.abs(t.Amount);
      const category = t.Category || 'Other';
      groups[category] = (groups[category] || 0) + amount;
      totalExpense += amount;
    });

    return Object.entries(groups)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (categoryData.length === 0) return null;

  // Pie Chart Logic
  let accumulatedAngle = 0;
  const piePathData = categoryData.map(item => {
    const angle = (item.percentage / 100) * 360;
    const x1 = 50 + 40 * Math.cos((Math.PI / 180) * accumulatedAngle);
    const y1 = 50 + 40 * Math.sin((Math.PI / 180) * accumulatedAngle);
    const x2 = 50 + 40 * Math.cos((Math.PI / 180) * (accumulatedAngle + angle));
    const y2 = 50 + 40 * Math.sin((Math.PI / 180) * (accumulatedAngle + angle));
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    accumulatedAngle += angle;
    return { ...item, path };
  });

  const maxBarValue = Math.max(...categoryData.map(d => d.value));

  return (
    <div className="w-full space-y-8 animate-fade-in mt-8">
      <div className="flex items-center space-x-2 mb-6">
        <ChartIcon className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-100">Spending Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-300 mb-6">Distribution by Category</h3>
            <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {piePathData.map((slice, i) => (
                    <path
                        key={slice.name}
                        d={slice.path}
                        fill={slice.color}
                        stroke="#1f2937"
                        strokeWidth="1"
                        className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                    >
                        <title>{`${slice.name}: ${formatAmount(slice.value, currency)} (${slice.percentage.toFixed(1)}%)`}</title>
                    </path>
                ))}
                {piePathData.length === 1 && (
                     <circle cx="50" cy="50" r="40" fill={piePathData[0].color} />
                )}
                </svg>
            </div>
            <div className="mt-6 w-full grid grid-cols-2 gap-2 text-sm">
                {categoryData.map(item => (
                    <div key={item.name} className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-400 truncate flex-1">{item.name}</span>
                        <span className="text-gray-200 font-medium">{item.percentage.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
             <h3 className="text-lg font-semibold text-gray-300 mb-6">Spending Amounts</h3>
             <div className="space-y-4">
                {categoryData.map((item) => (
                    <div key={item.name} className="group">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{item.name}</span>
                            <span className="text-gray-200 font-mono">{formatAmount(item.value, currency)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div 
                                className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
                                style={{ 
                                    width: `${(item.value / maxBarValue) * 100}%`,
                                    backgroundColor: item.color
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
