import { useState } from '../libs/hooks.module.js';
import { createWord, generateRandomWord as generateRandomWordApi } from '../api/index.js';
import { words } from '../utils/words.js';
import { storage } from '../utils/storage.js';

/**
 * Manages custom word creation
 */
export function useCustomWord() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);
  const proxyUrl = storage.getProxyUrl();

  const generateRandomWord = async () => {
    setIsGeneratingRandom(true);
    
    try {
      const result = await generateRandomWordApi();
      if (!result) {
        throw new Error('Failed to generate random word');
      }
      return result;
    } catch (error) {
      alert('Kunde inte generera slumpord / Failed to generate random word');
      return null;
    } finally {
      setIsGeneratingRandom(false);
    }
  };

  const translateWord = async (swedish) => {
    return await words.translate(proxyUrl, swedish);
  };

  const submitCustomWord = async (swedish, onSuccess) => {
    if (!swedish.trim()) {
      alert('Vänligen fyll i ett svenskt ord / Please enter a Swedish word');
      return;
    }

    setIsTranslating(true);

    try {
      const translation = await words.translate(proxyUrl, swedish);
      const newWord = await createWord(swedish, translation, []);
      if (!newWord) throw new Error('Failed to create word');

      setModalOpen(false);
      
      if (onSuccess) {
        onSuccess(newWord);
      }

    } catch (error) {
      if (error?.authError) {
        // Re-throw auth errors so they can be handled at app level
        throw error;
      }
      alert('Kunde inte hämta översättning / Failed to fetch translation');
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    modalOpen,
    setModalOpen,
    isTranslating,
    isGeneratingRandom,
    generateRandomWord,
    submitCustomWord,
    translateWord
  };
}
