import React, { useRef, useEffect } from 'react';
import { DictationTest, TestStatus } from '../types';

interface ClozeBoardProps {
  test: DictationTest;
  status: TestStatus;
  onAnswerChange: (id: string, value: string) => void;
}

export const ClozeBoard: React.FC<ClozeBoardProps> = ({ test, status, onAnswerChange }) => {
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Focus the first input when the test becomes ready
  useEffect(() => {
    if (status === TestStatus.READY && test.segments.length > 0) {
      // Find first segment with a blank
      const firstBlank = test.segments.find(s => s.wordToFill !== null);
      if (firstBlank && inputsRef.current[firstBlank.id]) {
        inputsRef.current[firstBlank.id]?.focus();
      }
    }
  }, [status, test]);

  const isSubmitted = status === TestStatus.SUBMITTED;

  const getValidationClass = (userAnswer: string, correct: string | null) => {
    if (!isSubmitted || correct === null) return "border-slate-300 focus:border-indigo-500 text-slate-800";
    
    const isCorrect = userAnswer.trim().toLowerCase() === correct.trim().toLowerCase();
    return isCorrect 
      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium" 
      : "border-red-500 bg-red-50 text-red-900 font-medium line-through";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Find all segments with blanks
      const blanks = test.segments.filter(s => s.wordToFill !== null);
      const currentIndex = blanks.findIndex(s => s.id === currentId);
      
      if (currentIndex !== -1 && currentIndex < blanks.length - 1) {
        const nextId = blanks[currentIndex + 1].id;
        inputsRef.current[nextId]?.focus();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-10 leading-loose text-lg text-slate-700 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center border-b border-slate-100 pb-4">
        {test.title}
      </h1>
      
      <div className="text-justify font-serif tracking-wide">
        {test.segments.map((segment, index) => (
          <React.Fragment key={segment.id}>
            {/* Text Before Blank */}
            <span dangerouslySetInnerHTML={{ __html: segment.textBefore }} />

            {/* Blank / Input */}
            {segment.wordToFill !== null && (
              <span className="inline-block mx-1 align-baseline relative group">
                {/* The Input Field */}
                <input
                  ref={(el) => { inputsRef.current[segment.id] = el; }}
                  type="text"
                  value={segment.userAnswer}
                  onChange={(e) => onAnswerChange(segment.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, segment.id)}
                  disabled={isSubmitted}
                  className={`
                    bg-transparent border-b-2 outline-none px-1 text-center min-w-[80px] transition-all
                    ${getValidationClass(segment.userAnswer, segment.wordToFill)}
                    disabled:opacity-100
                  `}
                  style={{ width: `${Math.max(segment.userAnswer.length, 6) + 2}ch` }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={`(${index + 1})`}
                />
                
                {/* Correct Answer Tooltip (Shown if incorrect after submit) */}
                {isSubmitted && 
                 segment.wordToFill && 
                 segment.userAnswer.trim().toLowerCase() !== segment.wordToFill.trim().toLowerCase() && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none opacity-0 group-hover:opacity-100 animate-fade-in transition-opacity">
                    {segment.wordToFill}
                  </span>
                )}
                
                 {/* Correct Answer Display (Shown always if incorrect after submit - inline correction) */}
                 {isSubmitted && 
                 segment.wordToFill && 
                 segment.userAnswer.trim().toLowerCase() !== segment.wordToFill.trim().toLowerCase() && (
                  <span className="block absolute top-full left-0 w-full text-center text-xs text-emerald-600 font-bold mt-1">
                    {segment.wordToFill}
                  </span>
                )}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
