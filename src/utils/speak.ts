import { Platform } from 'react-native';
// expo-file-system 은 SDK 54 부터 File/Directory 클래스 기반 API로 바뀌었다.
// downloadAsync·cacheDirectory 같은 옛 함수형 API는 /legacy 경로에 남아 있고,
// 여기서 하려는 일(mp3 하나 받아서 캐시 폴더에 두기)에는 그쪽이 더 간단하다.
import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

// 기기 내장 TTS 로는 "cat" 을 "캐트" 처럼 한글식으로 읽어버리는 문제가 있었다.
//
// 처음엔 무료 Dictionary API(실제 사람이 녹음한 발음)를 썼는데, 실사용 단어
// 상당수가 audio 항목이 아예 없고, 있는 것도 서버 응답이 몇 초씩 걸리거나
// 통째로 멎어버리는 경우가 잦았다(watermelon 같은 흔한 단어도 15초 넘게
// 응답이 없었다) — 그때마다 기기 TTS로 빠지니 "부자연스럽게 들린다"고
// 느껴진 원인이 바로 이거였다.
//
// 그래서 구글 번역의 TTS 엔드포인트를 1순위로 쓴다. 비공식이지만 널리
// 쓰이는 경로고, 실제 신경망 합성이라 발음이 훨씬 자연스럽다. 사전에
// 없는 단어까지 전부 읽어 주고(커버리지 100%), 응답도 1초 안팎으로 빠르다.
// 한 번 받은 발음은 기기에 mp3 로 저장해 두고 재생만 다시 하므로 같은
// 단어를 반복해서 들을 때는 네트워크를 타지 않는다.
const GOOGLE_TTS = 'https://translate.google.com/translate_tts';
const FETCH_TIMEOUT_MS = 4000;

// 구글 TTS 는 요청에 Referer 헤더가 실려 있으면(브라우저는 항상 자동으로
// 붙인다) hotlink 방지로 404 를 돌려준다 — curl 로는 정상(200)인데 웹
// 브라우저에서만 실패하는 원인이 이것이었다. <meta name="referrer"
// content="no-referrer"> 를 넣으면 브라우저가 Referer 를 아예 보내지
// 않아 정상 응답을 받는다. 네이티브(안드로이드·iOS)에는 DOM 이 없으니
// 이 코드는 아무 영향도 주지 않는다 — 애초에 거기선 Referer 문제 자체가
// 없다.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const already = document.querySelector('meta[name="referrer"]');
  if (!already) {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.insertBefore(meta, document.head.firstChild);
  }
}

// 웹에서는 다운로드(fetch 기반)가 CORS 정책에 그대로 걸려 차단된다 —
// 브라우저가 <audio src="..."> 재생은 opaque cross-origin 응답도
// 허용하지만, fetch 로 바이트를 읽어 파일에 저장하려는 시도는 무조건
// 막는다. 그래서 웹에서는 아예 다운로드를 시도하지 않고 URL을 그대로
// 재생용으로 돌려준다 — 네이티브(안드로이드·iOS)에서만 내려받아 캐싱한다.
const cacheDir =
  Platform.OS !== 'web' && FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}tts/` : null;
const localUriCache = new Map<string, string>();
let dirReady: Promise<void> | null = null;

async function ensureCacheDir(): Promise<boolean> {
  if (!cacheDir) return false;
  if (!dirReady) {
    dirReady = FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => undefined);
  }
  await dirReady;
  return true;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

// 단어를 mp3 로 내려받아 캐시 폴더에 저장하고, 재생 가능한 로컬 경로를
// 돌려준다. 이미 받아둔 단어는 파일 존재만 확인하고 바로 그 경로를 쓴다.
async function resolveLocalAudio(word: string): Promise<string | null> {
  const key = word.toLowerCase().trim();
  if (!key) return null;

  const cached = localUriCache.get(key);
  if (cached) return cached;

  const hasCacheDir = await ensureCacheDir();
  const localPath = hasCacheDir ? `${cacheDir}${encodeURIComponent(key)}.mp3` : null;

  if (localPath) {
    try {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists && info.size > 0) {
        localUriCache.set(key, localPath);
        return localPath;
      }
    } catch {
      // 정보 조회가 실패해도 아래에서 새로 받으면 된다.
    }
  }

  const url = `${GOOGLE_TTS}?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(key)}`;

  try {
    if (localPath) {
      const result = await withTimeout(FileSystem.downloadAsync(url, localPath), FETCH_TIMEOUT_MS);
      if (result.status !== 200) throw new Error(`status ${result.status}`);
      localUriCache.set(key, localPath);
      return localPath;
    }

    // 캐시 디렉터리를 쓸 수 없는 환경(웹)에서는 URL을 그대로 재생한다 —
    // 위에서 넣은 no-referrer 메타 태그 덕에 이 URL도 브라우저에서 바로 재생된다.
    localUriCache.set(key, url);
    return url;
  } catch {
    if (localPath) {
      await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => undefined);
    }
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

const player = createAudioPlayer(null);

export async function speakEnglish(word: string) {
  const uri = await resolveLocalAudio(word);
  if (!uri) {
    speakWithDeviceTts(word);
    return;
  }

  try {
    player.replace(uri);
    player.play();
  } catch {
    speakWithDeviceTts(word);
  }
}

// 학습 화면에 단어가 뜨는 순간 미리 받아 두면, 정작 스피커를 눌렀을 때는
// 캐시에서 바로 재생돼 지연이 없다. 실패해도 조용히 무시 — speakEnglish 가
// 그때 가서 다시 시도하거나 기기 TTS로 대신한다.
export function prefetchEnglish(word: string) {
  resolveLocalAudio(word).catch(() => undefined);
}
