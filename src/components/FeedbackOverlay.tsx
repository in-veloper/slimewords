import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { C, F, R } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const APath = Animated.createAnimatedComponent(Path);

// 정답 버튼 위에 실제로 빨간펜으로 동그라미 친 것처럼 손글씨 느낌 원을
// 그린다(semlime 의 Fx.js 발상 그대로) — 4지선다 그리드는 항상 같은
// 자리라 버튼 좌표를 재지 않고 사분면(0~3)만으로 대략 위치를 잡는다.
const CIRCLE_D =
  'M54 9 C27 8 9 28 9 51 C9 76 29 93 53 93 C79 93 93 73 93 49 ' +
  'C93 27 78 10 55 8 C49 8 45 9 41 11';
const LEN = 300;

const QUADRANT_POS = [
  { x: SCREEN_W * 0.29, y: SCREEN_H * 0.68 },
  { x: SCREEN_W * 0.71, y: SCREEN_H * 0.68 },
  { x: SCREEN_W * 0.29, y: SCREEN_H * 0.85 },
  { x: SCREEN_W * 0.71, y: SCREEN_H * 0.85 },
];

interface Props {
  visible: boolean;
  type: 'correct' | 'wrong' | null;
  message: string;
  optionIndex?: number;
}

function CircleMark({ x, y }: { x: number; y: number }) {
  const draw = useRef(new Animated.Value(0)).current;
  const show = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    draw.setValue(0);
    show.setValue(0);
    Animated.timing(draw, { toValue: 1, duration: 420, easing: Easing.bezier(0.22, 0.75, 0.3, 1), useNativeDriver: false }).start();
    Animated.timing(show, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [x, y, draw, show]);

  const strokeDashoffset = draw.interpolate({ inputRange: [0, 1], outputRange: [LEN, 0] });
  const scale = show.interpolate({ inputRange: [0, 0.42, 0.78, 1], outputRange: [0.82, 1, 1.04, 1.16] });
  const rotate = show.interpolate({ inputRange: [0, 0.42, 1], outputRange: ['-5deg', '-3deg', '0deg'] });
  const opacity = show.interpolate({ inputRange: [0, 0.78, 1], outputRange: [1, 1, 0] });
  const bloomOpacity = show.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 0.3, 0] });
  const bloomScale = show.interpolate({ inputRange: [0, 1], outputRange: [0.35, 2.2] });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', left: x - 90, top: y - 90, width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFD6DE', opacity: bloomOpacity, transform: [{ scale: bloomScale }] }}
      />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, opacity, transform: [{ rotate }, { scale }] }}>
        <Svg width={120} height={120} viewBox="0 0 100 100">
          <APath
            d={CIRCLE_D}
            fill="none"
            stroke="#FF4D6D"
            strokeWidth={8.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={LEN}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
      </Animated.View>
    </>
  );
}

export default function FeedbackOverlay({ visible, type, message, optionIndex = 0 }: Props) {
  const wrongBounce = useRef(new Animated.Value(0)).current;
  const textPop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    if (type === 'correct') {
      textPop.setValue(0);
      Animated.spring(textPop, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
    } else if (type === 'wrong') {
      wrongBounce.setValue(0);
      Animated.spring(wrongBounce, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    }
  }, [visible, type, wrongBounce, textPop]);

  if (!visible || !type) return null;

  if (type === 'wrong') {
    const scale = wrongBounce.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
    return (
      <View pointerEvents="none" style={styles.wrongWrap}>
        <Animated.View style={[styles.wrongBubble, { transform: [{ scale }], opacity: wrongBounce }]}>
          <Text style={styles.wrongText}>{message}</Text>
        </Animated.View>
      </View>
    );
  }

  const pos = QUADRANT_POS[optionIndex % QUADRANT_POS.length];
  const textScale = textPop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1.2, 1] });

  return (
    <View pointerEvents="none" style={styles.fill}>
      <CircleMark x={pos.x} y={pos.y} />
      <Animated.Text style={[styles.correctText, { opacity: textPop, transform: [{ scale: textScale }] }]}>
        {message}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  correctText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SCREEN_H * 0.3,
    fontFamily: F.round,
    fontSize: 24,
    color: C.ink,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  wrongWrap: { position: 'absolute', left: 0, right: 0, top: SCREEN_H * 0.3, alignItems: 'center', paddingHorizontal: 30 },
  wrongBubble: {
    width: SCREEN_W * 0.8,
    backgroundColor: C.sugar,
    borderWidth: 2,
    borderColor: C.tangerine,
    borderRadius: R.xl,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  wrongText: { fontFamily: F.round, fontSize: 18, color: C.ink, textAlign: 'center' },
});
