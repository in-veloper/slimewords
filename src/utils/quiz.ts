import { WORD_LIST } from '../data/words';
import { QuizQuestion, WordEntry } from '../types/word';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 오늘 배운 단어 목록으로 문제를 만든다. 오답 보기는 전체 단어에서 아무거나
// 뽑는다 — 뜻이 서로 안 겹치기만 하면 되고, 굳이 비슷한 뜻일 필요는 없다.
export function buildQuiz(words: WordEntry[]): QuizQuestion[] {
  return shuffle(words).map((word) => {
    const distractPool = WORD_LIST.filter((w) => w.ko !== word.ko);
    const distractors = shuffle(distractPool)
      .slice(0, 3)
      .map((w) => w.ko);
    return { word, options: shuffle([word.ko, ...distractors]) };
  });
}
