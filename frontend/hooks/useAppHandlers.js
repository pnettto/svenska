import { deleteWord } from '../api/index.js';

/**
 * Centralized event handlers for the app
 * Handles all user interactions with PIN auth checks
 */
export function useAppHandlers({
  words,
  navigation,
  examples,
  customWord,
  editWord,
  interaction,
  pinAuth
}) {
  // Helper to check PIN auth before actions
  const withPinAuth = (handler) => {
    return (...args) => {
      if (pinAuth.shouldBlock) return;
      if (!pinAuth.recordInteraction()) return;
      return handler(...args);
    };
  };

  // Handle previous word navigation
  const handlePrevious = withPinAuth(() => {
    if (examples.isGeneratingExamples) return;

    const prevWord = navigation.goToPrevious();
    if (prevWord) {
      interaction.reset();
      examples.loadExistingExamples(prevWord);
    }
  });

  // Handle next word navigation
  const handleNext = withPinAuth(() => {
    if (examples.isGeneratingExamples) return;

    const nextWord = navigation.goToNext();
    if (nextWord) {
      // Navigate to existing word in history
      interaction.reset();
      examples.loadExistingExamples(nextWord);
    } else {
      // Get new word from shuffle
      const newWord = words.getNextWord();
      navigation.displayWord(newWord);
      interaction.reset();
      examples.reset();
    }
  });

  // Handle custom word submission (add only)
  const handleSubmitCustomWord = withPinAuth(async (swedish, english) => {
    try {
      await customWord.submitCustomWord(swedish, (newWord) => {
        // Insert word at current position so it's available in word list
        words.insertWord(newWord, words.shuffledIndex);
        // Increment index so "next" doesn't show the same word we just inserted
        words.incrementShuffleIndex();
        // Display the new word
        navigation.displayWord(newWord);
        interaction.reset();
        examples.reset();
      });
    } catch (error) {
      if (pinAuth.handleAuthError(error)) {
        return;
      }
      // Other errors already handled by the hook
    }
  });

  // Handle edit word submission
  const handleSubmitEditWord = withPinAuth(async (swedish, english) => {
    try {
      await editWord.updateWord(swedish, english, (updatedWord) => {
        words.updateWord(updatedWord);
        if (navigation.currentWord?._id === editWord.editingWord._id) {
          // Update the word in current history position instead of adding new entry
          navigation.updateCurrentWordInHistory(updatedWord);
        }
      });
    } catch (error) {
      if (pinAuth.handleAuthError(error)) {
        return;
      }
      // Other errors already handled by the hook
    }
  });

  // Handle selecting a word from the word table
  const handleSelectWord = withPinAuth((word) => {
    navigation.displayWord(word);
    interaction.reset();
    examples.loadExistingExamples(word);
  });

  // Handle word click
  const handleWordClick = withPinAuth(() => {
    interaction.handleWordClick(navigation.currentWord, examples.isGeneratingExamples);
  });

  // Handle generate examples
  const handleGenerateExamples = withPinAuth(async () => {
    try {
      await examples.generateExamples(navigation.currentWord, navigation.updateExamplesInHistory);
    } catch (error) {
      if (pinAuth.handleAuthError(error)) {
        return;
      }
      // Other errors already handled by the hook
    }
  });

  // Handle edit word
  const handleEditWord = (word) => {
    editWord.openEditModal(word);
  };

  // Handle delete word
  const handleDeleteWord = async (word) => {
    try {
      const success = await deleteWord(word._id);
      if (success) {
        words.removeWord(word._id);
        if (navigation.currentWord?._id === word._id) {
          handleNext();
        }
      } else {
        alert('Delete returned false');
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (pinAuth.handleAuthError(error)) {
        return;
      }
      alert('Kunde inte ta bort ord / Failed to delete word');
    }
  };

  return {
    handlePrevious,
    handleNext,
    handleSubmitCustomWord,
    handleSubmitEditWord,
    handleSelectWord,
    handleWordClick,
    handleGenerateExamples,
    handleEditWord,
    handleDeleteWord
  };
}
