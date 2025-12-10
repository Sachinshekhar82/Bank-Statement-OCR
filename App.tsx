
import React, { useState, useEffect } from 'react';
import { Transaction, CurrencyCode } from './types';
import FileUpload from './components/FileUpload';
import TransactionTable from './components/TransactionTable';
import TransactionSummary from './components/TransactionSummary';
import Loader from './components/Loader';
import AuthScreen from './components/AuthScreen';
import Analytics from './components/Analytics';
import ManualEntryModal from './components/ManualEntryModal';
import NavBar from './components/NavBar';
import { analyzeStatements, generateFinancialInsights } from './services/geminiService';
import { CURRENCIES } from './currency';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // UI States
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  
  // Analysis States
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    message: string;
  } | null>(null);

  // Persistence: Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('cashbook_transactions');
    if (saved) {
        try {
            setTransactions(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load saved transactions");
        }
    }
  }, []);

  // Persistence: Save on change
  useEffect(() => {
    if (transactions.length > 0) {
        localStorage.setItem('cashbook_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  // Scroll Spy for Active Section
  useEffect(() => {
      const handleScroll = () => {
          const sections = ['overview', 'analytics', 'records'];
          for (const section of sections) {
              const element = document.getElementById(section);
              if (element) {
                  const rect = element.getBoundingClientRect();
                  if (rect.top >= 0 && rect.top < 300) {
                      setActiveSection(section);
                      break;
                  }
              }
          }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleManualAdd = (newTransaction: Transaction) => {
    setTransactions(prev => [...prev, newTransaction].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()));
  };

  const handleDelete = (id: string) => {
    if(confirm("Are you sure you want to delete this record?")) {
        setTransactions(prev => {
            const updated = prev.filter(t => t.id !== id);
            localStorage.setItem('cashbook_transactions', JSON.stringify(updated));
            return updated;
        });
    }
  };

  const handleProcessStatement = async (files: File[]) => {
    setIsLoading(true);
    setIsImporting(false); // Close upload UI
    setError(null);
    setProgress({ processed: 0, total: files.length, message: "Starting analysis..." });

    const progressCallback = (processedCount: number, total: number, status: string) => {
        setProgress({ processed: processedCount, total: total, message: status });
    };

    try {
      const newTransactions = await analyzeStatements(files, progressCallback);
      
      // Merge new transactions with existing ones
      setTransactions(prev => {
         const combined = [...prev, ...newTransactions];
         // Sort by date desc
         return combined.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
      });
      
      // Generate insights on the NEW batch or total? Let's do total for better context
      setIsGeneratingInsights(true);
      const allData = [...transactions, ...newTransactions];
      generateFinancialInsights(allData).then(text => {
          setInsights(text);
          setIsGeneratingInsights(false);
      });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      console.error(err);
      setIsGeneratingInsights(false);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleClearAll = () => {
      if(confirm("This will wipe all local data. Are you sure?")) {
          localStorage.removeItem('cashbook_transactions');
          setTransactions([]);
          setInsights('');
      }
  };

  const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
          const offset = 100; // Account for sticky nav
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
      
          window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
          });
          setActiveSection(id);
      }
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Dynamic Background Mesh */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 space-y-4 md:space-y-0">
            <div>
                 <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 tracking-tight drop-shadow-sm">
                    FinAI Cashbook
                 </h1>
                 <p className="mt-2 text-sm text-gray-400 max-w-lg font-light tracking-wide">
                    Smart Ledger & Statement Analyzer
                 </p>
            </div>
            
            <div className="flex items-center space-x-4">
                {transactions.length > 0 && (
                     <button 
                        onClick={handleClearAll}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                     >
                        Clear All Data
                     </button>
                )}
                <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-md p-1.5 rounded-xl border border-gray-700/50 shadow-lg">
                    <span className="px-3 text-xs text-gray-400 uppercase tracking-wider font-bold">Currency</span>
                    <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        className="bg-gray-700/50 text-white text-sm rounded-lg px-3 py-1.5 border-none focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer hover:bg-gray-600/50 transition-colors font-mono"
                    >
                        {Object.values(CURRENCIES).map((c) => (
                            <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                        ))}
                    </select>
                </div>
            </div>
        </header>

        {/* Sticky Navigation Bar */}
        {!isLoading && transactions.length > 0 && (
            <NavBar onNavigate={scrollToSection} activeSection={activeSection} />
        )}

        <main className="space-y-12">
            {/* Toolbar / Actions */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="flex-1 min-w-[200px] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                    <span className="text-xl">+</span>
                    <span>Add Manual Entry</span>
                </button>
                
                <button
                    onClick={() => setIsImporting(!isImporting)}
                    className="flex-1 min-w-[200px] py-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl shadow-lg border border-gray-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                    <span>📄</span>
                    <span>Import Statement (OCR)</span>
                </button>
            </div>

            {/* Import Area (Collapsible) */}
            {isImporting && (
                <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl p-8 animate-fade-in relative">
                    <button 
                        onClick={() => setIsImporting(false)} 
                        className="absolute top-4 right-4 text-gray-500 hover:text-white"
                    >
                        ✕
                    </button>
                    <h3 className="text-xl font-bold text-white mb-4">Import Bank Statement</h3>
                    <FileUpload onFileSelect={(files) => handleProcessStatement(files)} disabled={isLoading} />
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-center">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                 <div className="py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
                    <Loader 
                        totalFiles={progress?.total}
                        processedFiles={progress?.processed}
                        statusMessage={progress?.message}
                    />
                 </div>
            )}

            {/* Main Content Area */}
            {!isLoading && transactions.length > 0 && (
                <>
                    {/* Top Row: Summary & Insights */}
                    <section id="overview" className="scroll-mt-32">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <TransactionSummary transactions={transactions} currency={currency} />
                            </div>
                            
                            {/* AI Insights Card */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-lg relative overflow-hidden flex flex-col h-full">
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                                    <span>AI Financial Insights</span>
                                </h3>
                                <div className="text-sm text-indigo-100 leading-relaxed flex-1">
                                    {isGeneratingInsights ? (
                                        <div className="flex items-center space-x-2 text-indigo-300 animate-pulse">
                                            <span>Analyzing your new data...</span>
                                        </div>
                                    ) : insights ? (
                                        <div className="markdown-prose">
                                        {insights.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                                        </div>
                                    ) : (
                                        <p className="text-indigo-400 italic">Import more data to generate new insights.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section id="analytics" className="scroll-mt-32">
                         <Analytics transactions={transactions} currency={currency} />
                    </section>

                    <section id="records" className="scroll-mt-32">
                        <TransactionTable 
                            transactions={transactions} 
                            currency={currency} 
                            onDelete={handleDelete}
                        />
                    </section>
                </>
            )}

            {!isLoading && transactions.length === 0 && !isImporting && (
                <div className="text-center py-20 opacity-50">
                    <p className="text-2xl font-bold text-gray-500">Your cashbook is empty.</p>
                    <p className="text-gray-600 mt-2">Add a manual entry or import a statement to get started.</p>
                </div>
            )}
        </main>

        <ManualEntryModal 
            isOpen={isManualModalOpen} 
            onClose={() => setIsManualModalOpen(false)}
            onAdd={handleManualAdd}
        />

        <footer className="text-center mt-20 mb-8 text-gray-600 text-xs tracking-wider uppercase">
          <p>Secured by Gemini AI • Powered by Sachin Singh</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
