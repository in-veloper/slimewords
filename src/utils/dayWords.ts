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
