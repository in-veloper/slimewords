import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

// @ts-ignore - art.js 는 순수 JS.
import { Slime, Speaker } from '../art';
import AnswerButton from '../components/AnswerButton';
import CrownFlyer from '../components/CrownFlyer';
import CircleMark from '../components/FeedbackOverlay';
import ProgressBar from '../components/ProgressBar';
import TopBar from '../components/TopBar';
import { C, F, jellyShadow } from '../theme';
import { Profile, QuizQuestion } from '../types/word';
import { prefetchEnglish, speakEnglish } from '../utils/speak';

interface Props {
  profile: Profile;
  questions: QuizQuestion[];
  onFinish: (score: number, correctCount: number) => void;
  onBack: () => void;
}

const NEXT_DELAY = 900;

export default function QuizScreen({ profile, questions, onFinish, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [wrongSet, setWrongSet] = useState<Set<number>>(new Set());
  const [mood, setMood] = useState<'calm' | 'happy' | 'oops'>('calm');
  const [correctSoFar, setCorrectSoFar] = useState(0);
  const [displayCrowns, setDisplayCrowns] = useState(0);
  const [mark, setMark] = useState<{ id: number; x: number; y: number } | null>(null);
  const [flyer, setFlyer] = useState<{ id: number; from: { x: number; y: number }; to: { x: number; y: number } } | null>(
    null
  );
  const [locked, setLocked] = useState(false);

  const tries = useRef(0);
  const markSeq = useRef(0);
  const cardRef = useRef<View>(null);
  const pillPos = useRef<{ x: number; y: number } | null>(null);
  const hop = useRef(new Animated.Value(0)).current;
  const cardShake = useRef(new Animated.Value(0)).current;
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleGuard = useRef(0);

  const question = questions[index];

  useEffect(() => {
    prefetchEnglish(question.word.en);
    const upcoming = questions[index + 1];
    if (upcoming) prefetchEnglish(upcoming.word.en);
  }, [index]);

  // 대기 중일 때 가끔 씩 웃었다 돌아온다 — semlime 의 슬라임과 같은 버릇.
  useEffect(() => {
    const myGuard = ++idleGuard.current;
    function schedule() {
      idleTimer.current = setTimeout(() => {
        if (idleGuard.current !== myGuard) return;
        setMood((m) => {
          if (m !== 'calm') return m;
          setTimeout(() => idleGuard.current === myGuard && setMood('calm'), 900);
          return 'happy';
        });
        schedule();
      }, 4200);
    }
    schedule();
    return () => {
      idleGuard.current++;
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [index]);

  function speak() {
    speakEnglish(question.word.en);
  }

  const playHop = useCallback(() => {
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 16 }),
    ]).start();
  }, [hop]);

  const next = useCallback(() => {
    if (index + 1 >= questions.length) {
      const score = Math.round((correctSoFar / questions.length) * 100);
      onFinish(score, correctSoFar);
      return;
    }
    setIndex((i) => i + 1);
    setWrongSet(new Set());
    setMood('calm');
    setLocked(false);
    tries.current = 0;
  }, [index, questions.length, correctSoFar, onFinish]);

  function handleAnswer(option: string, optionIndex: number) {
    if (locked || wrongSet.has(optionIndex)) return;
    const isCorrect = option === question.word.ko;

    if (isCorrect) {
      setLocked(true);
      const clean = tries.current === 0;
      if (clean) setCorrectSoFar((c) => c + 1);
      setMood('happy');
      playHop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // semlime 그대로 — 버튼이 아니라 문제 카드 한가운데에 크게 동그라미가
      // 뜨고, 왕관은 그 카드에서 상단 왕관 카운터로 날아가 도착하는 순간
      // 카운트가 올라간다.
      cardRef.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
        const center = { x: x + w / 2, y: y + h / 2 };
        setMark({ id: ++markSeq.current, x: center.x, y: center.y });
        if (pillPos.current) {
          setFlyer({ id: markSeq.current, from: center, to: pillPos.current });
        } else {
          setDisplayCrowns((c) => c + 1);
        }
      });

      setTimeout(next, NEXT_DELAY);
    } else {
      // 오답은 정답을 알려주지 않는다 — semlime 그대로, 그 버튼만 빨갛게
      // 물들이거나 따로 흔드는 대신 카드 전체가 흔들리고 슬라임이 시무룩한
      // 표정을 짓는다. 아이는 남은 보기 중에서 계속 스스로 맞힐 때까지
      // 같은 문제에 머문다.
      tries.current += 1;
      setWrongSet((prev) => new Set(prev).add(optionIndex));
      setMood('oops');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

      cardShake.setValue(0);
      Animated.sequence([
        Animated.timing(cardShake, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 0.6, duration: 70, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();

      setTimeout(() => setMood((m) => (m === 'oops' ? 'calm' : m)), 620);
    }
  }

  const hopStyle = {
    transform: [
      { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) },
      { scaleY: hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.88, 1.08] }) },
    ],
  };
  const cardShakeStyle = {
    transform: [{ translateX: cardShake.interpolate({ inputRange: [-1, 1], outputRange: [-11, 11] }) }],
  };

  return (
    <View style={styles.screen}>
      <TopBar
        profile={profile}
        showBack
        onBack={onBack}
        crownCount={displayCrowns}
        onPillLayout={(pos) => {
          pillPos.current = pos;
        }}
      />

      <View style={styles.body}>
        <ProgressBar current={index + 1} total={questions.length} />

        <Animated.View ref={cardRef} style={[styles.card, cardShakeStyle]}>
          <Animated.View style={[styles.mascot, hopStyle]}>
            <Slime hat={profile.hat} color={profile.color} mood={mood} size={78} />
          </Animated.View>

          <Pressable style={styles.wordBox} onPress={speak}>
            <Text style={styles.wordText}>{question.word.en}</Text>
            <View style={styles.speakerBadge}>
              <Speaker on size={30} />
            </View>
          </Pressable>

          <Text style={styles.hint}>무슨 뜻일까요?</Text>
        </Animated.View>

        <View style={styles.answers}>
          <View style={styles.row}>
            {question.options.slice(0, 2).map((opt, i) => (
              <AnswerButton
                key={`${index}-${i}`}
                label={opt}
                onPress={() => handleAnswer(opt, i)}
                feedback={wrongSet.has(i) ? 'wrong' : null}
                disabled={locked || wrongSet.has(i)}
                colorIndex={i}
              />
            ))}
          </View>
          <View style={styles.row}>
            {question.options.slice(2, 4).map((opt, i) => (
              <AnswerButton
                key={`${index}-${i + 2}`}
                label={opt}
                onPress={() => handleAnswer(opt, i + 2)}
                feedback={wrongSet.has(i + 2) ? 'wrong' : null}
                disabled={locked || wrongSet.has(i + 2)}
                colorIndex={i + 2}
              />
            ))}
          </View>
        </View>
      </View>

      {mark ? <CircleMark key={mark.id} x={mark.x} y={mark.y} size={200} /> : null}
      {flyer ? (
        <CrownFlyer
          key={flyer.id}
          from={flyer.from}
          to={flyer.to}
          onArrive={() => {
            setDisplayCrowns((c) => c + 1);
            setFlyer(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },

  // StudyScreen 과 같은 구조 — 마스코트가 카드 위에 걸치고, 카드 안에
  // 단어를 크게 채운다. 예전엔 이 화면만 작은 패딩 상자였어서 레이아웃이
  // 따로 놀았다.
  card: {
    flex: 1,
    backgroundColor: C.sugar,
    borderRadius: 46,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 52,
    ...jellyShadow,
    shadowOpacity: 0.18,
  },
  mascot: { position: 'absolute', top: -44, alignSelf: 'center', zIndex: 2 },

  wordBox: { alignItems: 'center', flexDirection: 'row', gap: 14, marginBottom: 14 },
  wordText: { fontFamily: F.num, fontSize: 48, color: C.ink },
  speakerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.milk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontFamily: F.hand, fontSize: 17, color: C.inkSoft },

  answers: { gap: 14, marginTop: 16 },
  row: { flexDirection: 'row', gap: 14 },
});
