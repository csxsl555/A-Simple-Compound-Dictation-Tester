import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface TestControlsProps {
  onGenerate: (topic: string, difficulty: string) => void;
  onManualGenerate: (title: string, fullText: string, questionText: string) => void;
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

  const handleManualSubmit = () => {
    if (!manualTitle.trim() || !fullText.trim()) {
      alert("Please enter at least a title and the full source text.");
      return;
    }
    onManualGenerate(manualTitle, fullText, questionText);
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
                <h3 className="text-slate-800 font-semibold">Create Your Own Test</h3>
                <button onClick={loadExample} className="text-xs text-indigo-600 hover:underline font-medium">Load Example</button>
             </div>
             
             <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1">Test Title</label>
               <input 
                 type="text" 
                 value={manualTitle}
                 onChange={(e) => setManualTitle(e.target.value)}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="My Custom Test"
               />
             </div>

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

             <div className="pt-2">
                <Button 
                  onClick={handleManualSubmit} 
                  isLoading={isLoading}
                  className="w-full md:w-auto md:px-8"
                >
                  Create Custom Test
                </Button>
             </div>
             
             <p className="text-xs text-slate-500 italic mt-2">
               Note: If you provide Question Text, the system will try to match the surrounding text with the Source Text to extract answers.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
