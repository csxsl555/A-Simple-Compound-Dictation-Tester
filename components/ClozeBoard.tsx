import React, { useRef, useEffect } from 'react';
import { DictationTest, TestStatus } from '../types';

interface ClozeBoardProps {
  test: DictationTest;
  status: TestStatus;
  onAnswerChange: (id: string, value: string) => void;
}

export const ClozeBoard: React.FC<ClozeBoardProps> = ({ test, status, onAnswerChange }) => {
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const hasFocusedRef = useRef(false);

  // Focus the first input when the test becomes ready
  useEffect(() => {
    if (status === TestStatus.READY) {
      if (!hasFocusedRef.current && test.segments.length > 0) {
        const firstBlank = test.segments.find(s => s.wordToFill !== null);
        if (firstBlank && inputsRef.current[firstBlank.id]) {
          inputsRef.current[firstBlank.id]?.focus();
          hasFocusedRef.current = true;
        }
      }
    } else {
      hasFocusedRef.current = false;
    }
  }, [status, test]);

  const isSubmitted = status === TestStatus.SUBMITTED;

  const getValidationClass = (userAnswer: string, correct: string | null) => {
    if (!isSubmitted || correct === null) return "border-slate-300 focus:border-indigo-500 text-slate-800";
    
    const isCorrect = userAnswer.trim().toLowerCase() === correct.trim().toLowerCase();
    return isCorrect 
      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold" 
      : "border-red-400 bg-red-50 text-red-800 font-semibold";
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

  // Pre-calculate blank items with sequential indexes for reference
  const blankSegments = test.segments
    .map((seg, originalIndex) => ({ seg, originalIndex }))
    .filter(item => item.seg.wordToFill !== null);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-10 leading-loose text-lg text-slate-700 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 mb-6 text-center border-b border-slate-100 pb-4">
          {test.title}
        </h1>
        
        <div className="text-justify font-serif tracking-wide">
          {test.segments.map((segment) => {
            // Find sequential blank index
            const blankIdx = blankSegments.findIndex(item => item.seg.id === segment.id);
            const isBlank = blankIdx !== -1;
            
            return (
              <React.Fragment key={segment.id}>
                {/* Text Before Blank */}
                <span dangerouslySetInnerHTML={{ __html: segment.textBefore }} />

                {/* Blank / Input */}
                {isBlank && segment.wordToFill !== null && (
                  <span className="inline-block mx-1.5 align-baseline relative">
                    {/* The Input Field */}
                    <input
                      ref={(el) => { inputsRef.current[segment.id] = el; }}
                      type="text"
                      value={segment.userAnswer}
                      onChange={(e) => onAnswerChange(segment.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, segment.id)}
                      disabled={isSubmitted}
                      className={`
                        bg-transparent border-b-2 outline-none px-2 text-center min-w-[90px] transition-all duration-200
                        ${getValidationClass(segment.userAnswer, segment.wordToFill)}
                        disabled:opacity-100 rounded-md py-0.5
                      `}
                      style={{ width: `${Math.max(segment.userAnswer.length, 6) + 2}ch` }}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={`(${blankIdx + 1})`}
                      title={isSubmitted ? `Correct: ${segment.wordToFill}` : undefined}
                    />
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Answer Comparison Sheet (Shown in evaluations instead of cluncky inline overlaps) */}
      {isSubmitted && (
        <div className="mt-8 border-t border-slate-100 pt-8 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              答题对照与解析 / Answer Comparison Sheet
            </h3>
            <span className="text-xs text-slate-400 font-mono font-bold">
              Total: {blankSegments.length} blanks
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3 px-4 font-bold text-slate-600 w-24">序号 (Index)</th>
                  <th className="py-3 px-4 font-bold text-slate-600">您的答案 (Your Answer)</th>
                  <th className="py-3 px-4 font-bold text-slate-600">正确答案 (Correct Answer)</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-center w-28">评判 (Result)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blankSegments.map((item, index) => {
                  const segment = item.seg;
                  const isCorrect = segment.userAnswer.trim().toLowerCase() === (segment.wordToFill || "").trim().toLowerCase();
                  return (
                    <tr key={segment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-indigo-600">
                        {`(${index + 1})`}
                      </td>
                      <td className={`py-3 px-4 font-serif font-semibold ${isCorrect ? 'text-emerald-700' : 'text-red-600 line-through bg-red-50/30'}`}>
                        {segment.userAnswer.trim() || <span className="text-slate-400 font-sans italic text-xs font-normal">未填答 (Blank)</span>}
                      </td>
                      <td className="py-3 px-4 font-serif font-extrabold text-emerald-600 bg-emerald-50/10">
                        {segment.wordToFill}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100/90 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                            ✓ 正确
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-100/95 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                            ✗ 错误
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
