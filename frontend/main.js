import { html } from './htm.js';
import { render } from './libs/preact.module.js';
import { useEffect, useState } from './hooks.js';
import { WordCard, ButtonGroup, ExamplesSection, CustomWordModal, WordTableModal, PinModal } from './components.js';
import { useWords } from './hooks/useWords.js';
import { useWordNavigation } from './hooks/useWordNavigation.js';
import { useExamples } from './hooks/useExamples.js';
import { useCustomWord } from './hooks/useCustomWord.js';
import { useWordInteraction } from './hooks/useWordInteraction.js';
import { usePinAuth } from './hooks/usePinAuth.js';
import { api } from './utils/api.js';

/**
 * Main App Component
 * Coordinates all the custom hooks and renders the UI
 */
function App() {
  // Custom hooks for feature separation
  const words = useWords();
  const navigation = useWordNavigation();
  const examples = useExamples();
  const customWord = useCustomWord();
  const interaction = useWordInteraction();
  const pinAuth = usePinAuth();
  const [wordTableOpen, setWordTableOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);

  // Initialize with first word when available
  useEffect(() => {
    if (words.shuffledWords.length === 0) return;
    
    const wordIdFromUrl = navigation.getInitialWordIdFromUrl();
    
    if (wordIdFromUrl) {
      // Try to find the word from the URL parameter
      const wordFromUrl = words.findWordById(wordIdFromUrl);
      if (wordFromUrl) {
        navigation.displayWord(wordFromUrl);
        return;
      }
    }
    
    // Fall back to first word if no URL param or word not found
    const initialWord = words.getInitialWord();
    if (initialWord) {
      navigation.displayWord(initialWord);
    }
  }, [words.shuffledWords.length]);

  // Handle previous word navigation
  const handlePrevious = () => {
    if (examples.isGeneratingExamples) return;
    
    // Check PIN auth before allowing interaction
    if (pinAuth.shouldBlock) return;
    if (!pinAuth.recordInteraction()) return;
    
    const prevWord = navigation.goToPrevious();
    if (prevWord) {
      interaction.reset();
      examples.loadExistingExamples(prevWord);
    }
  };

  // Handle next word navigation
  const handleNext = () => {
    if (examples.isGeneratingExamples) return;

    // Check PIN auth before allowing interaction
    if (pinAuth.shouldBlock) return;
    if (!pinAuth.recordInteraction()) return;

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
  };

  // Handle custom word submission (add or edit)
  const handleSubmitCustomWord = async (swedish, english) => {
    // Check PIN auth before allowing interaction
    if (pinAuth.shouldBlock) return;
    if (!pinAuth.recordInteraction()) return;

    try {
      if (editingWord) {
        // Edit mode
        const translation = english || await customWord.translateWord(swedish);
        const updatedWord = await api.updateWord(
          editingWord._id,
          swedish,
          translation,
          editingWord.examples || []
        );
        if (updatedWord) {
          words.updateWord(updatedWord);
          if (navigation.currentWord?._id === editingWord._id) {
            navigation.displayWord(updatedWord);
          }
          setEditingWord(null);
          customWord.setModalOpen(false);
        }
      } else {
        // Add mode
        await customWord.submitCustomWord(swedish, (newWord) => {
          words.insertWord(newWord, words.shuffledIndex);
          navigation.displayWord(newWord);
          interaction.reset();
          examples.reset();
        });
      }
    } catch (error) {
      if (pinAuth.handleAuthError(error)) {
        // Auth error handled, modal will show
        return;
      }
      // Other errors already handled by the hook
    }
  };

  // Handle selecting a word from the word table
  const handleSelectWord = (word) => {
    // Check PIN auth before allowing interaction
    if (pinAuth.shouldBlock) return;
    if (!pinAuth.recordInteraction()) return;

    navigation.displayWord(word);
    interaction.reset();
    examples.loadExistingExamples(word);
  };

  // Handle word click with PIN auth
  const handleWordClick = () => {
    // Check PIN auth before allowing interaction
    if (pinAuth.shouldBlock) return;
    if (!pinAuth.recordInteraction()) return;

    interaction.handleWordClick(navigation.currentWord, examples.isGeneratingExamples);
  };

  // Handle generate examples with PIN auth
  const handleGenerateExamples = async () => {
    // Check PIN auth before allowing interaction
    if (pinAuth.shouldBlock) return;
    if (!pinAuth.recordInteraction()) return;

    try {
      await examples.generateExamples(navigation.currentWord, navigation.updateExamplesInHistory);
    } catch (error) {
      if (pinAuth.handleAuthError(error)) {
        // Auth error handled, modal will show
        return;
      }
      // Other errors already handled by the hook
    }
  };

  // Handle edit word
  const handleEditWord = (word) => {
    setEditingWord(word);
    customWord.setModalOpen(true);
  };

  // Handle delete word
  const handleDeleteWord = async (word) => {
    try {
      const success = await api.deleteWord(word._id);
      if (success) {
        // Remove from local state
        words.removeWord(word._id);
        // If it was the current word, navigate away
        if (navigation.currentWord?._id === word._id) {
          handleNext();
        }
      } else {
        alert('Delete returned false');
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (pinAuth.handleAuthError(error)) {
        // Auth error handled, modal will show
        return;
      }
      alert('Kunde inte ta bort ord / Failed to delete word');
    }
  };

  const canGoPrevious = navigation.canGoPrevious && !examples.isGeneratingExamples;

  return html`
    <div>
      <div class="top-right-buttons">
        ${pinAuth.isAuthenticated ? html`
          <button 
            class="word-table-btn" 
            onClick=${() => setWordTableOpen(true)}
            title="Se alla ord"
          >
            📋
          </button>
          <button 
            class="add-word-btn" 
            onClick=${() => customWord.setModalOpen(true)}
            title="Add custom word"
          >
            +
          </button>
        ` : html`
          <button 
            class="login-btn" 
            onClick=${() => pinAuth.setPinModalOpen(true)}
            title="Logga in"
          >
            🔓
          </button>
        `}
      </div>
      
      <${CustomWordModal}
        isOpen=${customWord.modalOpen}
        onClose=${() => { customWord.setModalOpen(false); setEditingWord(null); }}
        onSubmit=${handleSubmitCustomWord}
        isTranslating=${customWord.isTranslating}
        onGenerateRandom=${customWord.generateRandomWord}
        isGeneratingRandom=${customWord.isGeneratingRandom}
        initialWord=${editingWord}
      />

      <${WordTableModal}
        isOpen=${wordTableOpen}
        onClose=${() => setWordTableOpen(false)}
        words=${words.shuffledWords}
        onSelectWord=${handleSelectWord}
        onDeleteWord=${handleDeleteWord}
        onEditWord=${handleEditWord}
      />

      <${PinModal}
        isOpen=${pinAuth.pinModalOpen}
        onVerify=${pinAuth.verifyPin}
        isVerifying=${pinAuth.isVerifying}
        error=${pinAuth.pinError}
      />
      
      <div class="container">
        <${WordCard}
          word=${navigation.currentWord}
          onWordClick=${handleWordClick}
          translationRevealed=${interaction.translationRevealed}
        />
        
        <${ButtonGroup}
          onPrevious=${handlePrevious}
          onPlay=${() => interaction.playAudio(navigation.currentWord)}
          onGenerateExamples=${handleGenerateExamples}
          onNext=${handleNext}
          canGoPrevious=${canGoPrevious}
          isGeneratingExamples=${examples.isGeneratingExamples}
          showExamples=${examples.showExamples}
        />
        
        <${ExamplesSection}
          examples=${examples.examples}
          showExamples=${examples.showExamples}
          isGeneratingExamples=${examples.isGeneratingExamples}
          translationRevealed=${interaction.translationRevealed}
          onPlayExample=${(example, index) => examples.playExample(example, navigation.currentWord, index)}
        />
      </div>
    </div>
  `;
}

// Render the app
render(html`<${App} />`, document.body);
