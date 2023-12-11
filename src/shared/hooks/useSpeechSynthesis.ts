import { useState } from 'react';
import { useEffectOnce } from 'usehooks-ts';
import { SYNTH_LANG } from '../constant/constant';

export function useSpeechSynthesis(lang = SYNTH_LANG) {
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);

  useEffectOnce(() => {
    const checkSpeechAvailability = () => {
      const isAvailable = window.speechSynthesis
        .getVoices()
        .some((voice) => voice.lang === lang);
      setIsSpeechAvailable(isAvailable);
    };
    const eventListener = () => {
      checkSpeechAvailability();
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        eventListener,
      );
    };

    checkSpeechAvailability();
    window.speechSynthesis.addEventListener('voiceschanged', eventListener);

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        eventListener,
      );
    };
  });

  function speak(text: string) {
    if (!isSpeechAvailable) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance();
    speech.lang = lang;
    speech.text = text;

    window.speechSynthesis.speak(speech);
  }

  return {
    speak,
    isSpeechAvailable,
  };
}
