// @ts-ignore - art.js 는 순수 JS(그림 컴포넌트)라 타입 선언이 없다.
import { STICKERS } from '../art';

// 맵의 스텝 번호로 어떤 스티커를 줄지 정한다. 지도 위 같은 칸은 항상 같은
// 스티커를 보여줘야 해서(다시 봐도 안 바뀌게) 랜덤이 아니라 스텝 번호로
// 결정한다 — 스티커 목록보다 스텝이 많아지면 처음부터 다시 순환한다.
export function stickerForStep(step: number) {
  return STICKERS[step % STICKERS.length];
}
