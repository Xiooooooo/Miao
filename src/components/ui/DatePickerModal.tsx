import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

interface DatePickerModalProps {
    initialValue: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    onSelect: (val: string) => void;
    onClose: () => void;
    title: string;
    showTime?: boolean;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({ initialValue, onSelect, onClose, title, showTime = false }) => {
    const parseDate = (val: string) => {
        const d = new Date(val);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const [selectedDate, setSelectedDate] = useState(() => parseDate(initialValue));
    const [viewDate, setViewDate] = useState(() => parseDate(initialValue));
    
    // Time state
    const [time, setTime] = useState({
        hours: selectedDate.getHours(),
        minutes: selectedDate.getMinutes(),
        seconds: selectedDate.getSeconds()
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

    const weeks = ['日', '一', '二', '三', '四', '五', '六'];

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const handleDayClick = (day: number) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(year);
        newDate.setMonth(month);
        newDate.setDate(day);
        
        setSelectedDate(newDate);

        if (!showTime) {
            const y = newDate.getFullYear();
            const m = String(newDate.getMonth() + 1).padStart(2, '0');
            const d = String(newDate.getDate()).padStart(2, '0');
            onSelect(`${y}-${m}-${d}`);
        }
    };

    const handleTimeChange = (type: 'hours' | 'minutes' | 'seconds', val: string) => {
        let num = parseInt(val);
        if (isNaN(num)) num = 0;
        
        if (type === 'hours') num = Math.min(23, Math.max(0, num));
        else num = Math.min(59, Math.max(0, num));

        setTime(prev => ({ ...prev, [type]: num }));
    };

    const handleConfirm = () => {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        
        if (showTime) {
            const hh = String(time.hours).padStart(2, '0');
            const mm = String(time.minutes).padStart(2, '0');
            const ss = String(time.seconds).padStart(2, '0');
            onSelect(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
        } else {
             onSelect(`${y}-${m}-${d}`);
        }
    };

    const isSelected = (day: number) => {
        return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                     {/* Month Nav */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="font-bold text-slate-800 text-lg">
                            {year}年 {month + 1}月
                        </span>
                        <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                        {weeks.map(w => (
                            <span key={w} className="text-xs font-bold text-slate-300 py-1">{w}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const selected = isSelected(day);
                            const today = isToday(day);
                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all mx-auto
                                        ${selected 
                                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200 scale-105' 
                                            : 'text-slate-700 hover:bg-slate-50'
                                        }
                                        ${!selected && today ? 'text-indigo-500 ring-1 ring-indigo-200' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time Picker Section */}
                    {showTime && (
                        <div className="border-t border-slate-100 pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-400 uppercase">时间</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <input 
                                    type="number" 
                                    min="0" max="23"
                                    value={String(time.hours).padStart(2,'0')} 
                                    onChange={(e) => handleTimeChange('hours', e.target.value)}
                                    className="w-16 h-12 bg-slate-50 rounded-xl text-center text-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none"
                                />
                                <span className="text-slate-300 font-bold">:</span>
                                <input 
                                    type="number" 
                                    min="0" max="59"
                                    value={String(time.minutes).padStart(2,'0')} 
                                    onChange={(e) => handleTimeChange('minutes', e.target.value)}
                                    className="w-16 h-12 bg-slate-50 rounded-xl text-center text-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none"
                                />
                                <span className="text-slate-300 font-bold">:</span>
                                <input 
                                    type="number" 
                                    min="0" max="59"
                                    value={String(time.seconds).padStart(2,'0')} 
                                    onChange={(e) => handleTimeChange('seconds', e.target.value)}
                                    className="w-16 h-12 bg-slate-50 rounded-xl text-center text-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirm Button for Time Mode */}
                {showTime && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <button 
                            onClick={handleConfirm}
                            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        >
                            确认时间
                        </button>
                    </div>
                )}
             </div>
        </div>
    );
};