import { useState, useEffect } from '../libs/hooks.module.js';
import { storage } from '../utils/storage.js';
import { getAllWords } from '../api/index.js';

// Shuffle array using Fisher-Yates algorithm
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Manages word shuffling and fetching
 */
export function useWords({ fetchEnabled = true } = {}) {
  const [shuffledWords, setShuffledWords] = useState([]);
  const [shuffledIndex, setShuffledIndex] = useState(0);

  const initializeWords = (words) => {
    const shuffled = shuffle(words);
    setShuffledWords(shuffled);
    setShuffledIndex(1);
    return shuffled[0];
  };

  useEffect(() => {
    const cachedWords = storage.getCachedWords();
    if (cachedWords?.length > 0) {
      initializeWords(cachedWords);
    }
  }, []);

  useEffect(() => {
    if (!fetchEnabled) return;

    let cancelled = false;

    const fetchWords = async () => {
      try {
        const freshWords = await getAllWords();
        if (!cancelled && freshWords?.length > 0) {
          storage.saveWords(freshWords);
          initializeWords(freshWords);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching words:', error);
        }
      }
    };

    fetchWords();

    return () => {
      cancelled = true;
    };
  }, [fetchEnabled]);

  const getNextWord = () => {
    if (shuffledIndex < shuffledWords.length) {
      const word = shuffledWords[shuffledIndex];
      setShuffledIndex(prev => prev + 1);
      return word;
    } else {
      // Reshuffle when we run out
      const reshuffled = shuffle(shuffledWords);
      setShuffledWords(reshuffled);
      setShuffledIndex(1);
      return reshuffled[0];
    }
  };

  const insertWord = (word, position) => {
    setShuffledWords(prev => {
      const words = [...prev];
      words.splice(position, 0, word);
      // Update cached words to include the new word
      storage.saveWords(words);
      return words;
    });
  };

  const removeWord = (wordId) => {
    setShuffledWords(prev => prev.filter(word => word._id !== wordId));
  };

  const updateWord = (updatedWord) => {
    setShuffledWords(prev => {
      const updated = prev.map(word => word._id === updatedWord._id ? updatedWord : word);
      // Update cached words to include the edited word
      storage.saveWords(updated);
      return updated;
    });
  };

  const getInitialWord = () => shuffledWords[0];

  const findWordById = (wordId) => {
    // Convert to both string and number for comparison since localStorage stores strings
    const wordIdNum = parseInt(wordId);
    const wordIdStr = String(wordId);

    return shuffledWords.find(word =>
      word._id === wordIdNum ||
      word._id === wordIdStr ||
      word.swedish === wordId ||
      String(word._id) === wordIdStr
    );
  };

  const incrementShuffleIndex = () => {
    setShuffledIndex(prev => prev + 1);
  };

  return {
    shuffledWords,
    shuffledIndex,
    getNextWord,
    insertWord,
    removeWord,
    updateWord,
    getInitialWord,
    findWordById,
    incrementShuffleIndex
  };
}
