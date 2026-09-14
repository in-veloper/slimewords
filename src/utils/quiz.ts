import { WORD_LIST } from '../data/words';
import { DEFAULT_QUIZ_LENGTH, QuizQuestion, WordEntry } from '../types/word';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 오늘 배운 단어 목록으로 문제를 만든다. words 가 limit 보다 많아도(어려움
// 난이도로 16개를 배웠어도) 프로필에서 고른 문항 수만큼만 무작위로 뽑아
// 한 판을 구성한다. 오답 보기는 전체 단어에서 아무거나 뽑는다 — 뜻이 서로
// 안 겹치기만 하면 되고, 굳이 비슷한 뜻일 필요는 없다.
export function buildQuiz(words: WordEntry[], limit: number = DEFAULT_QUIZ_LENGTH): QuizQuestion[] {
  return shuffle(words)
    .slice(0, limit)
    .map((word) => {
      const distractPool = WORD_LIST.filter((w) => w.ko !== word.ko);
      const distractors = shuffle(distractPool)
        .slice(0, 3)
        .map((w) => w.ko);
      return { word, options: shuffle([word.ko, ...distractors]) };
    });
}
