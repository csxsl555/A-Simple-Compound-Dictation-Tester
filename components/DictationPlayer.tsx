import React, { useEffect, useState, useRef } from 'react';
import { playRawAudio } from '../services/audioUtils';
import { Button } from './Button';
import { Play, Square, Gauge } from 'lucide-react';

interface DictationPlayerProps {
  audioData: string | null;
  fullText?: string | null;
  status: string;
}

export const DictationPlayer: React.FC<DictationPlayerProps> = ({ audioData, fullText, status }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const [rate, setRate] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("CD_SPEECH_RATE");
      return savedRate ? parseFloat(savedRate) : 0.8;
    }
    return 0.8;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext only once on mount
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Trigger voices load for SpeechSynthesis (for Chrome/Safari lazy-load)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      // Cleanup
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop audio if test changes or resets
  useEffect(() => {
    if (!audioData && !fullText && (isPlaying || isSynthPlaying)) {
      stopAudio();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioData, fullText]);

  // Real-time speed adjustment for AudioBufferSourceNode (PCM audio)
  useEffect(() => {
    if (sourceNodeRef.current && isPlaying) {
      try {
        sourceNodeRef.current.playbackRate.value = rate;
      } catch (e) {
        console.warn("Failed to set playback rate on source node:", e);
      }
    }
  }, [rate, isPlaying]);

  const playSynthesis = (playbackRate: number) => {
    if (!fullText || typeof window === "undefined" || !window.speechSynthesis) return;

    // First cancel any current speech
    window.speechSynthesis.cancel();

    // Use a small timeout to allow browser speechSynthesis engine queues to clear safely
    setTimeout(() => {
      const cleanText = fullText.replace(/\{/g, "").replace(/\}/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft')))
                    || voices.find(v => v.lang.startsWith('en'))
                    || voices[0];
                    
      if (enVoice) {
        utterance.voice = enVoice;
      }
      
      utterance.rate = playbackRate;

      utterance.onend = () => {
        setIsSynthPlaying(false);
      };

      utterance.onerror = (e) => {
        // Prevent state overwrite if the user cancelled on purpose or switched speaking rate
        if (e.error !== 'interrupted' && e.error !== 'interrupted-by-new-utterance') {
          console.error("SpeechSynthesis error:", e);
          setIsSynthPlaying(false);
        }
      };

      setIsSynthPlaying(true);
      window.speechSynthesis.speak(utterance);
    }, 120);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (typeof window !== "undefined") {
      localStorage.setItem("CD_SPEECH_RATE", newRate.toString());
      
      // If speech synthesis is actively playing, trigger quick cancel-and-restart with new rate
      if (isSynthPlaying) {
        playSynthesis(newRate);
      }
    }
  };

  const stopAudio = () => {
    // Stop PCM audio
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { 
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);

    // Stop synthesis audio
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSynthPlaying(false);
  };

  const handlePlay = async () => {
    if (isPlaying || isSynthPlaying) {
      stopAudio();
      return;
    }

    // Try high quality Gemini PCM binary audio base64 first
    if (audioData) {
      setIsPlaying(true);
      sourceNodeRef.current = await playRawAudio(
        audioData, 
        audioContextRef.current,
        () => setIsPlaying(false) // On ended
      );
      if (sourceNodeRef.current) {
        sourceNodeRef.current.playbackRate.value = rate;
      }
      return;
    }

    // Fallback to browser SpeechSynthesis if fullText exists
    if (fullText) {
      playSynthesis(rate);
    }
  };

  const hasAudio = !!audioData || !!fullText;
  if (!hasAudio) return null;

  const activePlay = isPlaying || isSynthPlaying;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-6 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in transition-all">
      <div className="flex flex-col gap-2 w-full md:w-auto flex-1">
        <div className="flex items-center justify-between md:justify-start gap-4">
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-4 h-4 text-indigo-500" />
            <span>AI 语速调节 (Playback Speed)</span>
          </span>
          <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-mono">
            {rate.toFixed(2)}x
          </span>
        </div>
        
        {/* Speed Slider with clear visual track */}
        <div className="flex items-center gap-4 w-full">
          <span className="text-xs text-slate-400 font-semibold shrink-0">极慢 (0.5x)</span>
          <input
            id="speed-range"
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={rate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <span className="text-xs text-slate-400 font-semibold shrink-0">极快 (1.5x)</span>
        </div>

        {/* Speed Presets */}
        <div className="flex gap-2 mt-1">
          {[0.6, 0.8, 1.0, 1.2, 1.4].map((preset) => (
            <button
              key={preset}
              onClick={() => handleRateChange(preset)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold font-mono transition-all duration-150 ${
                Math.abs(rate - preset) < 0.01
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-150"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {preset.toFixed(1)}x
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block h-12 w-px bg-slate-100 self-stretch"></div>

      <Button 
        onClick={handlePlay}
        variant={activePlay ? "danger" : "primary"}
        className="rounded-2xl shadow-md px-8 py-4 flex items-center justify-center gap-3 text-base font-black tracking-wide w-full md:w-auto shrink-0 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
      >
        {activePlay ? (
          <>
            <Square className="w-5 h-5 fill-current stroke-none" />
            <span>停止播放 (Stop Audio)</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current stroke-none animate-pulse" />
            <span>播放听写 (Play dictation)</span>
          </>
        )}
      </Button>
    </div>
  );
};
