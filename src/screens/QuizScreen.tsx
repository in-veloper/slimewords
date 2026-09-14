import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

// @ts-ignore - art.js 는 순수 JS.
import { Slime, Speaker } from '../art';
import AnswerButton, { AnswerFeedback } from '../components/AnswerButton';
import FeedbackOverlay from '../components/FeedbackOverlay';
import ProgressBar from '../components/ProgressBar';
import TopBar from '../components/TopBar';
import { C, F, jellyShadow } from '../theme';
import { Profile, QuizQuestion } from '../types/word';
import { speakEnglish } from '../utils/speak';

interface Props {
  profile: Profile;
  questions: QuizQuestion[];
  onFinish: (score: number, correctCount: number) => void;
  onBack: () => void;
}

const CORRECT_DELAY = 950;
const WRONG_DELAY = 1200;

export default function QuizScreen({ profile, questions, onFinish, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ optionIndex: number; type: AnswerFeedback } | null>(null);
  const [message, setMessage] = useState('');
  const [locked, setLocked] = useState(false);
  const correctRef = useRef(0);

  const question = questions[index];

  function speak() {
    speakEnglish(question.word.en);
  }

  function handleAnswer(option: string, optionIndex: number) {
    if (locked) return;
    setLocked(true);

    const isCorrect = option === question.word.ko;
    if (isCorrect) {
      correctRef.current += 1;
      setFeedback({ optionIndex, type: 'correct' });
      setMessage('정답이에요! 🎉');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setFeedback({ optionIndex, type: 'wrong' });
      setMessage(`괜찮아요! 정답은 "${question.word.ko}"예요`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }

    setTimeout(
      () => {
        if (index + 1 >= questions.length) {
          const score = Math.round((correctRef.current / questions.length) * 100);
          onFinish(score, correctRef.current);
          return;
        }
        setIndex((i) => i + 1);
        setFeedback(null);
        setMessage('');
        setLocked(false);
      },
      isCorrect ? CORRECT_DELAY : WRONG_DELAY
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} crownCount={profile.progress.completedSteps.length} />

      <View style={styles.body}>
        <ProgressBar current={index + 1} total={questions.length} />

        <View style={styles.center}>
          <View style={styles.mascotWrap}>
            <Slime hat={profile.hat} color={profile.color} mood="happy" size={64} />
          </View>
          <Pressable style={styles.wordCard} onPress={speak}>
            <Text style={styles.wordText}>{question.word.en}</Text>
            <View style={styles.speakerBadge}>
              <Speaker on size={20} />
            </View>
          </Pressable>
          <Text style={styles.hint}>무슨 뜻일까요?</Text>
        </View>

        <View style={styles.answers}>
          <View style={styles.row}>
            {question.options.slice(0, 2).map((opt, i) => (
              <AnswerButton
                key={`${index}-${i}`}
                label={opt}
                onPress={() => handleAnswer(opt, i)}
                feedback={feedback?.optionIndex === i ? feedback.type : null}
                disabled={locked}
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
                feedback={feedback?.optionIndex === i + 2 ? feedback.type : null}
                disabled={locked}
                colorIndex={i + 2}
              />
            ))}
          </View>
        </View>
      </View>

      <FeedbackOverlay
        visible={!!feedback}
        type={feedback?.type ?? null}
        message={message}
        optionIndex={feedback?.optionIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  mascotWrap: {},
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.sugar,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 32,
    ...jellyShadow,
    shadowOpacity: 0.14,
  },
  wordText: { fontFamily: F.num, fontSize: 40, color: C.ink },
  speakerBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.milk, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: F.hand, fontSize: 16, color: C.inkSoft },
  answers: { gap: 14, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 14 },
});
