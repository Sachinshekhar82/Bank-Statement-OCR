
import React, { useMemo } from 'react';
import { Transaction, CurrencyCode } from '../types';
import { formatAmount } from '../currency';
import { ChartIcon } from './icons';

interface AnalyticsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#14b8a6'];

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
    <div className="w-full space-y-6 animate-fade-in mt-12">
      <div className="flex items-center space-x-3 px-2">
        <ChartIcon className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Visual Breakdown</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-800 shadow-xl flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 self-start">Category Distribution</h3>
            <div className="relative w-64 h-64 drop-shadow-2xl">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {piePathData.map((slice, i) => (
                    <path
                        key={slice.name}
                        d={slice.path}
                        fill={slice.color}
                        stroke="#0f111a"
                        strokeWidth="2"
                        className="hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                    >
                        <title>{`${slice.name}: ${formatAmount(slice.value, currency)} (${slice.percentage.toFixed(1)}%)`}</title>
                    </path>
                ))}
                {piePathData.length === 1 && (
                     <circle cx="50" cy="50" r="40" fill={piePathData[0].color} />
                )}
                </svg>
                {/* Center Hole for Donut Chart Look */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 bg-[#0f111a] rounded-full flex items-center justify-center border border-gray-800">
                        <span className="text-xs text-gray-500 font-mono">EXPENSES</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 w-full grid grid-cols-2 gap-3 text-xs">
                {categoryData.slice(0, 6).map(item => (
                    <div key={item.name} className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-400 truncate flex-1">{item.name}</span>
                        <span className="text-gray-200 font-bold">{item.percentage.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Vertical Bar Chart */}
        <div className="bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Spending Intensity</h3>
             
             <div className="flex-1 flex items-end space-x-2 sm:space-x-4 h-full pt-10 pb-6 px-2">
                {categoryData.slice(0, 8).map((item) => (
                    <div key={item.name} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                        {/* Bar */}
                        <div 
                            className="w-full max-w-[30px] sm:max-w-[40px] rounded-t-md transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:brightness-110 cursor-pointer"
                            style={{ 
                                height: `${Math.max((item.value / maxBarValue) * 100, 2)}%`,
                                backgroundColor: item.color
                            }}
                        >
                             {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                                <div className="bg-gray-800/95 backdrop-blur border border-gray-600 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap text-center">
                                    <div className="font-bold mb-0.5">{item.name}</div>
                                    <div className="font-mono text-purple-300">{formatAmount(item.value, currency)}</div>
                                    <div className="text-[10px] text-gray-400">{item.percentage.toFixed(1)}%</div>
                                    
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-600"></div>
                                </div>
                            </div>
                        </div>

                        {/* X-Axis Label */}
                        <p className="mt-3 text-[10px] sm:text-xs text-gray-500 font-medium truncate w-full text-center">
                            {item.name}
                        </p>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
