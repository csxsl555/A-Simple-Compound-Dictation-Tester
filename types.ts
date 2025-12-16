export interface DictationSegment {
  id: string;
  textBefore: string;
  wordToFill: string | null; // null if it's the final text segment
  userAnswer: string;
}

export interface DictationTest {
  title: string;
  fullText: string;
  segments: DictationSegment[];
}

export enum TestStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  READY = 'READY',
  PLAYING = 'PLAYING',
  SUBMITTED = 'SUBMITTED',
}

export interface GeneratedContentResponse {
  title: string;
  content: string; // Text with {braces} around words to blank out
}
