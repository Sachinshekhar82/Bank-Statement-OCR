
import React, { useState } from 'react';
import { Transaction } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubscription, setIsSubscription] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const numAmount = parseFloat(amount);
    const finalAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      Date: date,
      Description: description,
      Amount: finalAmount,
      Category: category,
      Notes: 'Manual Entry',
      IsSubscription: isSubscription
    };

    onAdd(newTransaction);
    // Reset
    setDescription('');
    setAmount('');
    setCategory('');
    setIsSubscription(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <span>📝</span>
            <span>Add Record</span>
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${type === 'expense' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Cash Out (-)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Cash In (+)
              </button>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Amount</label>
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Description</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Grocery Store, Paycheck"
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Category</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Food"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                </div>
            </div>

            {type === 'expense' && (
                <div className="flex items-center space-x-2 pt-2">
                    <input 
                        type="checkbox" 
                        id="sub" 
                        checked={isSubscription} 
                        onChange={e => setIsSubscription(e.target.checked)}
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="sub" className="text-sm text-gray-400">Recurring Subscription</label>
                </div>
            )}

            <div className="flex space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    Save Record
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryModal;
