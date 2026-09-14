import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { STICKERS, Slime } from '../art';
import { Jelly } from '../Jelly';
import { C, darken, F, R, jellyShadow } from '../theme';
import { Profile } from '../types/word';

interface Props {
  profile: Profile;
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  advanced: boolean;
  stickerId: string | null;
  onRetry: () => void;
  onHome: () => void;
  onMap: () => void;
}

export default function ResultScreen({
  profile,
  score,
  correctCount,
  totalCount,
  passed,
  advanced,
  stickerId,
  onRetry,
  onHome,
  onMap,
}: Props) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sticker = stickerId ? STICKERS.find((s: any) => s.id === stickerId) : null;
  const StickerArt = sticker?.Draw;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <Slime hat={profile.hat} color={profile.color} mood={passed ? 'happy' : 'calm'} size={90} />
        <Text style={styles.title}>{passed ? '테스트 완료! 🎉' : '조금만 더 연습해봐요'}</Text>

        <Animated.View style={[styles.scoreBox, { transform: [{ scale }], opacity }]}>
          <Text style={styles.scoreValue}>{score}점</Text>
          <Text style={styles.scoreSub}>
            {correctCount} / {totalCount} 개 정답
          </Text>
        </Animated.View>

        {advanced && StickerArt ? (
          <Animated.View style={[styles.stickerBox, { transform: [{ scale }], opacity }]}>
            <StickerArt size={90} />
            <Text style={styles.stickerTitle}>"{sticker.n}" 스티커 획득!</Text>
            <Text style={styles.stickerSub}>지도에서 한 칸 전진했어요</Text>
          </Animated.View>
        ) : !passed ? (
          <Text style={styles.retryHint}>70점 이상 맞히면 지도에서 한 칸 전진해요</Text>
        ) : null}
      </View>

      <View style={styles.buttons}>
        <Jelly color={C.lime} dark={darken(C.lime)} onPress={onRetry} style={styles.btnWrap} inner={styles.btn}>
          <Text style={styles.btnText}>다시 도전</Text>
        </Jelly>
        {advanced ? (
          <Jelly color={C.sugar} dark={C.milkDeep} onPress={onMap} style={styles.btnWrap} inner={styles.btn}>
            <Text style={[styles.btnText, { color: C.ink }]}>지도에서 보기</Text>
          </Jelly>
        ) : null}
        <Jelly color={C.sugar} dark={C.milkDeep} onPress={onHome} style={styles.btnWrap} inner={styles.btn}>
          <Text style={[styles.btnText, { color: C.ink }]}>홈으로</Text>
        </Jelly>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.round, fontSize: 24, color: C.ink, marginTop: 10, marginBottom: 20 },

  scoreBox: { alignItems: 'center', marginBottom: 20 },
  scoreValue: { fontFamily: F.numBold, fontSize: 50, color: C.grape },
  scoreSub: { fontFamily: F.hand, fontSize: 16, color: C.inkSoft, marginTop: 4 },

  stickerBox: {
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: C.sugar,
    borderRadius: R.lg,
    paddingVertical: 18,
    paddingHorizontal: 24,
    ...jellyShadow,
    shadowOpacity: 0.12,
  },
  stickerTitle: { fontFamily: F.round, fontSize: 18, color: C.ink, marginTop: 8 },
  stickerSub: { fontFamily: F.hand, fontSize: 14, color: C.inkSoft, marginTop: 2 },

  retryHint: { fontFamily: F.hand, fontSize: 15, color: C.inkSoft, marginTop: 8, textAlign: 'center' },

  buttons: { paddingBottom: 24, gap: 12 },
  btnWrap: { width: '100%' },
  btn: { paddingVertical: 17, alignItems: 'center' },
  btnText: { fontFamily: F.round, fontSize: 18, color: '#fff' },
});
