export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTIES: { id: Difficulty; label: string; perDay: number }[] = [
  { id: 'easy', label: '쉬움', perDay: 8 },
  { id: 'normal', label: '보통', perDay: 12 },
  { id: 'hard', label: '어려움', perDay: 16 },
];

// 테스트 한 판의 문항 수 — 프로필 설정에서 고른다.
export const QUIZ_LENGTHS = [10, 20, 30] as const;
export const DEFAULT_QUIZ_LENGTH = 10;

export interface WordEntry {
  en: string;
  ko: string;
}

export interface QuizQuestion {
  word: WordEntry;
  options: string[]; // 한글 뜻 4개(정답 포함)
}

// 스텝(하루 분량)을 통과했다는 기록만 남긴다 — 지도 화면을 없앤 뒤로는
// "몇 번째 판까지 통과했는지"만 알면 되고, 그 칸에서 어떤 스티커를 땄는지는
// 더 이상 의미가 없다(스티커는 profile.progress.stickers 전역 목록에서
// 등급 순서대로 쌓인다).
export interface StepRecord {
  step: number;
  score: number; // 0~100
  earnedAt: number;
}

export interface ProfileProgress {
  currentStep: number; // 다음에 풀 스텝(0부터 시작)
  completedSteps: StepRecord[];
  learnedWordCount: number;
  // semlime 처럼 테스트를 통과할 때마다(맵 전진 여부와 무관하게) 한 장씩
  // 쌓인다 — 지도 전진은 "얼마나 나아갔는지", 스티커는 "얼마나 모았는지"로
  // 서로 다른 걸 보여준다.
  stickers: string[];
}

export interface Profile {
  id: string;
  name: string;
  hat: string; // art.js HAT_IDS 중 하나
  color: string; // theme.js COLORS 아이디 중 하나
  difficulty: Difficulty;
  quizLength: number; // 테스트 한 판의 문항 수(QUIZ_LENGTHS 중 하나)
  progress: ProfileProgress;
}
