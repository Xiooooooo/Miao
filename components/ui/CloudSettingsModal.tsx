
import React, { useState, useEffect } from 'react';
import { X, Cloud, Lock, Server, LogIn, LogOut, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { cloudService } from '../../services/cloudService';
import { Button } from './Button';

interface CloudSettingsModalProps {
    onClose: () => void;
    onSyncNow: () => void;
}

export const CloudSettingsModal: React.FC<CloudSettingsModalProps> = ({ onClose, onSyncNow }) => {
    const [step, setStep] = useState<'config' | 'auth'>('config');
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cloudService.isConfigured()) {
            // Load existing credentials to display partially masked
            // Actually we don't expose them back for security, just show connected state
            setStep('auth');
            checkUser();
        }
    }, []);

    const checkUser = async () => {
        const u = await cloudService.getUser();
        setUser(u);
    };

    const handleSaveConfig = () => {
        if (!url || !key) return;
        cloudService.saveCredentials(url, key);
        setStep('auth');
    };

    const handleClearConfig = () => {
        cloudService.clearCredentials();
        setUrl('');
        setKey('');
        setStep('config');
        setUser(null);
    };

    const handleAuth = async (isLogin: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await cloudService.login(email, password);
            } else {
                await cloudService.register(email, password);
                alert("注册成功！请检查邮箱完成验证（如果 Supabase 设置了验证），然后登录。");
            }
            await checkUser();
            onSyncNow(); // Trigger initial sync
        } catch (err: any) {
            setError(err.message || "认证失败");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await cloudService.logout();
        setUser(null);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">
                        <Cloud className="h-5 w-5" />
                        <h3 className="font-bold">多端同步设置</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 'config' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-700 leading-relaxed border border-blue-100">
                                <strong>如何使用：</strong> 本应用不保存您的数据。请创建一个免费的 <a href="https://supabase.com" target="_blank" className="underline font-bold">Supabase</a> 项目作为您的私有云后端。
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Project URL</label>
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                    <Server className="h-4 w-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://xyz.supabase.co"
                                        className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Anon Key</label>
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                    <input 
                                        type="password" 
                                        value={key}
                                        onChange={(e) => setKey(e.target.value)}
                                        placeholder="eyJxh..."
                                        className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSaveConfig} disabled={!url || !key} className="w-full !rounded-xl !bg-blue-600 hover:!bg-blue-700">
                                连接服务器
                            </Button>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400">
                                <p className="flex items-center gap-1"><HelpCircle size={12}/> 需要在 Supabase SQL Editor 运行以下命令：</p>
                                <pre className="bg-slate-800 text-slate-200 p-2 rounded-lg mt-1 overflow-x-auto">
{`create table user_data (
  id uuid references auth.users not null primary key,
  content jsonb,
  updated_at timestamptz default now()
);
alter table user_data enable row level security;
create policy "User all" on user_data for all using (auth.uid() = id);`}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                             {/* Config Info */}
                             <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl mb-4 border border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    服务器已连接
                                </div>
                                <button onClick={handleClearConfig} className="text-[10px] text-slate-400 underline">更改</button>
                             </div>

                             {user ? (
                                 <div className="text-center py-6 space-y-4">
                                     <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                                         <Check className="h-8 w-8" />
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-slate-800">已登录</h4>
                                         <p className="text-xs text-slate-500">{user.email}</p>
                                     </div>
                                     <div className="flex gap-2">
                                        <Button onClick={onSyncNow} variant="primary" className="flex-1 !rounded-xl">
                                            立即同步
                                        </Button>
                                        <Button onClick={handleLogout} variant="secondary" className="flex-1 !rounded-xl">
                                            <LogOut className="h-4 w-4 mr-1" /> 退出
                                        </Button>
                                     </div>
                                     <p className="text-[10px] text-slate-400 mt-2">数据变动时会自动同步</p>
                                 </div>
                             ) : (
                                 <>
                                     <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">邮箱</label>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">密码</label>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                                        />
                                    </div>

                                    {error && <p className="text-xs text-rose-500">{error}</p>}

                                    <div className="flex gap-3 pt-2">
                                        <Button 
                                            onClick={() => handleAuth(true)} 
                                            disabled={isLoading}
                                            className="flex-1 !rounded-xl !bg-blue-600 hover:!bg-blue-700"
                                            isLoading={isLoading}
                                        >
                                            <LogIn className="h-4 w-4 mr-1" /> 登录
                                        </Button>
                                        <Button 
                                            onClick={() => handleAuth(false)} 
                                            disabled={isLoading} 
                                            variant="secondary"
                                            className="flex-1 !rounded-xl"
                                        >
                                            注册
                                        </Button>
                                    </div>
                                 </>
                             )}
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};
