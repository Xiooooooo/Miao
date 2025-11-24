
import React, { useMemo, useState } from 'react';
import { Transaction, CategoryItem, Ledger } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Calendar, TrendingDown, TrendingUp, Wallet, Filter, Check, RotateCcw, ArrowRight, Layers } from 'lucide-react';
import { DatePickerModal } from './ui/DatePickerModal';

interface SummaryChartsProps {
  transactions: Transaction[];
  categories: { expense: CategoryItem[]; income: CategoryItem[] };
  ledgers: Ledger[];
}

type TimeRange = 'current_month' | 'prev_month' | 'current_year' | 'all';
type DataType = 'expense' | 'income';
type FilterMode = 'preset' | 'custom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const SummaryCharts: React.FC<SummaryChartsProps> = ({ transactions, categories, ledgers }) => {
  // Mode: Preset (Simple) or Custom (Advanced)
  const [filterMode, setFilterMode] = useState<FilterMode>('preset');

  // Preset State
  const [timeRange, setTimeRange] = useState<TimeRange>('current_month');
  
  // Custom State
  // Initialize with current month's start and today's date in local time YYYY-MM-DD
  const [dateStart, setDateStart] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const offset = firstDay.getTimezoneOffset() * 60000;
    return new Date(firstDay.getTime() - offset).toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Empty = All
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>('all');

  const [pieType, setPieType] = useState<DataType>('expense');

  // Date Picker Modal State
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);

  // Toggle category selection
  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev => 
        prev.includes(catName) 
            ? prev.filter(c => c !== catName) 
            : [...prev, catName]
    );
  };

  // 1. Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Date Filter
      const tDate = new Date(t.date);
      
      let dateMatch = false;

      if (filterMode === 'preset') {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const tMonth = tDate.getMonth();
          const tYear = tDate.getFullYear();

          switch (timeRange) {
            case 'current_month':
              dateMatch = tMonth === currentMonth && tYear === currentYear;
              break;
            case 'prev_month':
              const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              dateMatch = tMonth === prevMonthDate.getMonth() && tYear === prevMonthDate.getFullYear();
              break;
            case 'current_year':
              dateMatch = tYear === currentYear;
              break;
            case 'all':
            default:
              dateMatch = true;
          }
      } else {
          // Custom Range: Compare YYYY-MM-DD strings
          const tDateStr = t.date.split('T')[0]; // Extract YYYY-MM-DD
          dateMatch = tDateStr >= dateStart && tDateStr <= dateEnd;
      }

      if (!dateMatch) return false;

      // Custom Mode Extra Filters
      if (filterMode === 'custom') {
          // Ledger Filter
          if (selectedLedgerId !== 'all' && t.ledgerId !== selectedLedgerId) return false;

          // Category Filter (Only applies if some categories are selected)
          if (selectedCategories.length > 0) {
              if (!selectedCategories.includes(t.category)) return false;
          }
      }

      return true;
    });
  }, [transactions, filterMode, timeRange, dateStart, dateEnd, selectedCategories, selectedLedgerId]);

  // 2. Calculate Totals
  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // 3. Prepare Pie Chart Data
  const categoryData = useMemo(() => {
    const targetTxs = filteredTransactions.filter(t => t.type === pieType);
    const categoryMap: Record<string, number> = {};
    
    targetTxs.forEach(t => {
      const cat = t.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

    return Object.keys(categoryMap)
      .map(key => ({ name: key, value: categoryMap[key] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, pieType]);

  // 4. Prepare Trend Data
  const trendData = useMemo(() => {
    // Determine view granularity (Daily vs Monthly)
    let isYearlyView = false;
    
    if (filterMode === 'preset') {
        isYearlyView = timeRange === 'current_year' || timeRange === 'all';
    } else {
        // Custom: If date range spans more than 60 days, show Monthly view to prevent overcrowding
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        isYearlyView = diffDays > 60;
    }

    const groupMap: Record<string, { name: string, income: number, expense: number, sortKey: number }> = {};

    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';
      let name = '';
      let sortKey = 0;

      if (isYearlyView) {
        key = `${date.getFullYear()}-${date.getMonth()}`;
        name = `${date.getMonth() + 1}月`;
        sortKey = date.getFullYear() * 100 + date.getMonth();
      } else {
        key = t.date.split('T')[0]; // YYYY-MM-DD
        name = `${date.getDate()}日`; // Just Day number for daily view
        sortKey = date.getTime();
      }

      if (!groupMap[key]) {
        groupMap[key] = { name, income: 0, expense: 0, sortKey };
      }

      if (t.type === 'income') groupMap[key].income += t.amount;
      else groupMap[key].expense += t.amount;
    });

    return Object.values(groupMap).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredTransactions, filterMode, timeRange, dateStart, dateEnd]);

  const rangeLabels: Record<TimeRange, string> = {
    current_month: '本月',
    prev_month: '上月',
    current_year: '今年',
    all: '全部'
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up">
      {/* Date Picker Modal */}
      {activeDatePicker && (
          <DatePickerModal 
            title={activeDatePicker === 'start' ? '选择起始日期' : '选择截止日期'}
            initialValue={activeDatePicker === 'start' ? dateStart : dateEnd}
            onClose={() => setActiveDatePicker(null)}
            onSelect={(date) => {
                if(activeDatePicker === 'start') setDateStart(date);
                else setDateEnd(date);
                setActiveDatePicker(null);
            }}
          />
      )}

      {/* Filter Toggle Header */}
      <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">筛选条件</h2>
          <button 
            onClick={() => setFilterMode(filterMode === 'preset' ? 'custom' : 'preset')}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all ${filterMode === 'custom' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
          >
            <Filter className="h-3 w-3" />
            {filterMode === 'preset' ? '开启自定义' : '返回简易模式'}
          </button>
      </div>

      {filterMode === 'preset' ? (
          /* Preset Tabs */
          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 flex shadow-sm">
            {(Object.keys(rangeLabels) as TimeRange[]).map((key) => (
                <button
                    key={key}
                    onClick={() => setTimeRange(key)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        timeRange === key 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {rangeLabels[key]}
                </button>
            ))}
          </div>
      ) : (
          /* Custom Filter Panel */
          <div className="bg-white p-4 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
              {/* Date Range - Styled to match App UI */}
              <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">日期范围</span>
                  </div>
                  <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                    {/* Start Date */}
                    <div 
                        onClick={() => setActiveDatePicker('start')}
                        className="bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-3 flex flex-col justify-center border border-slate-100 transition-all active:scale-95 group"
                    >
                        <span className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                             <Calendar className="h-3 w-3 group-hover:text-indigo-500" /> 起始
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-slate-700 font-mono">
                            {dateStart}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="text-slate-300">
                        <ArrowRight className="h-4 w-4" />
                    </div>

                    {/* End Date */}
                     <div 
                        onClick={() => setActiveDatePicker('end')}
                        className="bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-2xl p-3 flex flex-col justify-center border border-slate-100 transition-all active:scale-95 group"
                     >
                         <span className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                             <Calendar className="h-3 w-3 group-hover:text-indigo-500" /> 截止
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-slate-700 font-mono">
                            {dateEnd}
                        </div>
                    </div>
                  </div>
              </div>

              {/* Ledger Filter */}
              <div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">账本筛选</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setSelectedLedgerId('all')} 
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${selectedLedgerId === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'}`}
                      >
                          <Layers className="h-3.5 w-3.5" /> 全部账本
                      </button>
                      
                      {ledgers.map(l => (
                          <button 
                            key={l.id}
                            onClick={() => setSelectedLedgerId(l.id)} 
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${selectedLedgerId === l.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'}`}
                          >
                              <span>{l.icon}</span> {l.name}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Category Filter Chips */}
              <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">分类筛选 ({selectedCategories.length === 0 ? '全部' : selectedCategories.length})</span>
                    {selectedCategories.length > 0 && (
                        <button onClick={() => setSelectedCategories([])} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-rose-500">
                            <RotateCcw className="h-3 w-3" /> 重置
                        </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {[...categories.expense, ...categories.income].map((cat) => {
                        const isSelected = selectedCategories.includes(cat.name);
                        return (
                            <button
                                key={cat.name}
                                onClick={() => toggleCategory(cat.name)}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                                    isSelected 
                                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                {cat.name}
                                {isSelected && <Check className="h-2.5 w-2.5 ml-1" />}
                            </button>
                        )
                    })}
                  </div>
              </div>
          </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">收入</span>
            <span className="text-sm font-bold text-emerald-500">+{summary.income.toFixed(0)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">支出</span>
            <span className="text-sm font-bold text-rose-500">-{summary.expense.toFixed(0)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${summary.balance >= 0 ? 'bg-yellow-400' : 'bg-slate-400'}`}></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">结余</span>
            <span className={`text-sm font-bold ${summary.balance >= 0 ? 'text-slate-800' : 'text-slate-500'}`}>
                {summary.balance >= 0 ? '+' : ''}{summary.balance.toFixed(0)}
            </span>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 text-slate-300">
             <Calendar className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">该条件下没有记录</p>
         </div>
      ) : (
        <>
            {/* Pie Chart Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {pieType === 'expense' ? <TrendingDown className="h-5 w-5 text-rose-500"/> : <TrendingUp className="h-5 w-5 text-emerald-500"/>}
                        {pieType === 'expense' ? '支出构成' : '收入来源'}
                    </h3>
                    
                    {/* Switcher */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button 
                            onClick={() => setPieType('expense')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${pieType === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
                        >
                            支出
                        </button>
                        <button 
                            onClick={() => setPieType('income')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${pieType === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                        >
                            收入
                        </button>
                    </div>
                </div>

                {categoryData.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-40 h-40 relative flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className={`text-xs font-bold ${pieType === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {((categoryData[0].value / (pieType === 'expense' ? summary.expense : summary.income)) * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        
                        {/* Custom Legend */}
                        <div className="flex-1 w-full space-y-2">
                            {categoryData.slice(0, 5).map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                        <span className="text-slate-600 font-medium">{entry.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-800 font-bold">¥{entry.value.toFixed(0)}</span>
                                        <span className="text-slate-400 text-[10px] w-8 text-right">
                                            {((entry.value / (pieType === 'expense' ? summary.expense : summary.income)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-slate-300 text-xs">暂无{pieType === 'expense' ? '支出' : '收入'}数据</div>
                )}
            </div>

            {/* Trend Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-indigo-500"/>
                    收支趋势
                </h3>
                <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} barSize={12} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                tick={{fontSize: 10, fill: '#94a3b8'}} 
                                axisLine={false} 
                                tickLine={false}
                                interval={'preserveStartEnd'}
                            />
                            <YAxis 
                                tick={{fontSize: 10, fill: '#94a3b8'}} 
                                axisLine={false} 
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="income" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} name="收入" />
                            <Bar dataKey="expense" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="支出" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
