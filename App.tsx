import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Gaegu_700Bold } from '@expo-google-fonts/gaegu';

import ProfileModal from './src/components/ProfileModal';
import HomeScreen from './src/screens/HomeScreen';
import ModeScreen from './src/screens/ModeScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import StickerScreen from './src/screens/StickerScreen';
import StudyScreen from './src/screens/StudyScreen';
import {
  addProfile,
  completeStep,
  loadActiveProfileId,
  loadProfiles,
  removeProfile,
  resetProgress,
  setActiveProfileId,
  suggestColor,
  updateProfile,
} from './src/storage/wordStorage';
import { C } from './src/theme';
import { DEFAULT_QUIZ_LENGTH, Difficulty, Profile, QuizQuestion, WordEntry } from './src/types/word';
import { getRandomWords, getStepWords } from './src/utils/dayWords';
import { buildQuiz } from './src/utils/quiz';

SplashScreen.preventAutoHideAsync().catch(() => {});

const MAX_PROFILES = 8;

type Screen = 'pick' | 'menu' | 'study' | 'quiz' | 'result' | 'stickers';

interface QuizResult {
  step: number;
  words: WordEntry[];
  totalCount: number;
  score: number;
  correctCount: number;
  passed: boolean;
  earnedStickerId: string | null;
}

export default function App() {
  const [fontsReady] = useFonts({ Jua_400Regular, Fredoka_600SemiBold, Fredoka_700Bold, Gaegu_700Bold });
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('pick');

  const [profileModal, setProfileModal] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  });

  const [playingStep, setPlayingStep] = useState(0);
  const [playingWords, setPlayingWords] = useState<WordEntry[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    (async () => {
      const savedProfiles = await loadProfiles();
      const savedActive = await loadActiveProfileId();
      if (savedProfiles.length > 0) {
        setProfiles(savedProfiles);
        const validActive = savedProfiles.find((p) => p.id === savedActive);
        if (validActive) setActiveId(validActive.id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (fontsReady && !loading) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, loading]);

  const activeProfile = profiles.find((p) => p.id === activeId) || null;
  const editingProfile = profileModal.editingId ? profiles.find((p) => p.id === profileModal.editingId) : null;

  const handleSaveProfile = useCallback(
    async (data: { name: string; hat: string; color: string; difficulty: Difficulty; quizLength: number }) => {
      if (profileModal.editingId) {
        const next = await updateProfile(profileModal.editingId, data);
        setProfiles(next);
      } else {
        const created = await addProfile(data.name, data.color, data.hat);
        const newProfile = created[created.length - 1];
        const next = await updateProfile(newProfile.id, data);
        setProfiles(next);
        await setActiveProfileId(newProfile.id);
        setActiveId(newProfile.id);
      }
      setProfileModal({ open: false, editingId: null });
    },
    [profileModal.editingId]
  );

  const handlePick = useCallback(async (id: string) => {
    await setActiveProfileId(id);
    setActiveId(id);
    setScreen('menu');
  }, []);

  const handleRemoveProfile = useCallback(async (id: string) => {
    const next = await removeProfile(id);
    setProfiles(next);
    setProfileModal({ open: false, editingId: null });
    setScreen('pick');
  }, []);

  const handleResetProgress = useCallback(async (id: string) => {
    const next = await resetProgress(id);
    setProfiles(next);
  }, []);

  const startStudy = useCallback(() => {
    if (!activeProfile) return;
    const step = activeProfile.progress.currentStep;
    const words = getStepWords(step, activeProfile.difficulty);
    setPlayingStep(step);
    setPlayingWords(words);
    setScreen('study');
  }, [activeProfile]);

  const startQuiz = useCallback(() => {
    const quizLength = activeProfile?.quizLength ?? DEFAULT_QUIZ_LENGTH;
    setQuiz(buildQuiz(playingWords, quizLength));
    setScreen('quiz');
  }, [playingWords, activeProfile]);

  // 모험 지도가 있던 자리를 대신하는 진입점 — 학습 화면을 거치지 않고
  // 곧바로 테스트를 만든다. "오늘의 단어"(정해진 스텝)와 달리 진도에 묶이지
  // 않고 전체 단어 곳간에서 매번 무작위로 뽑는다 — 안 그러면 그 스텝을
  // 통과하기 전까진 누를 때마다 같은 단어만 계속 나온다.
  const startQuickQuiz = useCallback(() => {
    if (!activeProfile) return;
    const step = activeProfile.progress.currentStep;
    const quizLength = activeProfile.quizLength ?? DEFAULT_QUIZ_LENGTH;
    const words = getRandomWords(quizLength);
    setPlayingStep(step);
    setPlayingWords(words);
    setQuiz(buildQuiz(words, quizLength));
    setScreen('quiz');
  }, [activeProfile]);

  const finishQuiz = useCallback(
    async (score: number, correctCount: number) => {
      if (!activeProfile) return;
      const applied = await completeStep(activeProfile.id, playingStep, score, playingWords.length);
      if (applied) {
        setProfiles(applied.profiles);
        setResult({
          step: playingStep,
          words: playingWords,
          totalCount: quiz.length,
          score,
          correctCount,
          passed: applied.passed,
          earnedStickerId: applied.earnedStickerId,
        });
      }
      setScreen('result');
    },
    [activeProfile, playingStep, playingWords, quiz.length]
  );

  if (loading || !fontsReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safe, { backgroundColor: C.milk }]} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'right', 'bottom', 'left']}>
        <StatusBar style="dark" />

        {screen === 'pick' && (
          <HomeScreen
            profiles={profiles}
            onPick={handlePick}
            onEdit={(id) => setProfileModal({ open: true, editingId: id })}
            onAdd={() => setProfileModal({ open: true, editingId: null })}
            canAdd={profiles.length < MAX_PROFILES}
          />
        )}

        {screen === 'menu' && activeProfile && (
          <ModeScreen
            profile={activeProfile}
            onStudy={startStudy}
            onQuickQuiz={startQuickQuiz}
            onOpenStickers={() => setScreen('stickers')}
            onBack={() => setScreen('pick')}
            onWho={() => setProfileModal({ open: true, editingId: activeProfile.id })}
          />
        )}

        {screen === 'study' && activeProfile && (
          <StudyScreen profile={activeProfile} words={playingWords} onDone={startQuiz} onBack={() => setScreen('menu')} />
        )}

        {screen === 'quiz' && activeProfile && (
          <QuizScreen profile={activeProfile} questions={quiz} onFinish={finishQuiz} onBack={() => setScreen('menu')} />
        )}

        {screen === 'result' && activeProfile && result && (
          <ResultScreen
            profile={activeProfile}
            score={result.score}
            correctCount={result.correctCount}
            totalCount={result.totalCount}
            passed={result.passed}
            earnedStickerId={result.earnedStickerId}
            onRetry={() => {
              setQuiz(buildQuiz(result.words, activeProfile.quizLength ?? DEFAULT_QUIZ_LENGTH));
              setScreen('quiz');
            }}
            onHome={() => setScreen('menu')}
            onStickers={() => setScreen('stickers')}
          />
        )}

        {screen === 'stickers' && activeProfile && (
          <StickerScreen profile={activeProfile} onBack={() => setScreen('menu')} />
        )}
      </SafeAreaView>

      <ProfileModal
        visible={profileModal.open}
        isNew={!profileModal.editingId}
        initial={
          editingProfile
            ? {
                name: editingProfile.name,
                hat: editingProfile.hat,
                color: editingProfile.color,
                difficulty: editingProfile.difficulty,
                quizLength: editingProfile.quizLength ?? DEFAULT_QUIZ_LENGTH,
              }
            : { name: '', hat: 'plain', color: suggestColor(profiles), difficulty: 'easy', quizLength: DEFAULT_QUIZ_LENGTH }
        }
        onClose={() => setProfileModal({ open: false, editingId: null })}
        onSave={handleSaveProfile}
        onReset={editingProfile ? () => handleResetProgress(editingProfile.id) : undefined}
        onDelete={editingProfile ? () => handleRemoveProfile(editingProfile.id) : undefined}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
