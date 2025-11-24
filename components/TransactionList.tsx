
import React, { useMemo } from 'react';
import { Transaction, Ledger } from '../types';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/Button';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  ledgers: Ledger[];
  showLedgerBadge?: boolean;
}

// Helper to format date nicely (e.g. "3月15日 星期五")
const formatDateHeader = (dateStr: string) => {
    // Handle split for YYYY-MM-DD grouping from potential ISO string
    const safeDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const date = new Date(safeDateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 ${weekday}`;
};

// Helper to format full timestamp (YYYY-MM-DD HH:mm:ss)
const formatFullTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if(isNaN(d.getTime())) return dateStr;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit, ledgers, showLedgerBadge }) => {
  // Map ledger IDs to names/icons for quick lookup
  const ledgerMap = useMemo(() => {
      const map: Record<string, Ledger> = {};
      ledgers.forEach(l => map[l.id] = l);
      return map;
  }, [ledgers]);

  // Group transactions by date (Day)
  const groupedData = useMemo(() => {
    const groups: Record<string, { txs: Transaction[], income: number, expense: number }> = {};
    
    transactions.forEach(t => {
        // Extract YYYY-MM-DD for grouping
        const dateKey = t.date.includes('T') ? t.date.split('T')[0] : t.date;
        
        if (!groups[dateKey]) {
            groups[dateKey] = { txs: [], income: 0, expense: 0 };
        }
        groups[dateKey].txs.push(t);
        if (t.type === 'income') groups[dateKey].income += t.amount;
        else groups[dateKey].expense += t.amount;
    });

    // Sort dates descending
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-24 h-24 bg-slate-100 rounded-full mb-4 flex items-center justify-center text-4xl">
            😽
        </div>
        <p>还没有账单哦，快记一笔吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
        {groupedData.map(([date, data]) => (
            <div key={date}>
                {/* Date Header */}
                <div className="flex justify-between items-end px-2 mb-2">
                    <span className="text-slate-500 text-xs font-medium">{formatDateHeader(date)}</span>
                    <div className="text-xs text-slate-400 flex gap-3">
                        {data.income > 0 && <span>收: {data.income.toFixed(2)}</span>}
                        {data.expense > 0 && <span>支: {data.expense.toFixed(2)}</span>}
                    </div>
                </div>

                {/* Cards Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {data.txs.sort((a,b) => {
                        // Sort by date string if full ISO, or createAt fallback
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }).map((t, index) => {
                        const ledger = ledgerMap[t.ledgerId];
                        return (
                        <div 
                            key={t.id} 
                            onClick={() => onEdit(t)}
                            className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group active:scale-[0.99] transform duration-100 ${index !== data.txs.length - 1 ? 'border-b border-slate-50' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.type === 'income' ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                                    {/* Placeholder emojis based on category or type */}
                                    {t.type === 'income' ? '💰' : '🏷️'}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                                        {t.subCategory ? (
                                            <>
                                                <span>{t.subCategory}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">({t.category})</span>
                                            </>
                                        ) : (
                                            t.category
                                        )}
                                        {showLedgerBadge && ledger && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                {ledger.icon} {ledger.name}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        <p className="text-[10px] text-slate-300 font-medium tracking-tight font-mono">
                                            {formatFullTime(t.date)}
                                        </p>
                                        {t.note && <p className="text-xs text-slate-400">{t.note}</p>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`font-bold text-base ${t.type === 'income' ? 'text-yellow-600' : 'text-slate-800'}`}>
                                    {t.type === 'income' ? '+' : ''}{t.amount.toFixed(2)}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(t.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity !p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        ))}
    </div>
  );
};
