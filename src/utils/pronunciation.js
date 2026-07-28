import { TTS_AUDIO_DATA } from '../constants/ttsAudioData';

let activeAudio = null;

export const TTS_VOICE_OPTIONS = [
    { key: 'female', label: '女聲' },
    { key: 'male', label: '男聲' },
];

function stopDeviceSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

export function stopPronunciation() {
    stopDeviceSpeech();

    if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio = null;
    }
}

function speakWithDeviceTts(text) {
    if (!('speechSynthesis' in window)) {
        console.warn('此瀏覽器不支援 Web Speech API');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const localAmericanVoice =
        voices.find(
            (voice) =>
                voice.lang.toLowerCase() === 'en-us' &&
                voice.localService !== false,
        ) || voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));

    if (localAmericanVoice) utterance.voice = localAmericanVoice;
    window.speechSynthesis.speak(utterance);
}

export async function speakVocabulary(item, voiceKey = 'female') {
    if (!item?.word) return;

    stopPronunciation();
    const entry = TTS_AUDIO_DATA[`${Number(item.day)}:${Number(item.order)}`];
    const audioPath = entry?.[voiceKey];

    if (!audioPath) {
        speakWithDeviceTts(item.word);
        return;
    }

    const audio = new Audio(audioPath);
    activeAudio = audio;
    audio.addEventListener(
        'ended',
        () => {
            if (activeAudio === audio) activeAudio = null;
        },
        { once: true },
    );

    try {
        await audio.play();
    } catch (error) {
        if (activeAudio === audio) activeAudio = null;
        console.warn('預先產生的發音播放失敗，改用裝置 TTS。', error);
        speakWithDeviceTts(item.word);
    }
}
