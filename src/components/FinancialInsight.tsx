import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { Bot, Send, Sparkles, X, MessageCircleQuestion } from 'lucide-react';
import { Button } from './ui/Button';

interface FinancialInsightProps {
  transactions: Transaction[];
}

const SUGGESTIONS = [
    "📅 上周总共花了多少？",
    "🍔 昨天吃饭花了多少钱？",
    "💰 我最近最大的一笔支出是什么？",
    "🥤 我上个月喝了几次奶茶？",
];

export const FinancialInsight: React.FC<FinancialInsightProps> = ({ transactions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Chat history: simple array of { role, text }
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages, isLoading]);

  const handleAsk = async (textOverride?: string) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setQuery('');
    setIsLoading(true);

    // Call API
    const answer = await getFinancialInsights(transactions, textToSend);
    
    // Add AI message
    setMessages(prev => [...prev, { role: 'ai', text: answer }]);
    setIsLoading(false);
  };

  // Initial greeting
  useEffect(() => {
      if (isOpen && messages.length === 0) {
          setMessages([{ role: 'ai', text: "喵～我是你的记账小助手！想问我什么都可以哦，比如“我上周五花了多少钱？” 😺" }]);
      }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 bg-indigo-600 text-white p-3.5 rounded-full shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 z-50 hover:scale-105 active:scale-95 group"
      >
        <div className="bg-white/20 p-1 rounded-full">
            <Bot className="h-6 w-6" />
        </div>
        <span className="font-bold text-sm pr-1">AI 查账</span>
        
        {/* Tooltip hint - Adjusted for left side */}
        <div className="absolute left-0 bottom-full mb-3 hidden group-hover:block w-32">
            <div className="bg-slate-800 text-white text-xs rounded-lg py-1 px-2 text-center shadow-lg relative">
                试试问我花了多少钱?
                <div className="absolute top-full left-6 -mt-1 border-4 border-transparent border-t-slate-800"></div>
            </div>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 w-[90vw] max-w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-fade-in-up h-[500px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>
            <div>
                <h3 className="font-bold text-sm">Miao 智能助手</h3>
                <p className="text-[10px] text-indigo-100 opacity-80">基于 Gemini AI</p>
            </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                }`}>
                    {msg.text}
                </div>
            </div>
        ))}
        
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                    <span className="text-xs text-slate-400">思考中...</span>
                </div>
            </div>
        )}
      </div>

      {/* Suggestion Chips */}
      {messages.length < 3 && !isLoading && (
          <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleAsk(s)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-indigo-100 rounded-full text-xs text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-1"
                  >
                      <MessageCircleQuestion className="h-3 w-3" />
                      {s}
                  </button>
              ))}
          </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-slate-100 bg-white shrink-0">
        <div className="flex gap-2 items-center bg-slate-100 rounded-2xl p-1 pr-1.5">
            <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                }
            }}
            placeholder="问问我某天的开销..."
            className="flex-1 text-sm px-3 py-2 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
            />
            <Button 
                onClick={() => handleAsk()} 
                disabled={isLoading || !query.trim()} 
                className={`!p-2 !w-8 !h-8 !rounded-xl transition-all ${query.trim() ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
};