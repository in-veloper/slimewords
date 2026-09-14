import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';

import TopBar from '../components/TopBar';
import { C, F, R, jellyShadow } from '../theme';
import { Profile } from '../types/word';
import { MAP_LENGTH } from '../utils/dayWords';
import { stickerForStep } from '../utils/stickers';

interface Props {
  profile: Profile;
  onBack: () => void;
}

// 부루마블 판처럼 지그재그로 늘어선 칸을 위에서 아래로 스크롤해서 본다.
const ZIGZAG = [0, 46, 82, 46, 0, -46, -82, -46];

export default function MapScreen({ profile, onBack }: Props) {
  const { currentStep, completedSteps } = profile.progress;

  return (
    <View style={styles.screen}>
      <TopBar profile={profile} showBack onBack={onBack} crownCount={completedSteps.length} />
      <Text style={styles.title}>🗺️ 모험 지도</Text>

      <ScrollView contentContainerStyle={styles.body}>
        {Array.from({ length: MAP_LENGTH }).map((_, step) => {
          const record = completedSteps.find((s) => s.step === step);
          const isCompleted = !!record;
          const isCurrent = step === currentStep;
          const isLocked = !isCompleted && !isCurrent;
          const sticker = stickerForStep(step);
          const StickerArt = sticker.Draw;
          const offset = ZIGZAG[step % ZIGZAG.length];

          return (
            <Pressable
              key={step}
              style={[styles.node, { transform: [{ translateX: offset }] }]}
              onPress={() => {
                if (isCompleted) {
                  Alert.alert(`${sticker.n}`, `${step + 1}번째 칸 · 점수 ${record?.score}점`);
                } else if (isLocked) {
                  Alert.alert('아직 비밀이에요 🔒', '앞 칸부터 차례로 깨면 무슨 스티커인지 볼 수 있어요!');
                }
              }}
            >
              <View style={[styles.avatarWrap, isCompleted && jellyShadow, isCompleted && { shadowOpacity: 0.14 }, isCurrent && styles.currentRing]}>
                <View style={{ opacity: isLocked ? 0.16 : 1 }}>
                  <StickerArt size={64} />
                </View>
              </View>
              <Text style={[styles.stepNumber, isLocked && styles.stepNumberLocked]}>
                {isLocked ? '???' : step + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.milk },
  title: { fontFamily: F.round, fontSize: 22, color: C.ink, textAlign: 'center', marginTop: 6, marginBottom: 6 },

  body: { alignItems: 'center', paddingVertical: 20, paddingBottom: 60 },
  node: { alignItems: 'center', marginVertical: 14, width: 90 },
  avatarWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: C.sugar,
  },
  currentRing: { borderWidth: 3, borderColor: C.lime },
  stepNumber: {
    marginTop: 4,
    fontFamily: F.numBold,
    fontSize: 13,
    color: C.inkSoft,
    backgroundColor: C.sugar,
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  stepNumberLocked: { color: C.inkFaint },
});
