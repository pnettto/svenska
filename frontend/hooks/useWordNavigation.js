import { useState, useEffect } from '../hooks.js';
import { api } from '../utils/api.js';
import { audio } from '../utils/audio.js';
import { storage } from '../utils/storage.js';

/**
 * Manages word history and navigation (prev/next)
 */
export function useWordNavigation() {
  const [currentWord, setCurrentWord] = useState(null);
  const [wordHistory, setWordHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const proxyUrl = storage.getProxyUrl();

  // Update URL when current word changes
  useEffect(() => {
    if (currentWord) {
      const url = new URL(window.location);
      url.searchParams.set('word', currentWord._id || currentWord.swedish);
      window.history.replaceState({}, '', url);
    }
  }, [currentWord]);

  const displayWord = (word, addToHistory = true) => {
    setCurrentWord(word);

    if (addToHistory) {
      // Truncate future history and add new word
      setWordHistory(prev => [
        ...(historyIndex < prev.length - 1 ? prev.slice(0, historyIndex + 1) : prev),
        { ...word, examples: word.examples || [] }
      ]);
      setHistoryIndex(prev => prev + 1);
      
      // Track read count
      if (word._id) {
        api.incrementReadCount(word._id).catch(() => {});
      }
    }

    // Preload audio
    audio.preloadWord(word, proxyUrl);
    
    return word;
  };

  const goToPrevious = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentWord(wordHistory[newIndex]);
      return wordHistory[newIndex];
    }
    return null;
  };

  const goToNext = () => {
    if (historyIndex < wordHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentWord(wordHistory[newIndex]);
      return wordHistory[newIndex];
    }
    return null;
  };

  const updateExamplesInHistory = (newExamples) => {
    setWordHistory(prev => {
      const newHistory = [...prev];
      if (historyIndex >= 0 && historyIndex < newHistory.length) {
        newHistory[historyIndex].examples = newExamples;
      }
      return newHistory;
    });
  };

  const canGoPrevious = historyIndex > 0;
  const canGoNext = historyIndex < wordHistory.length - 1;

  // Get initial word ID from URL
  const getInitialWordIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('word');
  };

  return {
    currentWord,
    historyIndex,
    displayWord,
    goToPrevious,
    goToNext,
    canGoPrevious,
    canGoNext,
    updateExamplesInHistory,
    getInitialWordIdFromUrl
  };
}
