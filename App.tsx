import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Gaegu_700Bold } from '@expo-google-fonts/gaegu';

import ProfileModal from './src/components/ProfileModal';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import ModeScreen from './src/screens/ModeScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
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
import { Difficulty, Profile, QuizQuestion, WordEntry } from './src/types/word';
import { getStepWords } from './src/utils/dayWords';
import { buildQuiz } from './src/utils/quiz';

SplashScreen.preventAutoHideAsync().catch(() => {});

const MAX_PROFILES = 8;

type Screen = 'pick' | 'menu' | 'study' | 'quiz' | 'result' | 'map';

interface QuizResult {
  step: number;
  words: WordEntry[];
  score: number;
  correctCount: number;
  passed: boolean;
  advanced: boolean;
  stickerId: string | null;
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
    async (data: { name: string; hat: string; color: string; difficulty: Difficulty }) => {
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
    setQuiz(buildQuiz(playingWords));
    setScreen('quiz');
  }, [playingWords]);

  const finishQuiz = useCallback(
    async (score: number, correctCount: number) => {
      if (!activeProfile) return;
      const applied = await completeStep(activeProfile.id, playingStep, score, playingWords.length);
      if (applied) {
        setProfiles(applied.profiles);
        const updated = applied.profiles.find((p) => p.id === activeProfile.id);
        const record = updated?.progress.completedSteps.find((s) => s.step === playingStep);
        setResult({
          step: playingStep,
          words: playingWords,
          score,
          correctCount,
          passed: applied.passed,
          advanced: applied.advanced,
          stickerId: applied.advanced ? record?.stickerId ?? null : null,
        });
      }
      setScreen('result');
    },
    [activeProfile, playingStep, playingWords]
  );

  if (loading || !fontsReady) {
    return (
      <SafeAreaProvider>
        <View style={[styles.safe, { backgroundColor: C.milk }]} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.safe}>
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
            onOpenMap={() => setScreen('map')}
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
            totalCount={result.words.length}
            passed={result.passed}
            advanced={result.advanced}
            stickerId={result.stickerId}
            onRetry={() => {
              setQuiz(buildQuiz(result.words));
              setScreen('quiz');
            }}
            onHome={() => setScreen('menu')}
            onMap={() => setScreen('map')}
          />
        )}

        {screen === 'map' && activeProfile && <MapScreen profile={activeProfile} onBack={() => setScreen('menu')} />}
      </View>

      <ProfileModal
        visible={profileModal.open}
        isNew={!profileModal.editingId}
        initial={
          editingProfile
            ? { name: editingProfile.name, hat: editingProfile.hat, color: editingProfile.color, difficulty: editingProfile.difficulty }
            : { name: '', hat: 'plain', color: suggestColor(profiles), difficulty: 'easy' }
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
