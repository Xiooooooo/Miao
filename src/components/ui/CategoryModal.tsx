import React, { useState } from 'react';
import { X, Check, ArrowLeft } from 'lucide-react';
import { CategoryItem, TransactionType } from '../../types';
import { EMOJI_PRESETS } from '../../constants';

interface CategoryModalProps {
    initialType: TransactionType;
    parentCategory?: CategoryItem; // Context: If adding a sub-category
    onClose: () => void;
    onAdd: (category: CategoryItem) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ initialType, parentCategory, onClose, onAdd }) => {
    const [type, setType] = useState<TransactionType>(initialType);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('✨');

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd({ name, icon, type });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in border border-slate-100 flex flex-col">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">
                        {parentCategory ? `添加“${parentCategory.name}”子分类` : '添加自定义分类'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Type Switcher - Only show if NO parent category (sub-cats inherit parent type) */}
                    {!parentCategory && (
                        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => setType('expense')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                            >
                                支出
                            </button>
                            <button
                                onClick={() => setType('income')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-white shadow text-yellow-600' : 'text-slate-400'}`}
                            >
                                收入
                            </button>
                        </div>
                    )}

                    {parentCategory && (
                        <div className="mb-6 p-3 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center gap-2">
                             <span className="text-xl">{parentCategory.icon}</span>
                             <div className="flex flex-col">
                                <span className="text-[10px] text-yellow-600 font-bold uppercase">所属主分类</span>
                                <span className="text-sm font-bold text-slate-700">{parentCategory.name}</span>
                             </div>
                        </div>
                    )}

                    {/* Preview & Inputs */}
                    <div className="flex gap-4 items-center mb-6">
                        <div className="flex flex-col items-center gap-1">
                             <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center text-3xl shadow-inner border-2 border-yellow-200">
                                {icon}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">预览</span>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">
                                    {parentCategory ? '子分类名称' : '分类名称'}
                                </label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={parentCategory ? "例如：麻辣烫" : "例如：餐饮"}
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-yellow-400 outline-none text-slate-800 text-sm font-bold"
                                    maxLength={6}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">图标 (Emoji)</label>
                                <input 
                                    type="text" 
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-yellow-400 outline-none text-slate-800 text-sm"
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Emoji Presets */}
                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">推荐图标</label>
                        <div className="grid grid-cols-6 gap-2 bg-slate-50 p-3 rounded-2xl max-h-32 overflow-y-auto">
                            {EMOJI_PRESETS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setIcon(emoji)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-lg transition-all"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleAdd}
                        disabled={!name.trim()}
                        className="w-full py-3 rounded-xl bg-yellow-400 text-slate-900 font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    >
                        {parentCategory ? '添加子分类' : '确认添加'}
                    </button>
                </div>
             </div>
        </div>
    );
};