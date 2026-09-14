import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

// 기기 내장 TTS 로는 "cat" 을 "캐트" 처럼 한글식으로 읽어버리는 문제가
// 있었다 — 인터넷이 거의 항상 되니, 실제 원어민 발음 오디오(무료
// Dictionary API)를 받아서 재생하고, 그 단어가 사전에 없거나 네트워크가
// 안 될 때만 기기 TTS로 조용히 대신한다.
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

const audioUrlCache = new Map<string, string | null>();
const player = createAudioPlayer(null);

async function resolveAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  if (audioUrlCache.has(key)) return audioUrlCache.get(key) ?? null;

  try {
    const res = await fetch(`${DICTIONARY_API}${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const phonetics: { audio?: string }[] = entry?.phonetics ?? [];
    const found = phonetics.find((p) => p.audio)?.audio ?? null;
    const url = found ? (found.startsWith('//') ? `https:${found}` : found) : null;
    audioUrlCache.set(key, url);
    return url;
  } catch {
    audioUrlCache.set(key, null);
    return null;
  }
}

let cachedVoiceId: string | null | undefined;
async function resolveEnglishVoice(): Promise<string | null> {
  if (cachedVoiceId !== undefined) return cachedVoiceId;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const english = voices.filter((v) => v.language?.toLowerCase().startsWith('en'));
    const best =
      english.find((v) => v.language?.toLowerCase() === 'en-us') ||
      english.find((v) => v.language?.toLowerCase().startsWith('en-us')) ||
      english[0];
    cachedVoiceId = best?.identifier ?? null;
  } catch {
    cachedVoiceId = null;
  }
  return cachedVoiceId;
}

function speakWithDeviceTts(word: string) {
  Speech.stop();
  resolveEnglishVoice().then((voice) => {
    Speech.speak(word, { language: 'en-US', voice: voice ?? undefined, pitch: 1.0, rate: 0.85 });
  });
}

export async function speakEnglish(word: string) {
  const url = await resolveAudioUrl(word);
  if (!url) {
    speakWithDeviceTts(word);
    return;
  }

  try {
    player.replace(url);
    player.play();
  } catch {
    speakWithDeviceTts(word);
  }
}
