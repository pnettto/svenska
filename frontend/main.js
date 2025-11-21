import { html } from './htm.js';
import { render } from './libs/preact.module.js';
import { useEffect } from './hooks.js';
import { WordCard, ButtonGroup, ExamplesSection, CustomWordModal } from './components.js';
import { useWords } from './hooks/useWords.js';
import { useWordNavigation } from './hooks/useWordNavigation.js';
import { useExamples } from './hooks/useExamples.js';
import { useCustomWord } from './hooks/useCustomWord.js';
import { useWordInteraction } from './hooks/useWordInteraction.js';

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

  // Initialize with first word when available
  useEffect(() => {
    const initialWord = words.getInitialWord();
    if (initialWord) {
      navigation.displayWord(initialWord);
    }
  }, [words.shuffledWords.length]);

  // Handle previous word navigation
  const handlePrevious = () => {
    if (examples.isGeneratingExamples) return;
    
    const prevWord = navigation.goToPrevious();
    if (prevWord) {
      interaction.reset();
      examples.loadExistingExamples(prevWord);
    }
  };

  // Handle next word navigation
  const handleNext = () => {
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
  };

  // Handle custom word submission
  const handleSubmitCustomWord = async (swedish) => {
    await customWord.submitCustomWord(swedish, (newWord) => {
      words.insertWord(newWord, words.shuffledIndex);
      navigation.displayWord(newWord);
      interaction.reset();
      examples.reset();
    });
  };

  const canGoPrevious = navigation.canGoPrevious && !examples.isGeneratingExamples;

  return html`
    <div>
      <button 
        class="add-word-btn" 
        onClick=${() => customWord.setModalOpen(true)}
        title="Add custom word"
      >
        +
      </button>
      
      <${CustomWordModal}
        isOpen=${customWord.modalOpen}
        onClose=${() => customWord.setModalOpen(false)}
        onSubmit=${handleSubmitCustomWord}
        isTranslating=${customWord.isTranslating}
        onGenerateRandom=${customWord.generateRandomWord}
        isGeneratingRandom=${customWord.isGeneratingRandom}
      />
      
      <div class="container">
        <${WordCard}
          word=${navigation.currentWord}
          onWordClick=${() => interaction.handleWordClick(navigation.currentWord, examples.isGeneratingExamples)}
          translationRevealed=${interaction.translationRevealed}
        />
        
        <${ButtonGroup}
          onPrevious=${handlePrevious}
          onPlay=${() => interaction.playAudio(navigation.currentWord)}
          onGenerateExamples=${() => examples.generateExamples(navigation.currentWord, navigation.updateExamplesInHistory)}
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
