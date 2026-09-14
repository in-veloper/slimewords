import { WORD_LIST } from '../data/words';
import { DIFFICULTIES, Difficulty, WordEntry } from '../types/word';

export const MAP_LENGTH = 40;

function perDayOf(difficulty: Difficulty): number {
  return DIFFICULTIES.find((d) => d.id === difficulty)?.perDay ?? 10;
}

// 맵의 각 칸(스텝)에 해당하는 단어들을 뽑는다. 단어 목록보다 스텝이 많아지면
// (맵을 끝까지 다 돌면) 처음부터 다시 순환한다 — 데이터가 바닥나서 맵이
// 끊기는 것보다, 복습 삼아 한 번 더 도는 게 낫다.
export function getStepWords(step: number, difficulty: Difficulty): WordEntry[] {
  const perDay = perDayOf(difficulty);
  const start = step * perDay;
  const words: WordEntry[] = [];
  for (let i = 0; i < perDay; i += 1) {
    words.push(WORD_LIST[(start + i) % WORD_LIST.length]);
  }
  return words;
}

// "실력 뽐내기"(퀵 테스트)용 — 지금 스텝에 묶이지 않고 전체 단어 곳간에서
// 매번 무작위로 한 판을 뽑는다. 오늘의 단어랑 똑같은 스텝 로직을 쓰면
// 그 스텝을 통과하기 전까진 계속 같은 단어만 나오는데, 이건 진도와 상관없이
// "그냥 한 판 해보기" 용도라 매번 다른 단어가 나오는 게 맞다. count 는
// 프로필에서 고른 문항 수(10/20/30) — 그만큼은 뽑아줘야 buildQuiz 가
// 모자라지 않게 채울 수 있다.
export function getRandomWords(count: number): WordEntry[] {
  const shuffled = [...WORD_LIST].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
