
import React, { useState } from 'react';
import { Transaction, CurrencyCode } from './types';
import FileUpload from './components/FileUpload';
import TransactionTable from './components/TransactionTable';
import TransactionSummary from './components/TransactionSummary';
import Loader from './components/Loader';
import AuthScreen from './components/AuthScreen';
import Analytics from './components/Analytics';
import { analyzeStatements } from './services/geminiService';
import { CURRENCIES } from './currency';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [statementFiles, setStatementFiles] = useState<File[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    message: string;
  } | null>(null);

  const handleFileSelect = (files: File[]) => {
    setStatementFiles(files);
    setError(null);
    setTransactions([]);
  };

  const handleProcessStatement = async () => {
    if (statementFiles.length === 0) {
      setError("Please select one or more files first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransactions([]);
    setProgress({ processed: 0, total: statementFiles.length, message: "Starting analysis..." });

    const progressCallback = (processedCount: number, total: number, status: string) => {
        setProgress({ processed: processedCount, total: total, message: status });
    };

    try {
      const result = await analyzeStatements(statementFiles, progressCallback);
      setTransactions(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };
  
  const handleReset = () => {
    setStatementFiles([]);
    setTransactions([]);
    setError(null);
    setIsLoading(false);
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 space-y-4 md:space-y-0">
            <div>
                 <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                    Bank Statement Analyzer
                 </h1>
                 <p className="mt-2 text-sm text-gray-400 max-w-lg">
                    Securely extract, visualize, and analyze your finances.
                 </p>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
                <span className="px-3 text-sm text-gray-400 font-medium">Currency:</span>
                <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="bg-gray-700 text-white text-sm rounded-md px-3 py-1.5 border-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-gray-600 transition-colors"
                >
                    {Object.values(CURRENCIES).map((c) => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                    ))}
                </select>
            </div>
        </header>

        <main className="bg-gray-800/40 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
          {!isLoading && transactions.length === 0 && (
              <div className="flex flex-col items-center space-y-8 py-8">
                <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
                {error && (
                    <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 animate-fade-in text-center max-w-lg">
                        {error}
                    </div>
                )}
                <button
                  onClick={handleProcessStatement}
                  disabled={statementFiles.length === 0 || isLoading}
                  className="w-full sm:w-auto px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  {isLoading ? "Processing..." : "Analyze Statement(s)"}
                </button>
              </div>
          )}

          {isLoading && (
            <div className="py-20">
                <Loader 
                totalFiles={progress?.total}
                processedFiles={progress?.processed}
                statusMessage={progress?.message}
                />
            </div>
          )}
          
          {!isLoading && transactions.length > 0 && (
            <div className="flex flex-col">
                <div className="flex justify-end mb-4">
                     <button
                        onClick={handleReset}
                        className="text-sm text-gray-400 hover:text-white underline decoration-gray-500 hover:decoration-white transition-all"
                     >
                        Upload different statement
                    </button>
                </div>

                <TransactionSummary transactions={transactions} currency={currency} />
                
                <Analytics transactions={transactions} currency={currency} />

                <TransactionTable transactions={transactions} currency={currency} />
            </div>
          )}
        </main>

        <footer className="text-center mt-12 mb-8 text-gray-500 text-xs">
          <p>Powered by Sachin Singh. Data processed in browser memory.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
