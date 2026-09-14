import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore - art.js 는 순수 JS.
import { HAT_IDS } from '../art';
import { Difficulty, Profile } from '../types/word';
import { stickerForStep } from '../utils/stickers';

const PROFILES_KEY = 'slimewords/profiles';
const ACTIVE_KEY = 'slimewords/activeProfileId';

const PASS_SCORE = 70;
const COLOR_IDS = ['peach', 'grape', 'mint', 'sky', 'butter', 'cocoa'];

function newProfile(name: string, color: string, hat: string): Profile {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    hat: HAT_IDS.includes(hat) ? hat : 'plain',
    color,
    difficulty: 'easy',
    progress: { currentStep: 0, completedSteps: [], learnedWordCount: 0 },
  };
}

export async function loadProfiles(): Promise<Profile[]> {
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveProfiles(profiles: Profile[]): Promise<void> {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function loadActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, id);
}

export function suggestColor(existing: Profile[]): string {
  const used = new Set(existing.map((p) => p.color));
  return COLOR_IDS.find((c) => !used.has(c)) || COLOR_IDS[0];
}

export async function addProfile(name: string, color: string, hat = 'plain'): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = [...profiles, newProfile(name, color, hat)];
  await saveProfiles(next);
  return next;
}

export async function removeProfile(id: string): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.filter((p) => p.id !== id);
  await saveProfiles(next);
  return next;
}

export async function setDifficulty(profileId: string, difficulty: Difficulty): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.map((p) => (p.id === profileId ? { ...p, difficulty } : p));
  await saveProfiles(next);
  return next;
}

export async function updateProfile(
  profileId: string,
  patch: { name: string; hat: string; color: string; difficulty: Difficulty }
): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.map((p) => (p.id === profileId ? { ...p, ...patch } : p));
  await saveProfiles(next);
  return next;
}

export async function resetProgress(profileId: string): Promise<Profile[]> {
  const profiles = await loadProfiles();
  const next = profiles.map((p) =>
    p.id === profileId ? { ...p, progress: { currentStep: 0, completedSteps: [], learnedWordCount: 0 } } : p
  );
  await saveProfiles(next);
  return next;
}

// 테스트를 보고 나면 여기로 온다. 통과 점수(70점) 이상이고 아직 안 깬
// 스텝이면 맵에서 한 칸 전진하고 스티커를 새로 딴다. 이미 깬 스텝을 다시
// 봐서 점수만 더 잘 나온 경우엔 기록만 갱신하고 전진하지는 않는다(중복 전진 방지).
export async function completeStep(
  profileId: string,
  step: number,
  score: number,
  wordCount: number
): Promise<{ profiles: Profile[]; passed: boolean; advanced: boolean } | null> {
  const profiles = await loadProfiles();
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx < 0) return null;

  const profile = profiles[idx];
  const passed = score >= PASS_SCORE;
  const alreadyDone = profile.progress.completedSteps.some((s) => s.step === step);
  const isCurrent = step === profile.progress.currentStep;
  const advanced = passed && isCurrent && !alreadyDone;
  const stickerId = stickerForStep(step).id;

  const nextRecords = alreadyDone
    ? profile.progress.completedSteps.map((s) => (s.step === step && score > s.score ? { ...s, score } : s))
    : passed
      ? [...profile.progress.completedSteps, { step, score, earnedAt: Date.now(), stickerId }]
      : profile.progress.completedSteps;

  const nextProfile: Profile = {
    ...profile,
    progress: {
      currentStep: advanced ? profile.progress.currentStep + 1 : profile.progress.currentStep,
      completedSteps: nextRecords,
      learnedWordCount: advanced ? profile.progress.learnedWordCount + wordCount : profile.progress.learnedWordCount,
    },
  };

  const nextProfiles = [...profiles];
  nextProfiles[idx] = nextProfile;
  await saveProfiles(nextProfiles);

  return { profiles: nextProfiles, passed, advanced };
}
