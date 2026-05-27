import React, { useState, useEffect } from 'react';
import { Settings, X, Key, Globe, Check, AlertCircle } from 'lucide-react';

export const ApiSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<'deepseek' | 'gemini'>('deepseek');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekEndpoint, setDeepseekEndpoint] = useState('https://api.deepseek.com');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProvider = localStorage.getItem('CD_API_PROVIDER');
      const savedDsKey = localStorage.getItem('CD_DEEPSEEK_KEY');
      const savedDsEp = localStorage.getItem('CD_DEEPSEEK_ENDPOINT');
      const savedGemKey = localStorage.getItem('CD_GEMINI_KEY');

      if (savedProvider === 'deepseek' || savedProvider === 'gemini') {
        setProvider(savedProvider);
      }
      if (savedDsKey) setDeepseekKey(savedDsKey);
      if (savedDsEp) setDeepseekEndpoint(savedDsEp);
      if (savedGemKey) setGeminiKey(savedGemKey);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('CD_API_PROVIDER', provider);
      localStorage.setItem('CD_DEEPSEEK_KEY', deepseekKey.trim());
      localStorage.setItem('CD_DEEPSEEK_ENDPOINT', deepseekEndpoint.trim() || 'https://api.deepseek.com');
      localStorage.setItem('CD_GEMINI_KEY', geminiKey.trim());
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsOpen(false);
    }, 1000);
  };

  const isConfigured = provider === 'deepseek' ? !!deepseekKey : !!geminiKey;

  return (
    <div className="relative">
      {/* Settings Trigger Icon */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all relative ${
          isConfigured
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
        }`}
        title="API Settings"
      >
        <Settings className={`w-3.5 h-3.5 ${isConfigured ? 'text-emerald-500 animate-spin-hover' : 'text-slate-400'}`} />
        <span>API 设置</span>
        {isConfigured && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {/* Modal Backdrop and Box */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                <span>自定义 API 配置</span>
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">选择 API 服务商 (Provider)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider('deepseek')}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-1.5 ${
                      provider === 'deepseek'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>DeepSeek (推荐)</span>
                    <span className="text-[10px] font-normal opacity-80">高性价比首选</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('gemini')}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-1.5 ${
                      provider === 'gemini'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Google Gemini</span>
                    <span className="text-[10px] font-normal opacity-80">智能语义理解</span>
                  </button>
                </div>
              </div>

              {provider === 'deepseek' ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>DeepSeek API Key</span>
                    </label>
                    <input
                      type="password"
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>API 端点 (Base URL)</span>
                    </label>
                    <input
                      type="text"
                      value={deepseekEndpoint}
                      onChange={(e) => setDeepseekEndpoint(e.target.value)}
                      placeholder="https://api.deepseek.com"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      支持中转站或自定义端点。默认：https://api.deepseek.com
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>Gemini API Key</span>
                    </label>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100/70 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 leading-normal font-medium">
                  内置公共 API 密钥已停用。请输入您的个人密钥，密钥保存在本地浏览器缓存中，不会被额外记录，仅用于服务器作生成中转。
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaved}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 ${
                    isSaved
                      ? 'bg-emerald-600 shadow-emerald-100'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:translate-y-[-0.5px] active:translate-y-[0.5px] cursor-pointer'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已保存</span>
                    </>
                  ) : (
                    <span>保存配置</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
