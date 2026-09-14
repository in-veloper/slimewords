// 이름을 부를 때 붙이는 조사("야"/"아")를 받침 유무로 정확히 고른다.
// 고정으로 "야"만 붙이면 "해진야" 처럼 말이 안 되는 조합이 나왔다 —
// 완성형 한글의 코드값에서 종성(받침) 인덱스를 직접 계산해서 판단한다.
// 한글이 아닌 이름(영문 등)이나 빈 이름은 조사 없이 이름만 돌려준다 —
// 억지로 붙이면 그게 더 어색하다.
export function callName(name: string): string {
  const clean = (name || '').trim();
  if (!clean) return '친구';

  const last = clean[clean.length - 1];
  const code = last.charCodeAt(0);
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3;
  if (!isHangulSyllable) return clean;

  const hasBatchim = (code - 0xac00) % 28 !== 0;
  return `${clean}${hasBatchim ? '아' : '야'}`;
}
