import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface TestControlsProps {
  onGenerate: (topic: string, difficulty: string) => void;
  onManualGenerate: (
    title: string, 
    fullText: string, 
    questionText: string, 
    autoConfig?: { numBlanks: number; minWords: number; maxWords: number }
  ) => void;
  isLoading: boolean;
}

export const TestControls: React.FC<TestControlsProps> = ({ onGenerate, onManualGenerate, isLoading }) => {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  
  // AI State
  const [topic, setTopic] = useState("Artificial Intelligence");
  const [difficulty, setDifficulty] = useState("Intermediate");

  // Manual State
  const [manualTitle, setManualTitle] = useState("");
  const [fullText, setFullText] = useState("");
  const [questionText, setQuestionText] = useState("");

  // Auto Digging State
  const [clozeMode, setClozeMode] = useState<'traditional' | 'auto'>('traditional');
  const [numBlanks, setNumBlanks] = useState<number>(5);
  const [minWords, setMinWords] = useState<number>(1);
  const [maxWords, setMaxWords] = useState<number>(2);

  const handleManualSubmit = () => {
    if (!manualTitle.trim() || !fullText.trim()) {
      alert("Please enter at least a title and the full source text.");
      return;
    }
    if (clozeMode === 'auto') {
      onManualGenerate(manualTitle, fullText, "", {
        numBlanks,
        minWords,
        maxWords
      });
    } else {
      onManualGenerate(manualTitle, fullText, questionText);
    }
  };

  const loadExample = () => {
    setManualTitle("The Fox and Dog");
    setFullText("The quick brown fox jumps over the lazy dog.");
    setQuestionText("The quick ______ fox jumps over the ______ dog.");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
            mode === 'ai' 
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          AI Generator
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
            mode === 'manual' 
              ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Manual Input
        </button>
      </div>

      <div className="p-6">
        {mode === 'ai' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-fade-in">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="e.g., Environment, History..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-colors"
              >
                <option value="Easy">Easy (A2-B1)</option>
                <option value="Intermediate">Intermediate (B2)</option>
                <option value="Advanced">Advanced (C1-C2)</option>
                <option value="Business">Business English</option>
                <option value="Academic">Academic (TOEFL/IELTS)</option>
              </select>
            </div>

            <Button 
              onClick={() => onGenerate(topic, difficulty)} 
              isLoading={isLoading}
              className="w-full"
            >
              Generate Dictation
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-slate-800 font-bold text-lg">Create Your Own Test</h3>
                <button onClick={loadExample} className="text-xs text-indigo-600 hover:underline font-medium">Load Example</button>
             </div>
             
             <div className="flex gap-4 p-1 bg-slate-100/80 rounded-lg max-w-sm">
               <button
                 type="button"
                 onClick={() => setClozeMode('traditional')}
                 className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                   clozeMode === 'traditional'
                     ? 'bg-white text-indigo-600 shadow-sm'
                     : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 手动挖空 (Braces/下划线)
               </button>
               <button
                 type="button"
                 onClick={() => setClozeMode('auto')}
                 className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                   clozeMode === 'auto'
                     ? 'bg-white text-indigo-600 shadow-sm'
                     : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 智能自动挖空 (指定数量/词数)
               </button>
             </div>

             <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1">Test Title</label>
               <input 
                 type="text" 
                 value={manualTitle}
                 onChange={(e) => setManualTitle(e.target.value)}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="My Custom Test Title"
               />
             </div>

             {clozeMode === 'auto' ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="block text-sm font-semibold text-slate-600">
                     Source Text (Full Content)
                     <span className="text-slate-400 font-normal ml-2 text-xs">用于生成音频与智能挖空</span>
                   </label>
                   <textarea
                     value={fullText}
                     onChange={(e) => setFullText(e.target.value)}
                     className="w-full h-44 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed"
                     placeholder="请在此输入或粘贴完整的英文段落..."
                   />
                 </div>
                 
                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-3">
                   <div>
                     <h4 className="text-sm font-bold text-slate-700 mb-1">Auto-Cloze Configuration (自动挖空配置)</h4>
                     <p className="text-xs text-slate-500">
                       设置挖空总数量以及单空包含的单词范围。
                     </p>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-3">
                     <div className="space-y-1">
                       <label className="block text-xs font-bold text-slate-600">挖空总数</label>
                       <input 
                         type="number" 
                         min="1" 
                         value={numBlanks}
                         onChange={(e) => setNumBlanks(Math.max(1, parseInt(e.target.value) || 0))}
                         className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="block text-xs font-bold text-slate-600">最少单词数/空</label>
                       <input 
                         type="number" 
                         min="1" 
                         value={minWords}
                         onChange={(e) => setMinWords(Math.max(1, parseInt(e.target.value) || 0))}
                         className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="block text-xs font-bold text-slate-600">最多单词数/空</label>
                       <input 
                         type="number" 
                         min="1" 
                         value={maxWords}
                         onChange={(e) => setMaxWords(Math.max(1, parseInt(e.target.value) || 0))}
                         className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                       />
                     </div>
                   </div>

                   <div className="text-xs text-slate-500 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                     系统将识别出源文本中的英文单词，并随机挖去 <span className="text-indigo-600 font-semibold">{numBlanks}</span> 个不重叠的空，每个空大小在 <span className="text-indigo-600 font-semibold">{minWords} - {maxWords}</span> 个单词之间。
                   </div>
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-600">
                      Source Text (Full Content)
                      <span className="text-slate-400 font-normal ml-2 text-xs">Used for audio & answers</span>
                    </label>
                    <textarea
                      value={fullText}
                      onChange={(e) => setFullText(e.target.value)}
                      className="w-full h-40 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                      placeholder="Enter the complete correct text here. If you are not providing a separate Question Text, you can mark answers here with {curly braces}."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-600">
                      Question Text (Optional)
                      <span className="text-slate-400 font-normal ml-2 text-xs">Use underscores (____) for blanks</span>
                    </label>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full h-40 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm font-mono"
                      placeholder="Example: The quick ______ fox jumps..."
                    />
                  </div>
               </div>
             )}

             <div className="pt-2 flex gap-3">
                <Button 
                  onClick={handleManualSubmit} 
                  isLoading={isLoading}
                  className="px-8 font-semibold"
                >
                  Create Custom Test
                </Button>
             </div>
             
             <p className="text-xs text-slate-500 italic mt-2">
               {clozeMode === 'auto' 
                 ? "Note: The speech audio is synthesized from the complete full text automatically."
                 : "Note: If you provide Question Text, the system will try to match the surrounding text with the Source Text to extract answers."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
