import menuSoundUrl from '../../../assets_sound_and_start_video/звук меню.mp3';
import rejectSoundUrl from '../../../assets_sound_and_start_video/отказ.MP3';
import approveSoundUrl from '../../../assets_sound_and_start_video/согласие.MP3';
import notificationSoundUrl from '../../../assets_sound_and_start_video/уведомления.mp3';

export type SoundName = 'menu' | 'reject' | 'approve' | 'notification';

const soundUrls: Record<SoundName, string> = {
  menu: menuSoundUrl,
  reject: rejectSoundUrl,
  approve: approveSoundUrl,
  notification: notificationSoundUrl,
};

const volumes: Record<SoundName, number> = {
  menu: 0.34,
  reject: 0.7,
  approve: 0.68,
  notification: 0.72,
};

const throttleMs: Record<SoundName, number> = {
  menu: 90,
  reject: 250,
  approve: 250,
  notification: 250,
};

const audioCache = new Map<SoundName, HTMLAudioElement>();
const lastPlayedAt = new Map<SoundName, number>();
let audioUnlocked = false;

function getAudio(name: SoundName) {
  const cached = audioCache.get(name);
  if (cached) return cached;

  const audio = new Audio(soundUrls[name]);
  audio.preload = 'auto';
  audio.volume = volumes[name];
  audioCache.set(name, audio);
  return audio;
}

export function preloadSounds() {
  (Object.keys(soundUrls) as SoundName[]).forEach((name) => {
    getAudio(name).load();
  });
}

export function unlockSounds() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  (Object.keys(soundUrls) as SoundName[]).forEach((name) => {
    const audio = getAudio(name);
    const originalVolume = audio.volume;
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = originalVolume;
      })
      .catch(() => {
        audio.volume = originalVolume;
      });
  });
}

export function playSound(name: SoundName) {
  const now = Date.now();
  const last = lastPlayedAt.get(name) ?? 0;
  if (now - last < throttleMs[name]) return;

  lastPlayedAt.set(name, now);

  const audio = getAudio(name).cloneNode(true) as HTMLAudioElement;
  audio.currentTime = 0;
  audio.volume = volumes[name];
  void audio.play().catch(() => {
    // Browsers can block audio before the first trusted user action.
  });
}
