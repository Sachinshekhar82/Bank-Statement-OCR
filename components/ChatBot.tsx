
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { createFinancialChat } from '../services/geminiService';
import { ChatBubbleIcon, SendIcon, XIcon, ChartIcon, MicIcon } from './icons';
import { Chat, GenerateContentResponse } from "@google/genai";

interface ChatBotProps {
  transactions: Transaction[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ transactions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize or Reset Chat Session when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
        try {
            chatSessionRef.current = createFinancialChat(transactions);
            setMessages([{ role: 'model', text: "Hello! I've analyzed your new transaction data. Ask me anything about your spending, specific dates, or categories." }]);
        } catch (e) {
            console.error("Failed to init chat", e);
        }
    }
  }, [transactions]);

  // Setup Speech Recognition
  useEffect(() => {
    // Browser support check
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
      };
      
      recognitionRef.current.onerror = (event: any) => {
         console.error("Speech Error", event.error);
         setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
        const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userMessage });
        const responseText = response.text || "I couldn't process that request.";
        
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
        console.error("Chat Error:", error);
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the AI." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
        alert("Voice input is not supported in this browser.");
        return;
    }
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  if (transactions.length === 0) return null;

  return (
    <>
        {/* Toggle Button */}
        {!isOpen && (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 border border-white/20 group"
            >
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                <ChatBubbleIcon className="w-8 h-8 text-white" />
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Ask AI Assistant
                </span>
            </button>
        )}

        {/* Chat Window */}
        <div 
            className={`fixed bottom-6 right-6 z-50 w-full max-w-[400px] bg-[#0f111a] border border-gray-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 transform origin-bottom-right ${
                isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
            }`}
            style={{ maxHeight: 'min(600px, 80vh)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50 rounded-t-2xl backdrop-blur-md">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <ChartIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">FinAI Assistant</h3>
                        <p className="text-[10px] text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            Online • Gemini 3.0 Pro
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent bg-gray-900/80">
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700 markdown-prose'
                            }`}
                        >
                            {msg.role === 'model' ? (
                                <div dangerouslySetInnerHTML={{ 
                                    __html: msg.text
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                                        .replace(/\n/g, '<br/>') // Line breaks
                                }} />
                            ) : msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700 flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 rounded-b-2xl">
                <div className="relative">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={isListening ? "Listening... Speak now." : "Ask about your spending..."}
                        className={`w-full bg-gray-800 text-white pl-4 pr-20 py-3 rounded-xl border ${isListening ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'} outline-none placeholder-gray-500 text-sm transition-all`}
                        disabled={isLoading}
                    />

                    {/* Mic Button */}
                    <button
                        onClick={toggleMic}
                        className={`absolute right-10 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                            isListening ? 'text-red-500 hover:bg-red-500/10 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title="Use Microphone"
                    >
                         <MicIcon className="w-4 h-4" />
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                    >
                        <SendIcon className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[10px] text-gray-600 text-center mt-2">
                    AI can make mistakes. Verify important financial data.
                </p>
            </div>
        </div>
    </>
  );
};

export default ChatBot;
