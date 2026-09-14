import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { Slime, Speaker } from '../art';
import TopBar from '../components/TopBar';
import ProgressBar from '../components/ProgressBar';
import TraceCanvas from '../components/TraceCanvas';
import { Jelly } from '../Jelly';
import { C, darken, F, R, jellyShadow } from '../theme';
import { Profile, WordEntry } from '../types/word';
import { prefetchEnglish, speakEnglish } from '../utils/speak';

interface Props {
  profile: Profile;
  words: WordEntry[];
  onDone: () => void;
  onBack: () => void;
}

export default function StudyScreen({ profile, words, onDone, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mood, setMood] = useState<'calm' | 'happy'>('calm');
  const word = words[index];
  const isLast = index === words.length - 1;
  const hop = useRef(new Animated.Value(0)).current;

  // 단어가 화면에 뜨는 순간 발음을 미리 받아 둔다 — 스피커를 눌렀을 때
  // 곧바로 재생되게 하려는 것. 다음 단어도 같이 당겨 받아 넘어가는 순간에도
  // 기다리지 않게 한다.
  useEffect(() => {
    prefetchEnglish(word.en);
    const upcoming = words[index + 1];
    if (upcoming) prefetchEnglish(upcoming.en);
  }, [index]);

  // 가만히 있어도 가끔 씩 웃었다 돌아온다 — 계속 'happy' 로 고정해 두면
  // 표정이 살아있다는 느낌이 안 난다(QuizScreen 의 슬라임과 같은 버릇).
  useEffect(() => {
    const timer = setInterval(() => {
      setMood((m) => (m === 'calm' ? 'happy' : m));
      setTimeout(() => setMood((m) => (m === 'happy' ? 'calm' : m)), 900);
    }, 4200);
    return () => clearInterval(timer);
  }, [index]);

  function speak() {
    speakEnglish(word.en);
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 16 }),
    ]).start();
  }

  function next() {
    if (isLast) {
      onDone();
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} crownCount={profile.progress.completedSteps.length} />

      <View style={styles.body}>
        <ProgressBar current={index + 1} total={words.length} />

        <View style={styles.card}>
          <Animated.View
            style={[
              styles.mascot,
              {
                transform: [
                  { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
                  { scaleY: hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.9, 1.06] }) },
                ],
              },
            ]}
          >
            <Slime hat={profile.hat} color={profile.color} mood="happy" size={72} />
          </Animated.View>

          <Pressable style={styles.wordBox} onPress={speak}>
            <Text style={styles.wordText}>{word.en}</Text>
            <View style={styles.speakerBadge}>
              <Speaker on size={30} />
            </View>
          </Pressable>

          <Jelly
            color={C.sky}
            dark={darken(C.sky)}
            onPress={() => setRevealed((r) => !r)}
            style={styles.revealWrap}
            inner={styles.revealInner}
          >
            <Text style={styles.revealText}>{revealed ? word.ko : '뜻 보기'}</Text>
          </Jelly>

          <TraceCanvas word={word.en} key={word.en} />
        </View>

        <Jelly color={C.lime} dark={darken(C.lime)} onPress={next} style={styles.ctaWrap} inner={styles.cta}>
          <Text style={styles.ctaText}>{isLast ? '🧪 테스트 보러 가기' : '다음 단어 →'}</Text>
        </Jelly>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },

  card: {
    flex: 1,
    backgroundColor: C.sugar,
    borderRadius: R.xl,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 18,
    alignItems: 'center',
    // 예전엔 'center' 였다 — 자식 셋(wordBox·revealWrap·TraceCanvas)의 총
    // 높이가 카드보다 작을 때만 있으나 마나였고, 문제의 핵심은 TraceCanvas
    // 자체가 220px로 고정돼 있던 것이었다. 지금은 TraceCanvas 가 flex:1로
    // 남는 공간을 전부 먹으므로 'flex-start' 로 바꿔 의도를 명확히 한다 —
    // 위 두 요소는 제 크기만큼만 쓰고, 나머지는 전부 따라쓰기 칸으로 간다.
    justifyContent: 'flex-start',
    marginTop: 52,
    ...jellyShadow,
    shadowOpacity: 0.18,
  },
  mascot: { position: 'absolute', top: -52, alignSelf: 'center', zIndex: 2 },

  wordBox: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 14 },
  wordText: { fontFamily: F.num, fontSize: 44, color: C.ink },
  speakerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.milk,
    alignItems: 'center',
    justifyContent: 'center',
  },

  revealWrap: { marginBottom: 14 },
  revealInner: { paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  revealText: { fontFamily: F.round, fontSize: 18, color: '#fff' },

  ctaWrap: { width: '100%', marginTop: 16 },
  cta: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { fontFamily: F.round, fontSize: 19, color: '#fff' },
});
