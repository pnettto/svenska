import { useState, useEffect } from '../hooks.js';
import { storage } from '../utils/storage.js';
import { api } from '../utils/api.js';

/**
 * Manages word shuffling and fetching
 */
export function useWords() {
  const [shuffledWords, setShuffledWords] = useState([]);
  const [shuffledIndex, setShuffledIndex] = useState(0);

  useEffect(() => {
    const initializeWords = (words) => {
      const shuffled = api.shuffle(words);
      setShuffledWords(shuffled);
      setShuffledIndex(1);
      return shuffled[0];
    };

    // Try cached words first
    const cachedWords = storage.getCachedWords();
    if (cachedWords?.length > 0) {
      initializeWords(cachedWords);
    }

    // Fetch fresh words in background
    api.getAllWords().then(freshWords => {
      if (freshWords?.length > 0) {
        storage.saveWords(freshWords);
        // Update working words in case there has been changes
        initializeWords(freshWords);
      }
    });
  }, []);

  const getNextWord = () => {
    if (shuffledIndex < shuffledWords.length) {
      const word = shuffledWords[shuffledIndex];
      setShuffledIndex(prev => prev + 1);
      return word;
    } else {
      // Reshuffle when we run out
      const reshuffled = api.shuffle(shuffledWords);
      setShuffledWords(reshuffled);
      setShuffledIndex(1);
      return reshuffled[0];
    }
  };

  const insertWord = (word, position) => {
    setShuffledWords(prev => {
      const words = [...prev];
      words.splice(position, 0, word);
      return words;
    });
  };

  const removeWord = (wordId) => {
    setShuffledWords(prev => prev.filter(word => word._id !== wordId));
  };

  const updateWord = (updatedWord) => {
    setShuffledWords(prev => 
      prev.map(word => word._id === updatedWord._id ? updatedWord : word)
    );
  };

  const getInitialWord = () => shuffledWords[0];

  const findWordById = (wordId) => {
    return shuffledWords.find(word => 
      word._id === wordId || word.swedish === wordId
    );
  };

  return {
    shuffledWords,
    shuffledIndex,
    getNextWord,
    insertWord,
    removeWord,
    updateWord,
    getInitialWord,
    findWordById
  };
}
