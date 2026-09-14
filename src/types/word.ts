export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTIES: { id: Difficulty; label: string; perDay: number }[] = [
  { id: 'easy', label: '쉬움', perDay: 8 },
  { id: 'normal', label: '보통', perDay: 12 },
  { id: 'hard', label: '어려움', perDay: 16 },
];

export interface WordEntry {
  en: string;
  ko: string;
}

export interface QuizQuestion {
  word: WordEntry;
  options: string[]; // 한글 뜻 4개(정답 포함)
}

// 스텝(하루 분량)을 통과하면 STICKERS(art.js) 중 하나를 아이디로 기록한다 —
// 실제 그림은 art.js 의 STICKERS 배열에서 그때그때 찾아서 그린다.
export interface StepRecord {
  step: number;
  score: number; // 0~100
  earnedAt: number;
  stickerId: string;
}

export interface ProfileProgress {
  currentStep: number; // 다음에 풀 스텝(0부터 시작)
  completedSteps: StepRecord[];
  learnedWordCount: number;
}

export interface Profile {
  id: string;
  name: string;
  hat: string; // art.js HAT_IDS 중 하나
  color: string; // theme.js COLORS 아이디 중 하나
  difficulty: Difficulty;
  progress: ProfileProgress;
}
