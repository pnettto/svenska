import { useState, useEffect } from '../libs/hooks.module.js';
import { incrementReadCount } from '../api/index.js';
import { audio } from '../utils/audio.js';
import { storage } from '../utils/storage.js';

/**
 * Manages word history and navigation (prev/next)
 * Integrates with browser history API for back/forward button support
 */
export function useWordNavigation() {
  const [currentWord, setCurrentWord] = useState(null);
  const [wordHistory, setWordHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isNavigatingFromBrowser, setIsNavigatingFromBrowser] = useState(false);
  const proxyUrl = storage.getProxyUrl();

  // Handle browser back/forward button navigation
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.word) {
        // Browser navigation detected
        setIsNavigatingFromBrowser(true);
        const word = event.state.word;
        const wordId = event.state.wordId;

        // Find the word in our history
        const foundIndex = wordHistory.findIndex(
          w => (w._id || w.swedish) === wordId
        );

        if (foundIndex !== -1) {
          // Word found in history, update index and current word
          setHistoryIndex(foundIndex);
          setCurrentWord(wordHistory[foundIndex]);
        } else {
          // Word not in history (shouldn't happen), just set current word
          setCurrentWord(word);
        }

        // Preload audio
        audio.preloadWord(word, proxyUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [wordHistory, proxyUrl]);

  const displayWord = (word, addToHistory = true) => {
    setCurrentWord(word);

    if (addToHistory) {
      // Truncate future history and add new word
      const newHistory = [
        ...(historyIndex < wordHistory.length - 1 ? wordHistory.slice(0, historyIndex + 1) : wordHistory),
        { ...word, examples: word.examples || [] }
      ];
      setWordHistory(newHistory);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);

      // Create browser history entry only if not navigating from browser buttons
      if (!isNavigatingFromBrowser) {
        const url = new URL(window.location);
        url.searchParams.set('word', word._id || word.swedish);

        const state = {
          wordId: word._id || word.swedish,
          word: { ...word, examples: word.examples || [] }
        };

        // Use pushState to create a new history entry
        window.history.pushState(state, '', url);
      }

      // Reset browser navigation flag
      setIsNavigatingFromBrowser(false);

      // Track read count
      if (word._id) {
        incrementReadCount(word._id).catch(() => { });
      }
    }

    // Preload audio
    audio.preloadWord(word, proxyUrl);

    return word;
  };

  const goToPrevious = () => {
    if (historyIndex > 0) {
      // Let browser back trigger the popstate event which will update state
      window.history.back();
      return wordHistory[historyIndex - 1];
    }
    return null;
  };

  const goToNext = () => {
    if (historyIndex < wordHistory.length - 1) {
      // Let browser forward trigger the popstate event which will update state
      window.history.forward();
      return wordHistory[historyIndex + 1];
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
