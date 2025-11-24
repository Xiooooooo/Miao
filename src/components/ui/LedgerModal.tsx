import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EMOJI_PRESETS } from '../../constants';
import { Ledger } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface LedgerModalProps {
    initialLedger?: Ledger;
    onClose: () => void;
    onSave: (ledger: Ledger) => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({ initialLedger, onClose, onSave }) => {
    const [name, setName] = useState(initialLedger?.name || '');
    const [icon, setIcon] = useState(initialLedger?.icon || '📒');

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            id: initialLedger?.id || uuidv4(),
            name,
            icon,
            isDefault: initialLedger?.isDefault
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in border border-slate-100 flex flex-col">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">
                        {initialLedger ? '编辑账本' : '添加新账本'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Preview & Inputs */}
                    <div className="flex gap-4 items-center mb-6">
                        <div className="flex flex-col items-center gap-1">
                             <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl shadow-inner border-2 border-indigo-200">
                                {icon}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">预览</span>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">
                                    账本名称
                                </label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="例如：装修账本"
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 outline-none text-slate-800 text-sm font-bold"
                                    maxLength={8}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">图标 (Emoji)</label>
                                <input 
                                    type="text" 
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-400 outline-none text-slate-800 text-sm"
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
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    >
                        {initialLedger ? '保存修改' : '创建账本'}
                    </button>
                </div>
             </div>
        </div>
    );
};