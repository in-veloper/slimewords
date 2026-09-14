import { useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// @ts-ignore - art.js 는 순수 JS.
import { Erase } from '../art';
import { C, F, R } from '../theme';

interface Props {
  word: string;
}

// 웹에서 드래그하면 브라우저가 텍스트 선택 제스처로 오인해서 글자마다
// 파랗게 하이라이트되는 문제가 있었다 — userSelect/touchAction 을 꺼서 막는다.
// 네이티브(안드로이드)에는 원래 없는 문제라 웹에서만 효과가 있다.
const noSelect = Platform.OS === 'web' ? ({ userSelect: 'none', touchAction: 'none' } as const) : null;

// 손가락이든 S펜이든 안드로이드에서는 똑같은 터치 이벤트로 들어오기 때문에
// 따로 구분할 필요가 없다 — PanResponder 로 좌표만 받아서 SVG 선으로
// 그대로 그려주면 둘 다 자연스럽게 따라쓰기가 된다. 맞았는지 채점은 하지
// 않는다(손 근육 연습용 — 틀렸다고 뭐라 하지 않는 게 이 앱의 원칙과 맞다).
//
// 예전엔 진행 중인 획을 ref 로 들고 있다가 강제 리렌더하는 방식이었는데,
// 다음 획을 시작하는 타이밍에 상태가 꼬여서 이전 글자가 지워지는 버그가
// 있었다 — 이제는 배열 하나(state)로만 관리한다: 손을 대면 새 획을
// 추가하고, 움직일 때마다 "마지막 획"에만 점을 이어 붙인다.
export default function TraceCanvas({ word }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const drawing = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;
        drawing.current = true;
        setPaths((prev) => [...prev, `M${locationX.toFixed(1)},${locationY.toFixed(1)}`]);
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        if (!drawing.current) return;
        const { locationX, locationY } = e.nativeEvent;
        setPaths((prev) => {
          if (prev.length === 0) return prev;
          const next = prev.slice();
          next[next.length - 1] += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
          return next;
        });
      },
      onPanResponderRelease: () => {
        drawing.current = false;
      },
    })
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={[styles.canvas, noSelect as any]} {...panResponder.panHandlers}>
        <Text style={[styles.guide, noSelect as any]} pointerEvents="none" selectable={false}>
          {word}
        </Text>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke={C.grape} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
      </View>
      <Pressable style={styles.clearBtn} onPress={() => setPaths([])} hitSlop={10}>
        <Erase size={18} color={C.inkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  canvas: {
    width: '100%',
    height: 220,
    backgroundColor: C.sugar,
    borderRadius: R.lg,
    borderWidth: 3,
    borderColor: C.milkDeep,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  guide: {
    fontFamily: F.numBold,
    fontSize: 56,
    color: 'rgba(74, 43, 69, 0.14)',
    textAlign: 'center',
  },
  clearBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: R.pill,
    backgroundColor: C.sugar,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.milkDeep,
  },
});
