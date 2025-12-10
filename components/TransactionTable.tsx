
import React, { useState, useMemo } from 'react';
import { Transaction, CurrencyCode } from '../types';
import { CopyIcon, CheckIcon, DeleteIcon } from './icons';
import { formatAmount } from '../currency';

interface TransactionTableProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  onDelete: (id: string) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, currency, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
        t.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.Category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.Amount.toString().includes(searchTerm)
    );
  }, [transactions, searchTerm]);

  // Use Tab-Separated Values (TSV) for better compatibility
  const convertToTSV = (data: Transaction[]): string => {
    const headers = Object.keys(data[0]).filter(k => k !== 'id').join('\t');
    const rows = data.map(row => {
      // Exclude ID from export
      const { id, ...rest } = row;
      return Object.values(rest).map(value => {
        const stringValue = String(value).replace(/[\t\n\r]/g, ' ');
        return stringValue;
      }).join('\t')
    });
    return [headers, ...rows].join('\n');
  };

  const handleCopy = () => {
    if (transactions.length > 0) {
      const tableData = convertToTSV(transactions);
      navigator.clipboard.writeText(tableData).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
             <h2 className="text-2xl font-bold text-white">Cashbook Records</h2>
             <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full border border-gray-700">
                {filteredTransactions.length}
             </span>
        </div>
        
        <div className="flex space-x-3 w-full sm:w-auto">
            {/* Search Input */}
            <input 
                type="text" 
                placeholder="Search records..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800/50 border border-gray-700 text-sm rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
            />
            
            <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 whitespace-nowrap"
            disabled={copied}
            >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? 'Export' : 'Export'}</span>
            </button>
        </div>
      </div>

      <div className="overflow-hidden bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-800">
        <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-900/80 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                {['Date', 'Description', 'Amount', 'Category', 'Notes', ''].map((header) => (
                    <th key={header} scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {header}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-white/5 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 font-mono">{transaction.Date}</td>
                    
                    <td className="px-6 py-4 text-sm text-gray-200">
                        <div className="flex items-center space-x-2">
                             <span>{transaction.Description}</span>
                             {transaction.IsSubscription && (
                                 <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                     SUB
                                 </span>
                             )}
                        </div>
                    </td>
                    
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-right ${transaction.Amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatAmount(transaction.Amount, currency)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs border border-gray-700 font-medium">
                            {transaction.Category}
                        </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate group-hover:text-gray-400 transition-colors">
                        {transaction.Notes}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onClick={() => onDelete(transaction.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Record"
                        >
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            
            {filteredTransactions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    No transactions match your search.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
