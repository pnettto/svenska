import { html } from './htm.js';
import { render } from './libs/preact.module.js';
import { useEffect, useState } from './libs/hooks.module.js';
import { AppHeader } from './components/AppHeader.js';
import { AppModals } from './components/AppModals.js';
import { WordLearning } from './components/WordLearning.js';
import { useWords } from './hooks/useWords.js';
import { useWordNavigation } from './hooks/useWordNavigation.js';
import { useExamples } from './hooks/useExamples.js';
import { useCustomWord } from './hooks/useCustomWord.js';
import { useEditWord } from './hooks/useEditWord.js';
import { useWordInteraction } from './hooks/useWordInteraction.js';
import { usePinAuth } from './hooks/usePinAuth.js';
import { useAppHandlers } from './hooks/useAppHandlers.js';

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
  const editWord = useEditWord();
  const interaction = useWordInteraction();
  const pinAuth = usePinAuth();
  const [wordTableOpen, setWordTableOpen] = useState(false);

  // Get all event handlers
  const handlers = useAppHandlers({
    words,
    navigation,
    examples,
    customWord,
    editWord,
    interaction,
    pinAuth
  });

  // Initialize with first word when available
  useEffect(() => {
    if (words.shuffledWords.length === 0) return;
    
    const wordIdFromUrl = navigation.getInitialWordIdFromUrl();
    
    if (wordIdFromUrl) {
      const wordFromUrl = words.findWordById(wordIdFromUrl);
      if (wordFromUrl) {
        navigation.displayWord(wordFromUrl);
        return;
      }
    }
    
    const initialWord = words.getInitialWord();
    if (initialWord) {
      navigation.displayWord(initialWord);
    }
  }, [words.shuffledWords.length]);

  const canGoPrevious = navigation.canGoPrevious && !examples.isGeneratingExamples;

  return html`
    <div>
      <${AppHeader}
        isAuthenticated=${pinAuth.isAuthenticated}
        onOpenWordTable=${() => setWordTableOpen(true)}
        onOpenAddWord=${() => customWord.setModalOpen(true)}
        onOpenLogin=${() => pinAuth.setPinModalOpen(true)}
      />
      
      <${AppModals}
        customWord=${customWord}
        editWord=${editWord}
        wordTable=${{
          isOpen: wordTableOpen,
          onClose: () => setWordTableOpen(false),
          words: words.shuffledWords
        }}
        pinAuth=${pinAuth}
        handlers=${handlers}
      />
      
      <${WordLearning}
        currentWord=${navigation.currentWord}
        translationRevealed=${interaction.translationRevealed}
        canGoPrevious=${canGoPrevious}
        isGeneratingExamples=${examples.isGeneratingExamples}
        showExamples=${examples.showExamples}
        examples=${examples.examples}
        handlers=${{
          ...handlers,
          handlePlay: () => interaction.playAudio(navigation.currentWord),
          handlePlayExample: (example, index) => 
            examples.playExample(example, navigation.currentWord, index)
        }}
      />
    </div>
  `;
}

// Render the app
render(html`<${App} />`, document.body);
