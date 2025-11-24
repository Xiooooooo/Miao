import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionFormData, CategoryItem, Ledger } from './types';
import { loadTransactions, saveTransactions, loadBudget, saveBudget, loadCategories, saveCategories, loadLedgers, saveLedgers, DEFAULT_LEDGERS, getAllData, restoreData, AppData } from './services/storage';
import { cloudService } from './services/cloudService';
import { SmartEntry } from './components/SmartEntry';
import { TransactionList } from './components/TransactionList';
import { SummaryCharts } from './components/SummaryCharts';
import { FinancialInsight } from './components/FinancialInsight';
import { Button } from './components/ui/Button';
import { Plus, List, PieChart, User, FileText, Download, Upload, Wallet, Calendar, ChevronLeft, ChevronDown, Check, Trash2, X, Pencil, MoreHorizontal, Cloud } from 'lucide-react';
import { DEFAULT_CATEGORIES } from './constants';
import { DatePickerModal } from './components/ui/DatePickerModal';
import { CategoryModal } from './components/ui/CategoryModal';
import { LedgerModal } from './components/ui/LedgerModal';
import { CloudSettingsModal } from './components/ui/CloudSettingsModal';

// --- Constants & Helpers ---

const getCurrentDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
};

// --- Sub-Components ---

// 1. Budget Card Component
const BudgetCard: React.FC<{ 
    budget: number; 
    currentExpense: number; 
    onSetBudget: () => void;
    ledgerName: string;
}> = ({ budget, currentExpense, onSetBudget, ledgerName }) => {
    const percent = budget > 0 ? Math.min((currentExpense / budget) * 100, 100) : 0;
    const remaining = budget - currentExpense;
    const isOverBudget = remaining < 0;

    if (budget === 0) {
        return (
            <div 
                onClick={onSetBudget}
                className="bg-slate-900 text-white p-5 rounded-3xl mb-6 shadow-lg shadow-slate-200 cursor-pointer relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet className="h-24 w-24 -mr-4 -mt-4" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <Wallet className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold text-sm">本月预算 ({ledgerName})</span>
                </div>
                <p className="text-slate-400 text-sm mb-1">点击设置预算，开启财务规划</p>
                <p className="text-2xl font-bold">未设置</p>
            </div>
        );
    }

    return (
        <div 
            onClick={onSetBudget}
            className="bg-slate-900 text-white p-5 rounded-3xl mb-6 shadow-lg shadow-slate-200 cursor-pointer relative overflow-hidden"
        >
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="h-24 w-24 -mr-4 -mt-4" />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-400 text-xs font-medium mb-1">本月剩余</p>
                        <h2 className={`text-2xl font-bold ${isOverBudget ? 'text-rose-400' : 'text-white'}`}>
                            {remaining.toFixed(2)}
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-xs font-medium mb-1">本月预算 ({ledgerName})</p>
                        <p className="text-sm font-semibold">{budget.toFixed(2)}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-yellow-400'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-slate-500">已用 {(percent).toFixed(0)}%</span>
                    <span className="text-slate-500 text-[10px]">支出 {currentExpense.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

// 2. Profile/Docs Component with Data Management
const ProfileTab: React.FC<{ 
    transactions: Transaction[]; 
    onImport: (data: Transaction[]) => void;
    categories: { expense: CategoryItem[]; income: CategoryItem[] };
    onDeleteCategory: (type: 'expense' | 'income', name: string) => void;
    ledgers: Ledger[];
    onDeleteLedger: (id: string) => void;
    onEditLedger: (ledger: Ledger) => void;
    onOpenCloud: () => void;
}> = ({ transactions, onImport, categories, onDeleteCategory, ledgers, onDeleteLedger, onEditLedger, onOpenCloud }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const dataStr = JSON.stringify(transactions, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `miao_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target?.result as string);
                if (Array.isArray(importedData)) {
                    // Simple validation could go here
                    onImport(importedData);
                    alert("数据导入成功！");
                } else {
                    alert("文件格式不正确");
                }
            } catch (err) {
                alert("解析文件失败");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 space-y-6 pb-24 animate-fade-in-up">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                    <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                    <h2 className="text-lg font-bold text-slate-800">Miao记账</h2>
                    <p className="text-xs text-slate-400">简单、可爱的 AI 记账本</p>
                    </div>
                </div>
                
                {/* Cloud Sync Section */}
                <div className="mb-8">
                     <button 
                        onClick={onOpenCloud}
                        className="w-full flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Cloud className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                                <span className="font-bold text-sm block">云端同步 (Beta)</span>
                                <span className="text-[10px] text-blue-100 block">多设备实时备份与同步</span>
                            </div>
                        </div>
                        <div className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold">
                            配置
                        </div>
                    </button>
                </div>

                {/* Ledger Management */}
                <div className="space-y-3 mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">账本管理</h3>
                    <div className="bg-slate-50 rounded-2xl p-4 max-h-52 overflow-y-auto">
                        <div className="flex flex-col gap-2">
                            {ledgers.map(l => (
                                <div key={l.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{l.icon}</span>
                                        <span className="text-sm font-bold text-slate-700">{l.name}</span>
                                        {l.isDefault && <span className="text-[10px] bg-slate-100 text-slate-400 px-1 rounded">默认</span>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onEditLedger(l)} className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        {!l.isDefault && (
                                            <button onClick={() => onDeleteLedger(l.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Category Management */}
                <div className="space-y-3 mb-8">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">分类管理</h3>
                     <div className="bg-slate-50 rounded-2xl p-4 max-h-60 overflow-y-auto">
                        {/* Expense Cats */}
                        <div className="mb-4">
                            <span className="text-[10px] text-slate-400 font-bold block mb-2">支出分类</span>
                            <div className="flex flex-wrap gap-2">
                                {categories.expense.map(cat => (
                                    <div key={cat.name} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 text-xs text-slate-600 shadow-sm">
                                        <span>{cat.icon}</span>
                                        <span>{cat.name}</span>
                                        <button onClick={() => onDeleteCategory('expense', cat.name)} className="text-slate-300 hover:text-rose-500 ml-1">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Income Cats */}
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold block mb-2">收入分类</span>
                            <div className="flex flex-wrap gap-2">
                                {categories.income.map(cat => (
                                    <div key={cat.name} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 text-xs text-slate-600 shadow-sm">
                                        <span>{cat.icon}</span>
                                        <span>{cat.name}</span>
                                        <button onClick={() => onDeleteCategory('income', cat.name)} className="text-slate-300 hover:text-rose-500 ml-1">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">本地备份</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleExport}
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors"
                        >
                            <Download className="h-6 w-6 text-slate-600 mb-2" />
                            <span className="text-sm font-medium text-slate-700">导出 JSON</span>
                        </button>
                        <button 
                            onClick={handleImportClick}
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors"
                        >
                            <Upload className="h-6 w-6 text-slate-600 mb-2" />
                            <span className="text-sm font-medium text-slate-700">导入 JSON</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".json" 
                            className="hidden" 
                        />
                    </div>
                </div>
            </div>

            {/* PRD Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 opacity-80">
                <h3 className="text-sm font-bold text-slate-900 mb-2">关于应用</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Miao记账 是一款参考“咔皮记账”风格开发的个人记账工具。
                    核心特点包括 Gemini AI 智能语义解析、完全本地化的数据存储以及可爱圆润的 UI 设计。
                </p>
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [categories, setCategories] = useState<{ expense: CategoryItem[]; income: CategoryItem[] }>(DEFAULT_CATEGORIES);
  const [ledgers, setLedgers] = useState<Ledger[]>(DEFAULT_LEDGERS);

  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'profile'>('home');
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  
  const [categoryModalContext, setCategoryModalContext] = useState<{ isOpen: boolean, parent?: CategoryItem }>({ isOpen: false });
  const [ledgerModalState, setLedgerModalState] = useState<{ isOpen: boolean; editingLedger?: Ledger }>({ isOpen: false });

  const [isLedgerMenuOpen, setIsLedgerMenuOpen] = useState(false);
  const [isEntryLedgerMenuOpen, setIsEntryLedgerMenuOpen] = useState(false);
  const [viewingParentCategory, setViewingParentCategory] = useState<CategoryItem | null>(null);
  const [activeLedgerId, setActiveLedgerId] = useState<string>(DEFAULT_LEDGERS[0].id);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // Cloud Sync UI State
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  // Auto Sync Debounce Timer
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    type: 'expense',
    category: '餐饮',
    subCategory: undefined,
    date: getCurrentDateTimeLocal(),
    note: '',
    ledgerId: DEFAULT_LEDGERS[0].id
  });

  // Load Data on Mount & Try Cloud Sync
  useEffect(() => {
    setTransactions(loadTransactions());
    setBudget(loadBudget());
    setCategories(loadCategories());
    const loadedLedgers = loadLedgers();
    setLedgers(loadedLedgers);
    if(loadedLedgers.length > 0) setActiveLedgerId(loadedLedgers[0].id);

    // Initial Cloud Fetch
    handleCloudSync(true); // download only
  }, []);

  // --- Persistence & Auto Cloud Sync ---
  // Whenever any data changes, save to local AND trigger auto-cloud-sync
  useEffect(() => {
    saveTransactions(transactions);
    triggerAutoSync();
  }, [transactions]);

  useEffect(() => {
    saveBudget(budget);
    triggerAutoSync();
  }, [budget]);

  useEffect(() => {
      saveCategories(categories);
      triggerAutoSync();
  }, [categories]);
  
  useEffect(() => {
      saveLedgers(ledgers);
      triggerAutoSync();
  }, [ledgers]);

  // Sync Logic
  const triggerAutoSync = () => {
      if (!cloudService.isConfigured()) return;
      
      // Debounce sync requests to avoid hammering the DB
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      
      syncTimerRef.current = setTimeout(() => {
          handleCloudSync(false); // upload
      }, 2000); // Sync after 2 seconds of inactivity
  };

  const handleCloudSync = async (downloadOnly: boolean = false) => {
      if (!cloudService.isConfigured()) return;

      try {
          const user = await cloudService.getUser();
          if (!user) return; // Not logged in

          if (downloadOnly) {
              const cloudData = await cloudService.downloadData();
              if (cloudData) {
                  // Apply Cloud Data to State
                  if(cloudData.transactions) setTransactions(cloudData.transactions);
                  if(cloudData.budget) setBudget(cloudData.budget);
                  if(cloudData.categories) setCategories(cloudData.categories);
                  if(cloudData.ledgers) setLedgers(cloudData.ledgers);
                  // Also update LocalStorage
                  restoreData(cloudData);
                  showToast("已同步云端数据");
              }
          } else {
              // Upload
              const currentData = getAllData();
              await cloudService.uploadData(currentData);
              // console.log("Auto synced to cloud");
          }
      } catch (e) {
          console.error("Sync error", e);
      }
  };


  // Helper to show toast
  const showToast = (message: string) => {
      setToast({ message });
      setTimeout(() => setToast(null), 3000);
  };

  // Calculations for Budget
  const currentMonthExpense = React.useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return transactions
        .filter(t => {
            if (!t.date.startsWith(currentMonthPrefix)) return false;
            if (t.type !== 'expense') return false;
            if (activeLedgerId !== 'all' && t.ledgerId !== activeLedgerId) return false;
            return true;
        })
        .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, activeLedgerId]);

  // Filtered transactions for viewing
  const viewTransactions = React.useMemo(() => {
      if (activeLedgerId === 'all') return transactions;
      return transactions.filter(t => t.ledgerId === activeLedgerId);
  }, [transactions, activeLedgerId]);

  const activeLedger = ledgers.find(l => l.id === activeLedgerId);

  // Unified create transaction logic
  const createTransaction = (data: TransactionFormData) => {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) return false;

      const newTx: Transaction = {
        id: uuidv4(),
        amount,
        type: data.type,
        category: data.category,
        subCategory: data.subCategory,
        date: data.date,
        note: data.note,
        ledgerId: data.ledgerId,
        createdAt: Date.now()
      };

      setTransactions(prev => [newTx, ...prev]);
      return true;
  };

  // Update existing transaction
  const updateTransaction = (id: string, data: TransactionFormData) => {
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) return false;

    setTransactions(prev => prev.map(t => {
        if (t.id === id) {
            return {
                ...t,
                amount,
                type: data.type,
                category: data.category,
                subCategory: data.subCategory,
                date: data.date,
                note: data.note,
                ledgerId: data.ledgerId,
            };
        }
        return t;
    }));
    return true;
  };

  const handleManualSubmit = () => {
    if (editingTransaction) {
        if(updateTransaction(editingTransaction.id, formData)) {
            setIsManualFormOpen(false);
            resetForm();
            showToast('修改成功！');
        }
    } else {
        if(createTransaction(formData)) {
            setIsManualFormOpen(false);
            resetForm();
            showToast('记账成功！');
        }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category: '餐饮', // Default
      subCategory: undefined,
      date: getCurrentDateTimeLocal(),
      note: '',
      ledgerId: activeLedgerId === 'all' ? ledgers[0].id : activeLedgerId
    });
    setViewingParentCategory(null);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
        amount: t.amount.toString(),
        type: t.type,
        category: t.category,
        subCategory: t.subCategory,
        date: t.date,
        note: t.note,
        ledgerId: t.ledgerId
    });
    
    // If it has a sub-category, try to find the parent category object to open the drill-down view
    if (t.subCategory) {
        const catList = t.type === 'expense' ? categories.expense : categories.income;
        const parent = catList.find(c => c.name === t.category);
        if (parent) {
            setViewingParentCategory(parent);
        }
    } else {
        setViewingParentCategory(null);
    }

    setIsManualFormOpen(true);
  };

  const handleSmartEntrySuccess = (data: Partial<TransactionFormData>) => {
    // Construct full data using defaults for missing fields
    const ledgerId = activeLedgerId === 'all' ? ledgers[0].id : activeLedgerId;
    const fullData: TransactionFormData = {
        amount: data.amount || '0',
        type: data.type as any || 'expense',
        category: data.category || '其他',
        subCategory: data.subCategory,
        date: data.date || getCurrentDateTimeLocal(),
        note: data.note || '',
        ledgerId: ledgerId
    };

    // Direct Save
    if (createTransaction(fullData)) {
        showToast(`已自动记一笔: ${fullData.category} ${fullData.subCategory ? `(${fullData.subCategory})` : ''} ¥${fullData.amount}`);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateBudget = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const input = form.elements.namedItem('budget') as HTMLInputElement;
      const val = parseFloat(input.value);
      if (!isNaN(val) && val >= 0) {
          setBudget(val);
          setIsBudgetModalOpen(false);
      }
  };

  // Category Management
  const handleAddCategory = (cat: CategoryItem) => {
      if (categoryModalContext.parent) {
           const parentName = categoryModalContext.parent.name;
           const targetType = categoryModalContext.parent.type;
           
           setCategories(prev => {
               const list = [...prev[targetType]];
               const parentIndex = list.findIndex(c => c.name === parentName);
               if (parentIndex > -1) {
                   const parent = { ...list[parentIndex] };
                   parent.children = [...(parent.children || []), cat];
                   list[parentIndex] = parent;
               }
               return { ...prev, [targetType]: list };
           });
           
           setFormData(prev => ({ ...prev, category: parentName, subCategory: cat.name }));
           setViewingParentCategory(prev => {
               if(prev && prev.name === parentName) {
                    return { ...prev, children: [...(prev.children || []), cat] };
               }
               return prev;
           });

      } else {
        setCategories(prev => ({
            ...prev,
            [cat.type]: [...prev[cat.type], cat]
        }));
        if (formData.type === cat.type) {
            setFormData(prev => ({ ...prev, category: cat.name, subCategory: undefined }));
        }
      }
      
      setCategoryModalContext({ isOpen: false });
  };

  const handleDeleteCategory = (type: 'expense' | 'income', name: string) => {
      if (confirm(`确定要删除分类“${name}”吗？`)) {
        setCategories(prev => ({
            ...prev,
            [type]: prev[type].filter(c => c.name !== name)
        }));
      }
  };
  
  // Ledger Management
  const handleSaveLedger = (ledger: Ledger) => {
      setLedgers(prev => {
          const index = prev.findIndex(l => l.id === ledger.id);
          if (index >= 0) {
              const newList = [...prev];
              newList[index] = ledger;
              return newList;
          } else {
              return [...prev, ledger];
          }
      });
      if (ledgerModalState.editingLedger) {
           // stay
      } else {
           setActiveLedgerId(ledger.id);
      }
      setLedgerModalState({ isOpen: false });
  };

  const handleDeleteLedger = (id: string) => {
      if (ledgers.length <= 1) {
          alert("至少保留一个账本哦！");
          return;
      }
      if (confirm("删除账本不会删除该账本下的历史数据（但在该账本筛选下将不可见）。确定删除吗？")) {
          setLedgers(prev => prev.filter(l => l.id !== id));
          if (activeLedgerId === id) {
              setActiveLedgerId(ledgers.find(l => l.id !== id)?.id || 'all');
          }
      }
  };

  // Logic to handle clicking a category grid item
  const handleCategoryClick = (cat: CategoryItem) => {
      if (viewingParentCategory) {
          setFormData({ 
              ...formData, 
              category: viewingParentCategory.name, 
              subCategory: cat.name 
          });
      } else {
          if (cat.children && cat.children.length > 0) {
              setViewingParentCategory(cat);
          } else {
              setFormData({ ...formData, category: cat.name, subCategory: undefined });
          }
      }
  };

  // Render Views
  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return (
          <div className="p-4">
             <div className="mb-4 flex justify-between items-end">
                <div>
                    <p className="text-xs text-slate-400 font-medium">
                        {activeLedgerId === 'all' 
                            ? '正在查看全部账本' 
                            : `正在记录: ${activeLedger?.name}`}
                    </p>
                </div>
             </div>
             
             <BudgetCard 
                budget={budget} 
                currentExpense={currentMonthExpense} 
                onSetBudget={() => setIsBudgetModalOpen(true)}
                ledgerName={activeLedgerId === 'all' ? '全部' : activeLedger?.name || ''}
            />

            <SmartEntry onParseSuccess={handleSmartEntrySuccess} categories={categories} />
            <TransactionList 
                transactions={viewTransactions} 
                onDelete={deleteTransaction} 
                onEdit={handleEditTransaction}
                ledgers={ledgers} 
                showLedgerBadge={activeLedgerId === 'all'}
            />
          </div>
        );
      case 'stats':
        return (
          <div className="p-4">
             <h1 className="text-xl font-bold text-slate-800 mb-6">收支统计</h1>
            <SummaryCharts transactions={transactions} categories={categories} ledgers={ledgers} />
          </div>
        );
      case 'profile':
        return <ProfileTab 
            transactions={transactions} 
            onImport={setTransactions} 
            categories={categories}
            onDeleteCategory={handleDeleteCategory}
            ledgers={ledgers}
            onDeleteLedger={handleDeleteLedger}
            onEditLedger={(l) => setLedgerModalState({ isOpen: true, editingLedger: l })}
            onOpenCloud={() => setIsCloudModalOpen(true)}
        />;
    }
  };

  const currentCategoryList = formData.type === 'expense' ? categories.expense : categories.income;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-md mx-auto min-h-screen relative bg-white sm:shadow-xl sm:my-8 sm:rounded-[3rem] sm:overflow-hidden sm:border-4 sm:border-slate-100 sm:min-h-[800px]">
        
        {/* Toast Notification */}
        {toast && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-xl z-[70] flex items-center gap-2 transition-all animate-bounce">
                <div className="bg-green-500 rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-bold">{toast.message}</span>
            </div>
        )}

        {/* Header with Ledger Switcher */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-50 flex justify-between items-center">
            <span className="font-bold text-slate-800 tracking-tight text-lg flex items-center gap-1">
                <span className="text-yellow-500">Miao</span>记账
            </span>
            
            {/* Ledger Switcher Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setIsLedgerMenuOpen(!isLedgerMenuOpen)}
                    className="flex items-center gap-1 text-xs font-medium bg-slate-100 pl-3 pr-2 py-1.5 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    {activeLedgerId === 'all' 
                        ? <><List className="h-3 w-3" /> 全部账本</> 
                        : <>{activeLedger?.icon} {activeLedger?.name}</>
                    }
                    <ChevronDown className={`h-3 w-3 ml-1 opacity-50 transition-transform ${isLedgerMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isLedgerMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsLedgerMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-40 p-1">
                            <div className="max-h-48 overflow-y-auto">
                                <button 
                                    onClick={() => { setActiveLedgerId('all'); setIsLedgerMenuOpen(false); }} 
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 mb-1 ${activeLedgerId === 'all' ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
                                >
                                    <List className="h-3.5 w-3.5" /> 全部账本
                                </button>
                                {ledgers.map(l => (
                                     <button 
                                        key={l.id}
                                        onClick={() => { setActiveLedgerId(l.id); setIsLedgerMenuOpen(false); }} 
                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 mb-1 ${activeLedgerId === l.id ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}`}
                                    >
                                        <span className="text-sm">{l.icon}</span> {l.name}
                                        {activeLedgerId === l.id && <Check className="h-3 w-3 ml-auto text-yellow-500" />}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-slate-50 mt-1 pt-1">
                                <button 
                                    onClick={() => { setLedgerModalState({ isOpen: true }); setIsLedgerMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-indigo-500 font-bold hover:bg-indigo-50 rounded-lg flex items-center gap-2"
                                >
                                    <Plus className="h-3.5 w-3.5" /> 新建账本
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        {renderContent()}

        {/* FAB */}
        {activeTab === 'home' && (
             <div className="fixed sm:absolute bottom-24 right-6 z-30">
                <Button 
                    variant="fab" 
                    onClick={() => { resetForm(); setIsManualFormOpen(true); }}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        )}

        {/* Bottom Nav */}
        <div className="fixed sm:absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 z-40">
            <div className="flex justify-around items-center">
                <button 
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-slate-800' : 'text-slate-300'}`}
                >
                    <List className="h-6 w-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">明细</span>
                </button>
                <button 
                    onClick={() => setActiveTab('stats')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-slate-800' : 'text-slate-300'}`}
                >
                    <PieChart className="h-6 w-6" strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">统计</span>
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-slate-800' : 'text-slate-300'}`}
                >
                    <User className="h-6 w-6" strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">我的</span>
                </button>
            </div>
        </div>
      
        <FinancialInsight transactions={viewTransactions} />
      </main>

      {/* Manual Entry Modal */}
      {isManualFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="p-6 pb-2 border-b border-slate-50 relative z-20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                        {editingTransaction ? '编辑记录' : '记一笔'}
                    </h3>
                    <button onClick={() => { setIsManualFormOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">关闭</button>
                </div>
                
                {/* Type & Ledger Info Row */}
                <div className="flex items-center gap-3 mb-6">
                    {/* Type Toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1 flex-1">
                        <button
                            onClick={() => { setFormData({...formData, type: 'expense'}); setViewingParentCategory(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                        >
                            支出
                        </button>
                        <button
                            onClick={() => { setFormData({...formData, type: 'income'}); setViewingParentCategory(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-white shadow text-yellow-600' : 'text-slate-400'}`}
                        >
                            收入
                        </button>
                    </div>

                    {/* Ledger Selector Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsEntryLedgerMenuOpen(!isEntryLedgerMenuOpen)}
                            className="bg-yellow-50 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-yellow-100 text-xs font-bold text-yellow-700 hover:bg-yellow-100 transition-colors"
                        >
                            <span>{ledgers.find(l => l.id === formData.ledgerId)?.icon}</span>
                            <span>{ledgers.find(l => l.id === formData.ledgerId)?.name}</span>
                            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isEntryLedgerMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isEntryLedgerMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsEntryLedgerMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 py-1">
                                    <div className="max-h-48 overflow-y-auto">
                                        {ledgers.map(l => (
                                            <button
                                                key={l.id}
                                                onClick={() => {
                                                    setFormData({ ...formData, ledgerId: l.id });
                                                    setIsEntryLedgerMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${
                                                    formData.ledgerId === l.id 
                                                        ? 'bg-yellow-50 text-yellow-700 font-bold' 
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>{l.icon}</span>
                                                <span>{l.name}</span>
                                                {formData.ledgerId === l.id && <Check className="h-3 w-3 ml-auto text-yellow-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Amount Input */}
                <div className="relative mb-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">¥</span>
                    <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-3xl font-bold text-slate-800 focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all outline-none"
                    placeholder="0.00"
                    autoFocus
                    />
                </div>
            </div>

            <div className="p-6 pt-2 overflow-y-auto">
                {/* Category Grid */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3 mt-4">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                            {viewingParentCategory ? (
                                <button 
                                    onClick={() => setViewingParentCategory(null)} 
                                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    <ChevronLeft size={14} /> 
                                    返回 {viewingParentCategory.name}
                                </button>
                            ) : '选择分类'}
                        </label>
                        {viewingParentCategory && (
                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                                {viewingParentCategory.name}
                            </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
                        {/* 1. If Viewing Sub-Categories */}
                        {viewingParentCategory ? (
                             <>
                                {/* "All/General" Option */}
                                <button
                                    onClick={() => {
                                         setFormData({ ...formData, category: viewingParentCategory.name, subCategory: undefined });
                                    }}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                                        formData.category === viewingParentCategory.name && !formData.subCategory 
                                        ? 'bg-yellow-100 ring-2 ring-yellow-400 ring-offset-1' 
                                        : 'bg-slate-50 hover:bg-slate-100'
                                    }`}
                                >
                                    <span className="text-2xl opacity-50">{viewingParentCategory.icon}</span>
                                    <span className="text-[10px] font-medium text-slate-500">不限</span>
                                </button>

                                {/* Sub Categories */}
                                {(viewingParentCategory.children || []).map((sub) => (
                                    <button
                                        key={sub.name}
                                        onClick={() => handleCategoryClick(sub)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                                            formData.subCategory === sub.name
                                            ? 'bg-yellow-100 ring-2 ring-yellow-400 ring-offset-1' 
                                            : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className="text-2xl">{sub.icon}</span>
                                        <span className={`text-[10px] font-medium ${formData.subCategory === sub.name ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {sub.name}
                                        </span>
                                    </button>
                                ))}

                                {/* Add Custom Sub-Category */}
                                <button 
                                    onClick={() => setCategoryModalContext({ isOpen: true, parent: viewingParentCategory })}
                                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-slate-300 text-slate-300 hover:border-yellow-400 hover:text-yellow-500 transition-colors"
                                >
                                    <Plus className="h-6 w-6" />
                                    <span className="text-[10px] font-medium">添加</span>
                                </button>
                             </>
                        ) : (
                            /* 2. Root Category View */
                            <>
                                {currentCategoryList.map((cat) => (
                                    <div key={cat.name} className="relative">
                                        <button
                                            onClick={() => handleCategoryClick(cat)}
                                            className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                                                formData.category === cat.name 
                                                ? 'bg-yellow-100 ring-2 ring-yellow-400 ring-offset-1' 
                                                : 'bg-slate-50 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="text-2xl">{cat.icon}</span>
                                            <span className={`text-[10px] font-medium ${formData.category === cat.name ? 'text-slate-900' : 'text-slate-400'}`}>
                                                {cat.name}
                                            </span>
                                            {cat.children && cat.children.length > 0 && (
                                                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                            )}
                                        </button>
                                        
                                        {/* Drill-down trigger for adding custom sub-cats or viewing subs */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewingParentCategory(cat);
                                            }}
                                            className="absolute top-0 right-0 p-1 rounded-bl-lg rounded-tr-xl hover:bg-white text-slate-300 hover:text-indigo-500 transition-colors"
                                        >
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </div>
                                ))}
                                {/* Add Root Category */}
                                <button 
                                    onClick={() => setCategoryModalContext({ isOpen: true })}
                                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-slate-300 text-slate-300 hover:border-yellow-400 hover:text-yellow-500 transition-colors"
                                >
                                    <Plus className="h-6 w-6" />
                                    <span className="text-[10px] font-medium">添加</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">日期</label>
                         <div 
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-yellow-400 outline-none text-slate-700 cursor-pointer flex items-center"
                        >
                            <Calendar className="h-4 w-4 mr-2 text-slate-400"/>
                            {formData.date.replace('T', ' ')}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">备注</label>
                        <input
                        type="text"
                        value={formData.note}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-yellow-400 outline-none text-slate-700"
                        placeholder="写点什么..."
                        />
                    </div>
                </div>

                <Button variant="primary" onClick={handleManualSubmit} className="w-full !py-4 !text-base !rounded-2xl mt-8 shadow-lg shadow-yellow-200">
                    {editingTransaction ? '保存修改' : '保存'}
                </Button>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {isDatePickerOpen && (
          <DatePickerModal
            title="选择日期和时间"
            initialValue={formData.date}
            showTime={true}
            onClose={() => setIsDatePickerOpen(false)}
            onSelect={(val) => {
                setFormData({...formData, date: val});
                setIsDatePickerOpen(false);
            }}
          />
      )}

      {/* Add Category Modal */}
      {categoryModalContext.isOpen && (
          <CategoryModal
            initialType={formData.type}
            parentCategory={categoryModalContext.parent}
            onClose={() => setCategoryModalContext({ isOpen: false })}
            onAdd={handleAddCategory}
          />
      )}
      
      {/* Add/Edit Ledger Modal */}
      {ledgerModalState.isOpen && (
          <LedgerModal
            initialLedger={ledgerModalState.editingLedger}
            onClose={() => setLedgerModalState({ isOpen: false })}
            onSave={handleSaveLedger}
          />
      )}

      {/* Cloud Settings Modal */}
      {isCloudModalOpen && (
          <CloudSettingsModal 
            onClose={() => setIsCloudModalOpen(false)}
            onSyncNow={() => handleCloudSync(true)}
          />
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up">
                <h3 className="text-lg font-bold text-slate-900 mb-4">设置月度预算</h3>
                <form onSubmit={handleUpdateBudget}>
                    <div className="relative mb-6">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">¥</span>
                        <input
                            name="budget"
                            type="number"
                            defaultValue={budget === 0 ? '' : budget}
                            placeholder="输入金额"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all outline-none"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsBudgetModalOpen(false)}
                            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3 rounded-xl bg-yellow-400 text-slate-900 font-bold hover:bg-yellow-500 shadow-md shadow-yellow-200"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;