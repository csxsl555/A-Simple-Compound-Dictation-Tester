import React, { useEffect, useState, useRef } from 'react';
import { playRawAudio } from '../services/audioUtils';
import { Button } from './Button';

interface DictationPlayerProps {
  audioData: string | null;
  fullText?: string | null;
  status: string;
}

export const DictationPlayer: React.FC<DictationPlayerProps> = ({ audioData, fullText, status }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
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
      return;
    }

    // Fallback to browser SpeechSynthesis if fullText exists
    if (fullText && typeof window !== "undefined" && window.speechSynthesis) {
      setIsSynthPlaying(true);
      window.speechSynthesis.cancel();

      // Clean up brackets for listening
      const cleanText = fullText.replace(/\{/g, "").replace(/\}/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Load best English voice
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft')))
                    || voices.find(v => v.lang.startsWith('en'))
                    || voices[0];
                    
      if (enVoice) {
        utterance.voice = enVoice;
      }
      
      // 0.82-0.85 rate is extremely standard and legible for dictation
      utterance.rate = 0.82;

      utterance.onend = () => {
        setIsSynthPlaying(false);
      };
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        setIsSynthPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const hasAudio = !!audioData || !!fullText;
  if (!hasAudio) return null;

  const activePlay = isPlaying || isSynthPlaying;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <Button 
        onClick={handlePlay}
        variant={activePlay ? "danger" : "primary"}
        className="rounded-full shadow-2xl px-6 py-4 flex items-center gap-3 text-lg font-black tracking-wide"
      >
        {activePlay ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            停止播放 (Stop)
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            播放听写 {isSynthPlaying || !audioData ? "(Web 语音合成)" : ""}
          </>
        )}
      </Button>
    </div>
  );
};
