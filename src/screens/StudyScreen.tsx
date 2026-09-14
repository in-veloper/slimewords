import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { Slime, Speaker } from '../art';
import TopBar from '../components/TopBar';
import ProgressBar from '../components/ProgressBar';
import TraceCanvas from '../components/TraceCanvas';
import { Jelly } from '../Jelly';
import { C, darken, F, R, jellyShadow } from '../theme';
import { Profile, WordEntry } from '../types/word';
import { speakEnglish } from '../utils/speak';

interface Props {
  profile: Profile;
  words: WordEntry[];
  onDone: () => void;
  onBack: () => void;
}

export default function StudyScreen({ profile, words, onDone, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const word = words[index];
  const isLast = index === words.length - 1;

  function speak() {
    speakEnglish(word.en);
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
          <View style={styles.mascot}>
            <Slime hat={profile.hat} color={profile.color} mood="happy" size={72} />
          </View>

          <Pressable style={styles.wordBox} onPress={speak}>
            <Text style={styles.wordText}>{word.en}</Text>
            <View style={styles.speakerBadge}>
              <Speaker on size={20} />
            </View>
          </Pressable>

          <Jelly
            color={C.sky}
            dark={darken(C.sky)}
            onPress={() => setRevealed((r) => !r)}
            style={styles.revealWrap}
            inner={styles.revealInner}
          >
            <Text style={styles.revealText}>{revealed ? word.ko : '뜻 보기 👀'}</Text>
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
    justifyContent: 'center',
    marginTop: 52,
    ...jellyShadow,
    shadowOpacity: 0.18,
  },
  mascot: { position: 'absolute', top: -52, alignSelf: 'center', zIndex: 2 },

  wordBox: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 18 },
  wordText: { fontFamily: F.num, fontSize: 44, color: C.ink },
  speakerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.milk,
    alignItems: 'center',
    justifyContent: 'center',
  },

  revealWrap: { marginBottom: 18 },
  revealInner: { paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  revealText: { fontFamily: F.round, fontSize: 18, color: '#fff' },

  ctaWrap: { width: '100%', marginTop: 16 },
  cta: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { fontFamily: F.round, fontSize: 19, color: '#fff' },
});
