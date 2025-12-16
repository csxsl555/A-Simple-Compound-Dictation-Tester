import React, { useEffect, useState, useRef } from 'react';
import { playRawAudio } from '../services/audioUtils';
import { Button } from './Button';

interface DictationPlayerProps {
  audioData: string | null;
  status: string;
}

export const DictationPlayer: React.FC<DictationPlayerProps> = ({ audioData, status }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext only once on mount
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    return () => {
      // Cleanup
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Stop audio if test changes or resets
  useEffect(() => {
    if (!audioData && isPlaying) {
      stopAudio();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioData]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { 
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlay = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!audioData) return;

    setIsPlaying(true);
    sourceNodeRef.current = await playRawAudio(
      audioData, 
      audioContextRef.current,
      () => setIsPlaying(false) // On ended
    );
  };

  if (!audioData) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <Button 
        onClick={handlePlay}
        variant={isPlaying ? "danger" : "primary"}
        className="rounded-full shadow-2xl px-6 py-4 flex items-center gap-3 text-lg"
      >
        {isPlaying ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            Stop Audio
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Play Dictation
          </>
        )}
      </Button>
    </div>
  );
};
