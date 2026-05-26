import { DictationSegment } from '../types';

interface Chunk {
  text: string;
  isWord: boolean;
  wordIndex: number; // index inside wordsOnly list
}

interface BlankInterval {
  startWordIdx: number; // index in wordsOnly
  count: number;
}

/**
 * Automatically creates cloze blanks from standard prose.
 * Matches word-like sequences and selects non-overlapping intervals.
 */
export function autoDigBlanks(
  fullText: string,
  numBlanks: number,
  minWords: number,
  maxWords: number
): { content: string; segments: DictationSegment[] } {
  // 1. Split text into words (including apostrophes/hyphens) vs non-words
  const regex = /([A-Za-z0-9'-]+)/g;
  const parts = fullText.split(regex);

  const chunks: Chunk[] = [];
  const wordsOnly: { chunkIndex: number; text: string }[] = [];

  parts.forEach((part) => {
    if (!part) return;
    const isW = /^[A-Za-z0-9'-]+$/.test(part);
    const chunkIndex = chunks.length;

    if (isW) {
      chunks.push({
        text: part,
        isWord: true,
        wordIndex: wordsOnly.length
      });
      wordsOnly.push({ chunkIndex, text: part });
    } else {
      chunks.push({
        text: part,
        isWord: false,
        wordIndex: -1
      });
    }
  });

  const totalWords = wordsOnly.length;
  if (totalWords === 0) {
    return {
      content: fullText,
      segments: [{
        id: Math.random().toString(36).substring(2, 11),
        textBefore: fullText,
        wordToFill: null,
        userAnswer: ""
      }]
    };
  }

  const selectedIntervals: BlankInterval[] = [];

  // Helper to verify that a potential blank candidate does not overlap with existing blanks
  // We prefer to keep a 1-word gap padding for readability, but can relax this if needed.
  const isValidCandidate = (start: number, count: number, usePadding: boolean): boolean => {
    if (start < 0 || start + count > totalWords) return false;
    const padding = usePadding ? 1 : 0;
    
    for (const interval of selectedIntervals) {
      const existingStart = interval.startWordIdx;
      const existingEnd = interval.startWordIdx + interval.count;

      const candidateStart = start;
      const candidateEnd = start + count;

      // Check overlapping check with padding
      if (candidateStart < existingEnd + padding && candidateEnd > existingStart - padding) {
        return false;
      }
    }
    return true;
  };

  const minW = Math.max(1, minWords);
  const maxW = Math.max(minW, maxWords);

  let attempts = 0;
  let usePadding = true;
  const targetBlanks = Math.min(numBlanks, Math.ceil(totalWords / minW));

  while (selectedIntervals.length < targetBlanks && attempts < 500) {
    attempts++;

    // Random word count for the blank within user's specified bounds
    const size = Math.floor(Math.random() * (maxW - minW + 1)) + minW;
    // Ensure bounds
    if (size > totalWords) continue;
    
    const startWordIdx = Math.floor(Math.random() * (totalWords - size + 1));

    if (isValidCandidate(startWordIdx, size, usePadding)) {
      selectedIntervals.push({ startWordIdx, count: size });
    }

    // Relax the spacing requirement if we aren't finding slots
    if (attempts === 200 && usePadding) {
      usePadding = false;
    }
  }

  // Linear layout demands sorted intervals
  selectedIntervals.sort((a, b) => a.startWordIdx - b.startWordIdx);

  // Re-generate segments and dynamic brace content
  const segments: DictationSegment[] = [];
  let currentTextBefore = "";
  let chunkIdx = 0;

  while (chunkIdx < chunks.length) {
    const chunk = chunks[chunkIdx];

    const matchedInterval = chunk.isWord
      ? selectedIntervals.find(interval => interval.startWordIdx === chunk.wordIndex)
      : null;

    if (matchedInterval) {
      const blankWordEndIdx = matchedInterval.startWordIdx + matchedInterval.count;
      let blankText = "";

      // Gather words and inside-blank spacing
      while (chunkIdx < chunks.length) {
        const activeChunk = chunks[chunkIdx];
        if (activeChunk.isWord && activeChunk.wordIndex >= blankWordEndIdx) {
          break;
        }
        blankText += activeChunk.text;
        chunkIdx++;
      }

      segments.push({
        id: Math.random().toString(36).substring(2, 11),
        textBefore: currentTextBefore,
        wordToFill: blankText.trim(),
        userAnswer: ""
      });

      currentTextBefore = "";
    } else {
      currentTextBefore += chunk.text;
      chunkIdx++;
    }
  }

  if (currentTextBefore) {
    segments.push({
      id: Math.random().toString(36).substring(2, 11),
      textBefore: currentTextBefore,
      wordToFill: null,
      userAnswer: ""
    });
  }

  // Create braced alternative text for reference if needed
  let bracedContent = "";
  let tempIdx = 0;
  while (tempIdx < chunks.length) {
    const chunk = chunks[tempIdx];
    const itemInterval = chunk.isWord ? selectedIntervals.find(i => i.startWordIdx === chunk.wordIndex) : null;
    if (itemInterval) {
      let bText = "";
      const endWord = itemInterval.startWordIdx + itemInterval.count;
      while (tempIdx < chunks.length) {
        const innerChunk = chunks[tempIdx];
        if (innerChunk.isWord && innerChunk.wordIndex >= endWord) break;
        bText += innerChunk.text;
        tempIdx++;
      }
      bracedContent += `{${bText.trim()}}`;
    } else {
      bracedContent += chunk.text;
      tempIdx++;
    }
  }

  return {
    content: bracedContent,
    segments: segments
  };
}
