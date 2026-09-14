import { StyleSheet, Text, View } from 'react-native';

import { Jelly } from '../Jelly';
import TopBar from '../components/TopBar';
import { C, darken, F, R } from '../theme';
import { DIFFICULTIES, Profile } from '../types/word';

interface Props {
  profile: Profile;
  onStudy: () => void;
  onOpenMap: () => void;
  onBack: () => void;
  onWho: () => void;
}

const MODES = [
  { id: 'study', color: C.lime, ico: '📖', t: '오늘의 단어', d: '새 단어 배우고 따라쓰기' },
  { id: 'map', color: C.tangerine, ico: '🗺️', t: '모험 지도', d: '스티커 모으러 가기' },
];

export default function ModeScreen({ profile, onStudy, onOpenMap, onBack, onWho }: Props) {
  const difficultyLabel = DIFFICULTIES.find((d) => d.id === profile.difficulty)?.label ?? '쉬움';

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} onWho={onWho} crownCount={profile.progress.completedSteps.length} />

      <View style={styles.body}>
        <Text style={styles.h1}>{profile.name}야, 무슨 놀이 할까?</Text>
        <Text style={styles.sub}>{difficultyLabel} 단어로 준비했어요</Text>

        <View style={{ gap: 14, marginTop: 4 }}>
          {MODES.map((m) => (
            <Jelly
              key={m.id}
              color={m.color}
              dark={darken(m.color)}
              onPress={m.id === 'study' ? onStudy : onOpenMap}
              inner={styles.mode}
            >
              <View style={styles.modeIcon}>
                <Text style={styles.modeIconText}>{m.ico}</Text>
              </View>
              <View>
                <Text style={styles.modeTitle}>{m.t}</Text>
                <Text style={styles.modeDesc}>{m.d}</Text>
              </View>
            </Jelly>
          ))}
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
  modeIconText: { fontSize: 28 },
  modeTitle: { fontFamily: F.round, fontSize: 22, color: '#fff' },
  modeDesc: { fontFamily: F.hand, fontSize: 16, color: '#fff', opacity: 0.92 },
});
