
import React, { useState } from 'react';
import { Transaction, CurrencyCode } from '../types';
import { CopyIcon, CheckIcon } from './icons';
import { formatAmount } from '../currency';

interface TransactionTableProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, currency }) => {
  const [copied, setCopied] = useState(false);

  // Use Tab-Separated Values (TSV) for better compatibility
  const convertToTSV = (data: Transaction[]): string => {
    const headers = Object.keys(data[0]).join('\t');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        const stringValue = String(value).replace(/[\t\n\r]/g, ' ');
        return stringValue;
      }).join('\t')
    );
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
    <div className="w-full mt-12 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Details</h2>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200"
          disabled={copied}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? 'Copied' : 'Copy Data'}</span>
        </button>
      </div>
      <div className="overflow-hidden bg-gray-800 rounded-xl shadow-xl border border-gray-700">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
                <tr>
                {Object.keys(transactions[0]).map((header) => (
                    <th key={header} scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {header}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-800">
                {transactions.map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-700/30 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{transaction.Date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.Description}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-right ${transaction.Amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatAmount(transaction.Amount, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs border border-gray-600">
                            {transaction.Category}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{transaction.Notes}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
