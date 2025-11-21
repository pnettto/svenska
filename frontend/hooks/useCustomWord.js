import { useState } from '../hooks.js';
import { api } from '../utils/api.js';
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
      const result = await api.generateRandomWord();
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

  const submitCustomWord = async (swedish, onSuccess) => {
    if (!swedish.trim()) {
      alert('Vänligen fyll i ett svenskt ord / Please enter a Swedish word');
      return;
    }

    setIsTranslating(true);

    try {
      const translation = await words.translate(proxyUrl, swedish);
      const newWord = await api.createWord(swedish, translation, []);
      if (!newWord) throw new Error('Failed to create word');

      setModalOpen(false);
      
      if (onSuccess) {
        onSuccess(newWord);
      }

    } catch (error) {
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
    submitCustomWord
  };
}
