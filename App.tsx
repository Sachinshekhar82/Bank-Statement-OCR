
import React, { useState } from 'react';
import { Transaction } from './types';
import FileUpload from './components/FileUpload';
import TransactionTable from './components/TransactionTable';
import TransactionSummary from './components/TransactionSummary';
import Loader from './components/Loader';
import { analyzeStatements } from './services/geminiService';

const App: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            Bank Statement Analyzer
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Upload one or more bank statement pages (PDFs or images) to instantly extract and categorize transactions with Gemini Integration.
          </p>
        </header>

        <main className="bg-gray-800/50 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
          {!isLoading && transactions.length === 0 && (
              <div className="flex flex-col items-center space-y-6">
                <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
                {error && <p className="text-red-400 mt-4 animate-fade-in">{error}</p>}
                <button
                  onClick={handleProcessStatement}
                  disabled={statementFiles.length === 0 || isLoading}
                  className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                  {isLoading ? "Processing..." : "Analyze Statement(s)"}
                </button>
              </div>
          )}

          {isLoading && (
            <Loader 
              totalFiles={progress?.total}
              processedFiles={progress?.processed}
              statusMessage={progress?.message}
            />
          )}
          
          {!isLoading && transactions.length > 0 && (
            <div className="flex flex-col items-center">
                <TransactionSummary transactions={transactions} />
                <TransactionTable transactions={transactions} />
                 <button
                  onClick={handleReset}
                  className="mt-8 px-8 py-3 text-lg font-semibold text-white bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-all duration-300"
                >
                  Analyze Another Statement
                </button>
            </div>
          )}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Sachin Singh.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
