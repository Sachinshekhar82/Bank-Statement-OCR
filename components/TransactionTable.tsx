import React, { useState } from 'react';
import { Transaction } from '../types';
import { CopyIcon, CheckIcon } from './icons';

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [copied, setCopied] = useState(false);

  // Use Tab-Separated Values (TSV) for better compatibility with spreadsheet software when pasting.
  const convertToTSV = (data: Transaction[]): string => {
    const headers = Object.keys(data[0]).join('\t');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        // Sanitize string to remove characters that would break TSV formatting.
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
    <div className="w-full mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-100">Extracted Transactions</h2>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          disabled={copied}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? 'Copied!' : 'Copy Table'}</span>
        </button>
      </div>
      <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              {Object.keys(transactions[0]).map((header) => (
                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {transactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-gray-700/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{transaction.Date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.Description}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono text-right ${transaction.Amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {transaction.Amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.Category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{transaction.Notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;