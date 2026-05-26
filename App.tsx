import React, { useState, useCallback } from 'react';
import { TestControls } from './components/TestControls';
import { ClozeBoard } from './components/ClozeBoard';
import { DictationPlayer } from './components/DictationPlayer';
import { Button } from './components/Button';
import { ApiSettings } from './components/ApiSettings';
import { generateDictationContent, generateSpeech } from './services/geminiService';
import { autoDigBlanks } from './services/clozeUtils';
import { DictationTest, DictationSegment, TestStatus } from './types';
import { v4 as uuidv4 } from 'uuid'; 

const App: React.FC = () => {
  const [status, setStatus] = useState<TestStatus>(TestStatus.IDLE);
  const [testData, setTestData] = useState<DictationTest | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  /**
   * Parses text with {curly braces} into segments.
   */
  const parseBracedContent = (rawText: string): DictationSegment[] => {
    const parts = rawText.split(/(\{.*?\})/g);
    const segments: DictationSegment[] = [];
    
    parts.forEach((part) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const answer = part.slice(1, -1);
        if (segments.length === 0) {
           segments.push({
            id: Math.random().toString(36).substr(2, 9),
            textBefore: "",
            wordToFill: answer,
            userAnswer: ""
          });
        } else {
          const lastSeg = segments[segments.length - 1];
          if (lastSeg.wordToFill === null) {
              lastSeg.wordToFill = answer;
          } else {
               segments.push({
                id: Math.random().toString(36).substr(2, 9),
                textBefore: "",
                wordToFill: answer,
                userAnswer: ""
              });
          }
        }
      } else {
        segments.push({
          id: Math.random().toString(36).substr(2, 9),
          textBefore: part,
          wordToFill: null,
          userAnswer: ""
        });
      }
    });

    return segments.filter(s => s.textBefore || s.wordToFill);
  };

  /**
   * Parses Full Text + Question Text (with underscores) to find answers by alignment.
   */
  const parseAlignedContent = (fullText: string, questionText: string): DictationSegment[] => {
    // If no explicit question text is provided, fallback to standard brace parsing on fullText
    if (!questionText.trim()) {
      return parseBracedContent(fullText);
    }

    const segments: DictationSegment[] = [];
    const normalizedFull = fullText.replace(/\r\n/g, '\n');
    // Split by underscores (one or more)
    const parts = questionText.split(/_+/); 
    
    let currentIndex = 0;
    
    parts.forEach((part, index) => {
        // Find this part in the full text starting from where we left off
        // Note: This naive alignment assumes exact match.
        // We trim the part for searching to be forgiving about surrounding spaces
        const searchPart = part; 
        
        // Handle the case where the part might be empty (e.g. trailing blank)
        let matchIndex = -1;
        
        // Strategy: We strictly search for the substring
        if (searchPart === "") {
            // Empty part usually means consecutive underscores or blank at ends
            // If it's the last part, we might just assume end of string?
            matchIndex = currentIndex; // Immediate match
        } else {
            matchIndex = normalizedFull.indexOf(searchPart, currentIndex);
        }
        
        if (matchIndex === -1) {
            console.warn(`Alignment Warning: Could not find segment "${searchPart}" in full text.`);
            // Fallback: Just display the text, but we lost the answer tracking
            segments.push({
                id: Math.random().toString(36).substr(2, 9),
                textBefore: part,
                wordToFill: null,
                userAnswer: ""
            });
            return;
        }
        
        // If this is NOT the first part, the text strictly BETWEEN the last match end (currentIndex) 
        // and this match start (matchIndex) is the hidden answer.
        if (index > 0) {
            const answer = normalizedFull.substring(currentIndex, matchIndex);
            
            // Attach this answer to the PREVIOUS segment
            if (segments.length > 0) {
                const prev = segments[segments.length - 1];
                prev.wordToFill = answer.trim();
            }
        }
        
        // Create the new segment for the current text part
        segments.push({
            id: Math.random().toString(36).substr(2, 9),
            textBefore: part,
            wordToFill: null, // Will be filled in next iteration if there is a blank after this
            userAnswer: ""
        });
        
        // If this is the last part and it is empty string (meaning Question ended with ____),
        // we might check if there is remaining text in Full that serves as the last answer.
        if (index === parts.length - 1 && part === "" && currentIndex < normalizedFull.length) {
             const tailAnswer = normalizedFull.substring(currentIndex);
             if (segments.length > 0) {
                segments[segments.length - 1].wordToFill = tailAnswer.trim();
             }
        }

        currentIndex = matchIndex + searchPart.length;
    });
    
    return segments.filter(s => s.textBefore || s.wordToFill);
  };

  const handleGenerate = async (topic: string, difficulty: string) => {
    setStatus(TestStatus.GENERATING);
    setScore(null);
    setAudioData(null);
    setTestData(null);

    try {
      // 1. Generate Text
      const contentResponse = await generateDictationContent(topic, difficulty);
      
      // 2. Parse Segments (AI returns braced content)
      const segments = parseBracedContent(contentResponse.content);
      
      // 3. Generate Audio
      const cleanText = contentResponse.content.replace(/\{/g, '').replace(/\}/g, '');
      const audioBase64 = await generateSpeech(cleanText);

      setTestData({
        title: contentResponse.title,
        fullText: cleanText,
        segments: segments
      });
      setAudioData(audioBase64);
      setStatus(TestStatus.READY);

    } catch (error) {
      console.error("Failed to generate test", error);
      alert("Failed to generate test. Please check your API key or try again.");
      setStatus(TestStatus.IDLE);
    }
  };

  const handleManualGenerate = async (
    title: string, 
    fullText: string, 
    questionText: string,
    autoConfig?: { numBlanks: number; minWords: number; maxWords: number }
  ) => {
    setStatus(TestStatus.GENERATING);
    setScore(null);
    setAudioData(null);
    setTestData(null);

    try {
      let segments: DictationSegment[];
      let cleanTextForAudio = fullText.replace(/\{/g, '').replace(/\}/g, '');

      if (autoConfig) {
        // Use auto cloze generator
        const autoResult = autoDigBlanks(fullText, autoConfig.numBlanks, autoConfig.minWords, autoConfig.maxWords);
        segments = autoResult.segments;
        cleanTextForAudio = autoResult.content.replace(/\{/g, '').replace(/\}/g, '');
      } else {
        // 1. Parse Segments using alignment
        segments = parseAlignedContent(fullText, questionText);
      }

      // 2. Generate Audio from full text
      const audioBase64 = await generateSpeech(cleanTextForAudio);

      setTestData({
        title: title,
        fullText: cleanTextForAudio,
        segments: segments
      });
      setAudioData(audioBase64);
      setStatus(TestStatus.READY);

    } catch (error) {
      console.error("Failed to generate manual test", error);
      alert("Failed to generate audio. Please check your text length or API key.");
      setStatus(TestStatus.IDLE);
    }
  };

  const handleAnswerChange = useCallback((id: string, value: string) => {
    setTestData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        segments: prev.segments.map(seg => 
          seg.id === id ? { ...seg, userAnswer: value } : seg
        )
      };
    });
  }, []);

  const handleSubmit = () => {
    if (!testData) return;
    
    let correctCount = 0;
    let totalBlanks = 0;

    testData.segments.forEach(seg => {
      if (seg.wordToFill) {
        totalBlanks++;
        // Simple case-insensitive match. Could be improved with fuzzy match.
        if (seg.userAnswer.trim().toLowerCase() === seg.wordToFill.trim().toLowerCase()) {
          correctCount++;
        }
      }
    });

    setScore(totalBlanks === 0 ? 0 : Math.round((correctCount / totalBlanks) * 100));
    setStatus(TestStatus.SUBMITTED);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Dictation Master
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ApiSettings />
            {status === TestStatus.SUBMITTED && score !== null && (
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score</span>
                <span className={`text-xl font-black ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {score}%
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <TestControls 
          onGenerate={handleGenerate} 
          onManualGenerate={handleManualGenerate}
          isLoading={status === TestStatus.GENERATING} 
        />

        {testData && (
          <div className="animate-fade-in space-y-8">
            <ClozeBoard 
              test={testData} 
              status={status} 
              onAnswerChange={handleAnswerChange} 
            />

            {status !== TestStatus.SUBMITTED ? (
              <div className="flex justify-center pt-4">
                <Button onClick={handleSubmit} variant="success" className="px-12 py-3 text-lg">
                  Submit Answers
                </Button>
              </div>
            ) : (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center animate-fade-in">
                <h3 className="text-lg font-bold text-indigo-900 mb-2">Dictation Complete!</h3>
                <p className="text-indigo-700">
                  Review your answers above. Words in <span className="text-emerald-600 font-bold">green</span> are correct. 
                  Mistakes are crossed out in <span className="text-red-600 font-bold">red</span> with the correct answer shown below.
                </p>
                <div className="mt-4">
                   <Button onClick={() => setStatus(TestStatus.READY)} variant="secondary">
                     Retry this Test
                   </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!testData && status === TestStatus.IDLE && (
          <div className="text-center py-20 text-slate-400">
             <p className="text-lg">Select a topic or create your own test to begin.</p>
          </div>
        )}
      </main>

      <DictationPlayer audioData={audioData} fullText={testData?.fullText} status={status} />
    </div>
  );
};

export default App;
