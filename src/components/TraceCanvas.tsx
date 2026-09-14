import { useEffect, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// @ts-ignore - art.js 는 순수 JS.
import { Erase } from '../art';
import { C, F, R } from '../theme';

// 짧은 단어는 크게, 긴 단어는 넘치지 않게 조금 줄인다 — 고정 크기로는
// "cat" 은 헐렁하고 "watermelon" 은 카드 밖으로 삐져나왔다.
function guideFontSize(word: string): number {
  if (word.length <= 4) return 104;
  if (word.length <= 6) return 88;
  if (word.length <= 8) return 72;
  return 58;
}

interface Props {
  word: string;
}

// 웹에서 드래그하면 브라우저가 텍스트 선택 제스처로 오인해서 글자마다
// 파랗게 하이라이트되는 문제가 있었다 — userSelect/touchAction 을 꺼서 막는다.
const noSelect = Platform.OS === 'web' ? ({ userSelect: 'none', touchAction: 'none' } as const) : null;

// ---- "오른쪽/아래는 안 써진다"던 버그의 진짜 원인은 좌표 계산이 아니었다 ----
// 실제 DOM 을 직접 열어서 재보니, 손글씨가 그려지는 <Svg> 엘리먼트 자체가
// 브라우저 기본 크기인 300x150px 로 렌더링되고 있었다 — style 로 absoluteFill
// (top/right/bottom/left: 0)만 줬을 뿐 width/height 를 명시하지 않았더니,
// 웹에서 react-native-svg 의 <svg> 태그가 CSS 로 부모 크기만큼 늘어나지
// 않고 SVG 표준 기본값(300x150)을 그대로 쓴 것. 흰 테두리 박스(터치를 받는
// 영역)는 늘 화면 꽉 찬 크기였지만, 그 안에서 선이 실제로 그려지는 캔버스는
// 왼쪽 위 300x150 만큼만 있었던 셈 — 그래서 손은 상자 전체를 눌러도 선은
// 항상 왼쪽 위 한 귀퉁이 안에서만 보였다. width="100%" height="100%" 를
// <Svg> 에 명시해서 진짜로 부모를 꽉 채우게 한 것이 이번 수정의 핵심이다.
//
// 좌표 계산 쪽도 같이 더 단단하게 바꿨다 — 웹에서는 RN 의 PanResponder(및
// onLayout 시점에 캐싱해 둔 화면 좌표) 대신 브라우저 DOM 포인터 이벤트를
// 직접 붙이고, getBoundingClientRect() 를 이벤트가 올 때마다 그 순간 다시
// 잰다. 네이티브(안드로이드)는 RN 이 주는 locationX/Y 가 이미 "이 뷰 기준"
// 상대좌표라 별도 계산 없이 PanResponder 를 그대로 쓴다.
export default function TraceCanvas({ word }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const drawing = useRef(false);
  const canvasRef = useRef<View>(null);
  const fontSize = useMemo(() => guideFontSize(word), [word]);

  function appendPoint(x: number, y: number, isStart: boolean) {
    setPaths((prev) => {
      if (isStart) return [...prev, `M${x.toFixed(1)},${y.toFixed(1)}`];
      if (prev.length === 0) return prev;
      const next = prev.slice();
      next[next.length - 1] += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      return next;
    });
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = canvasRef.current as unknown as HTMLElement | null;
    if (!node) return;

    function toLocal(clientX: number, clientY: number) {
      const rect = node!.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function onDown(e: PointerEvent) {
      e.preventDefault();
      drawing.current = true;
      try {
        node!.setPointerCapture?.(e.pointerId);
      } catch {}
      const { x, y } = toLocal(e.clientX, e.clientY);
      appendPoint(x, y, true);
    }
    function onMove(e: PointerEvent) {
      if (!drawing.current) return;
      const { x, y } = toLocal(e.clientX, e.clientY);
      appendPoint(x, y, false);
    }
    function onUp() {
      drawing.current = false;
    }

    node.addEventListener('pointerdown', onDown);
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onUp);
    return () => {
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        drawing.current = true;
        const { locationX, locationY } = e.nativeEvent;
        appendPoint(locationX, locationY, true);
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        if (!drawing.current) return;
        const { locationX, locationY } = e.nativeEvent;
        appendPoint(locationX, locationY, false);
      },
      onPanResponderRelease: () => {
        drawing.current = false;
      },
    })
  ).current;

  return (
    <View style={styles.wrap}>
      <View
        ref={canvasRef}
        style={[styles.canvas, noSelect as any]}
        {...(Platform.OS === 'web' ? {} : panResponder.panHandlers)}
      >
        <Text style={[styles.guide, { fontSize }, noSelect as any]} pointerEvents="none" selectable={false}>
          {word}
        </Text>
        {/* width/height="100%" 를 명시해야 한다 — style만으로는(absoluteFill)
            웹에서 <svg> 가 브라우저 기본 크기인 300x150 으로 남아 있었다.
            눈에 보이는 흰 테두리 박스는 항상 꽉 찬 크기였지만, 실제로 선이
            그려지는 SVG 캔버스 자체는 왼쪽 위 300x150 만큼만 있었던 것 —
            "오른쪽/아래는 안 써진다"던 버그의 진짜 정체가 이거였다. 좌표
            계산은 처음부터 맞았고, 그 좌표를 받아줄 그릇이 작았을 뿐이다. */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke="#2B2230" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
      </View>
      <Pressable style={styles.clearBtn} onPress={() => setPaths([])} hitSlop={10}>
        <Erase size={20} />
        <Text style={styles.clearText}>지우기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: '100%', alignItems: 'center' },
  canvas: {
    flex: 1,
    width: '100%',
    minHeight: 200,
    backgroundColor: C.sugar,
    borderRadius: R.lg,
    borderWidth: 3,
    borderColor: C.milkDeep,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  guide: {
    fontFamily: F.numBold,
    color: 'rgba(74, 43, 69, 0.14)',
    textAlign: 'center',
  },
  clearBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 16,
    height: 40,
    borderRadius: R.pill,
    backgroundColor: C.sugar,
    borderWidth: 2,
    borderColor: C.milkDeep,
  },
  clearText: { fontFamily: F.hand, fontSize: 15, color: C.inkSoft },
});
