import { useState } from '../hooks.js';
import { updateWord } from '../api/wordApi.js';
import { audio } from '../utils/audio.js';
import { examples as examplesService } from '../utils/examples.js';
import { storage } from '../utils/storage.js';

/**
 * Manages examples generation and display
 */
export function useExamples() {
  const [examples, setExamples] = useState([]);
  const [showExamples, setShowExamples] = useState(false);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const proxyUrl = storage.getProxyUrl();

  const loadExistingExamples = (word) => {
    if (word.examples?.length > 0) {
      setExamples(word.examples);
      setShowExamples(true);
      examplesService.preloadAudio(word.examples, proxyUrl);
    } else {
      setExamples([]);
      setShowExamples(false);
    }
  };

  const generateExamples = async (word, onUpdate) => {
    if (!word || isGeneratingExamples) return;

    // Show existing examples if available and not already showing
    if (!showExamples && word.examples?.length > 0) {
      setExamples(word.examples);
      setShowExamples(true);
      examplesService.preloadAudio(word.examples, proxyUrl);
      return;
    }

    setIsGeneratingExamples(true);

    try {
      const data = await examplesService.fetch(
        proxyUrl,
        word.original,
        word.translation,
        showExamples ? examples : [],
        word._id
      );
      
      const updatedExamples = showExamples ? [...data.examples, ...examples] : data.examples;
      setExamples(updatedExamples);
      setShowExamples(true);
      
      // Update word in database
      if (word._id) {
        await updateWord(word._id, word.original, word.translation, updatedExamples);
      }
      
      // Update history
      if (onUpdate) {
        onUpdate(updatedExamples);
      }
      
      examplesService.preloadAudio(data.examples, proxyUrl);

    } catch (error) {
      // Re-throw auth errors so they can be handled at app level
      if (error?.authError) {
        throw error;
      }
      alert(`Failed to generate examples: ${error.message}`);
    } finally {
      setIsGeneratingExamples(false);
    }
  };

  const playExample = (example, word, exampleIndex) => {
    audio.playExample(example, word, exampleIndex, proxyUrl);
  };

  const reset = () => {
    setExamples([]);
    setShowExamples(false);
  };

  return {
    examples,
    showExamples,
    isGeneratingExamples,
    loadExistingExamples,
    generateExamples,
    playExample,
    reset
  };
}
