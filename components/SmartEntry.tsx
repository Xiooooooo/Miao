import React, { useState, useRef } from 'react';
import { parseTransactionInput, parseVoiceTransaction } from '../services/geminiService';
import { Button } from './ui/Button';
import { Sparkles, ArrowUp, Mic, Square, Loader2 } from 'lucide-react';
import { TransactionFormData, CategoryItem } from '../types';

interface SmartEntryProps {
  onParseSuccess: (data: Partial<TransactionFormData>) => void;
  categories: { expense: CategoryItem[]; income: CategoryItem[] };
}

export const SmartEntry: React.FC<SmartEntryProps> = ({ onParseSuccess, categories }) => {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleParse = async () => {
    if (!input.trim()) return;
    
    setIsThinking(true);
    setError(null);
    try {
      // Pass categories to AI service
      const result = await parseTransactionInput(input, categories);
      onSuccess(result);
      setInput(''); // Clear input on success
    } catch (err) {
      setError("AI没听懂，试着说: '午饭 20元' 或 '打车 50'");
    } finally {
      setIsThinking(false);
    }
  };

  const onSuccess = (result: any) => {
      onParseSuccess({
        amount: result.amount.toString(),
        type: result.type,
        category: result.category,
        subCategory: result.subCategory, // Pass subCategory
        date: result.date,
        note: result.note,
        // Ledger ID is handled by the parent
      });
  };

  const startRecording = async () => {
    setError(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // iOS Safari often produces audio/mp4, while Chrome produces audio/webm.
            // Using the recorder's mimeType ensures compatibility.
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            // Send to Gemini with categories
            handleVoiceParse(audioBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone error:", err);
        setError("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const handleVoiceParse = async (audioBlob: Blob) => {
      setIsThinking(true);
      try {
          const result = await parseVoiceTransaction(audioBlob, categories);
          onSuccess(result);
      } catch (err) {
          console.error(err);
          setError("语音识别失败，请再试一次～");
      } finally {
          setIsThinking(false);
      }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-yellow-100 p-1.5 rounded-full">
            <Sparkles className="h-4 w-4 text-yellow-600" />
        </div>
        <h2 className="text-sm font-bold text-slate-700">AI 记账助手</h2>
        {isRecording && <span className="text-xs text-rose-500 animate-pulse font-medium">正在听...</span>}
      </div>
      
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "正在录音..." : "打字或按语音... 例如：请客户吃饭花了300"}
          className={`w-full bg-slate-50 rounded-2xl px-4 py-3 pr-12 text-slate-700 text-sm focus:ring-2 focus:ring-yellow-200 focus:bg-white focus:outline-none min-h-[70px] resize-none transition-all placeholder:text-slate-400 ${isRecording ? 'ring-2 ring-rose-200 bg-rose-50' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleParse();
            }
          }}
          disabled={isRecording}
        />
        
        {/* Microphone Button - Bottom Left */}
        <div className="absolute bottom-2 left-2">
            <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isThinking}
                variant="ghost"
                className={`!w-8 !h-8 !p-0 !rounded-full transition-all ${isRecording ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-200'}`}
            >
                {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
            </Button>
        </div>

        {/* Send Button - Bottom Right */}
        <div className="absolute bottom-2 right-2">
          <Button 
            onClick={handleParse} 
            disabled={!input.trim() || isThinking || isRecording}
            isLoading={isThinking}
            variant="primary"
            className="!w-8 !h-8 !p-0 !rounded-full bg-yellow-400 hover:bg-yellow-500 text-slate-900"
          >
            {!isThinking && <ArrowUp className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {error && <p className="text-rose-500 text-xs mt-2 ml-1">{error}</p>}
    </div>
  );
};