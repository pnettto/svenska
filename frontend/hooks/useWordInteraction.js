import { useState } from '../hooks.js';
import { audio } from '../utils/audio.js';
import { storage } from '../utils/storage.js';

/**
 * Manages word translation reveal and audio playback
 */
export function useWordInteraction() {
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const proxyUrl = storage.getProxyUrl();

  const handleWordClick = (word, isGenerating) => {
    if (isGenerating) return;

    if (!translationRevealed) {
      setTranslationRevealed(true);
      audio.playWord(word, proxyUrl);
    } else {
      setTranslationRevealed(false);
    }
  };

  const playAudio = (word) => {
    if (word) {
      audio.playWord(word, proxyUrl);
    }
  };

  const reset = () => {
    setTranslationRevealed(false);
  };

  return {
    translationRevealed,
    handleWordClick,
    playAudio,
    reset
  };
}
