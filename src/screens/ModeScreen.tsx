import { StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { Book, SlimeBadge, Sparkle } from '../art';
import TopBar from '../components/TopBar';
import { Jelly } from '../Jelly';
import { C, darken, F, R } from '../theme';
import { DIFFICULTIES, Profile } from '../types/word';
import { callName } from '../utils/korean';

interface Props {
  profile: Profile;
  onStudy: () => void;
  onQuickQuiz: () => void;
  onOpenStickers: () => void;
  onBack: () => void;
  onWho: () => void;
}

// 모험 지도는 없앴다 — "얼마나 왔는지 보기"보다 "지금 바로 실력을 확인해
// 보기"가 아이 입장에서 훨씬 자주 쓰는 동선이었다. 그 자리를 학습 없이
// 곧장 테스트로 들어가는 카드로 바꿨다.
const MODES = [
  { id: 'study', color: C.lime, Icon: Book, t: '오늘의 단어', d: '새 단어 배우고 따라쓰기' },
  { id: 'quiz', color: C.tangerine, Icon: Sparkle, t: '실력 뽐내기', d: '바로 테스트 보러 가기' },
  { id: 'stickers', color: C.grape, Icon: SlimeBadge, t: '스티커 모음', d: '테스트 볼 때마다 한 장씩' },
];

export default function ModeScreen({ profile, onStudy, onQuickQuiz, onOpenStickers, onBack, onWho }: Props) {
  const difficultyLabel = DIFFICULTIES.find((d) => d.id === profile.difficulty)?.label ?? '쉬움';
  const handlers: Record<string, () => void> = { study: onStudy, quiz: onQuickQuiz, stickers: onOpenStickers };

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} onWho={onWho} crownCount={profile.progress.completedSteps.length} />

      <View style={styles.body}>
        <Text style={styles.h1}>{callName(profile.name)}, 무슨 놀이 할까?</Text>
        <Text style={styles.sub}>{difficultyLabel} 단어로 준비했어요</Text>

        <View style={{ gap: 14, marginTop: 4 }}>
          {MODES.map((m) => {
            const Icon = m.Icon;
            return (
              <Jelly key={m.id} color={m.color} dark={darken(m.color)} onPress={handlers[m.id]} inner={styles.mode}>
                <View style={styles.modeIcon}>
                  <Icon size={30} />
                </View>
                <View>
                  <Text style={styles.modeTitle}>{m.t}</Text>
                  <Text style={styles.modeDesc}>{m.d}</Text>
                </View>
              </Jelly>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  h1: { fontFamily: F.round, fontSize: 26, color: C.ink, textAlign: 'center', marginTop: 6 },
  sub: { fontFamily: F.hand, fontSize: 17, color: C.inkSoft, textAlign: 'center', marginBottom: 18 },

  mode: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18, paddingHorizontal: 20 },
  modeIcon: {
    width: 54,
    height: 54,
    borderRadius: R.md,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: { fontFamily: F.round, fontSize: 22, color: '#fff' },
  modeDesc: { fontFamily: F.hand, fontSize: 16, color: '#fff', opacity: 0.92 },
});
