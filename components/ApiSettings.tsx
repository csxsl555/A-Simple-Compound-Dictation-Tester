import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/geminiService';

export const ApiSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekEndpoint, setDeepseekEndpoint] = useState('https://api.deepseek.com');
  const [savedMessage, setSavedMessage] = useState('');

  // Load current values on mount
  useEffect(() => {
    const settings = getSettings();
    setProvider(settings.provider);
    
    // Retrieve actual local keys if stored
    const storedGemini = localStorage.getItem("CD_GEMINI_KEY") || "";
    const storedDeepseek = localStorage.getItem("CD_DEEPSEEK_KEY") || "";
    const storedEndpoint = localStorage.getItem("CD_DEEPSEEK_ENDPOINT") || "https://api.deepseek.com";

    setGeminiKey(storedGemini);
    setDeepseekKey(storedDeepseek);
    setDeepseekEndpoint(storedEndpoint);
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(provider, geminiKey.trim(), deepseekKey.trim(), deepseekEndpoint.trim());
    setSavedMessage('配置保存成功！');
    setTimeout(() => {
      setSavedMessage('');
    }, 2000);
  };

  return (
    <div className="relative">
      {/* Settings Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 active:scale-95 rounded-lg border border-slate-200 transition-all cursor-pointer"
        title="AI API Configuration"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isOpen ? "animate-spin" : ""}>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        AI 接口设置
      </button>

      {/* Popover Settings Overlay modal panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-150 p-5 z-50 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">API 接口配置 / API Settings</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 font-mono text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Select Provider */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">选择 AI 引擎</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('gemini')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      provider === 'gemini'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-extrabold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('deepseek')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      provider === 'deepseek'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-extrabold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    DeepSeek
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs */}
              {provider === 'gemini' ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 flex justify-between">
                      <span>Gemini API Key</span>
                      <span className="text-[10px] text-slate-400 font-normal">留空使用系统默认</span>
                    </label>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AI Studio API Key"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    系统默认配置了免费的 Google Gemini 端点。如果您拥有自己的 API Key，可在上方填写覆盖默认密钥。
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">DeepSeek API Key</label>
                    <input
                      type="password"
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600 flex justify-between">
                      <span>API 接口端点 (Endpoint)</span>
                      <span className="text-[10px] text-slate-400 font-normal">可自定义转发端点</span>
                    </label>
                    <input
                      type="text"
                      value={deepseekEndpoint}
                      onChange={(e) => setDeepseekEndpoint(e.target.value)}
                      placeholder="https://api.deepseek.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-indigo-500 font-semibold leading-normal bg-indigo-50/50 p-2 rounded border border-indigo-100">
                    💡 使用 DeepSeek 引擎产生题目时，系统播放听写将全自动使用浏览器的本地高质量英文语音合成（无需额外购买 TTS 音频接口，全程免费、超流畅）。
                  </p>
                </div>
              )}

              {/* Action Save Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-lg text-xs font-extrabold py-2 active:scale-95 transition-all text-center select-none cursor-pointer"
                >
                  保存设置 (Save)
                </button>
              </div>

              {savedMessage && (
                <div className="text-[11px] text-emerald-600 font-bold text-center animate-fade-in">
                  {savedMessage}
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
};
