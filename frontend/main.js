import { html } from './htm.js';
import { render } from './libs/preact.module.js';
import { useState, useEffect } from './hooks.js';
import { WordCard, ButtonGroup, ExamplesSection, CustomWordModal } from './components.js';
import { storage } from './utils/storage.js';
import { audio } from './utils/audio.js';
import { api } from './utils/api.js';
import { examples as examplesService } from './utils/examples.js';
import { words } from './utils/words.js';

function App() {
  const [currentWord, setCurrentWord] = useState(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [wordHistory, setWordHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [shuffledIndex, setShuffledIndex] = useState(0);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [examples, setExamples] = useState([]);
  const [showExamples, setShowExamples] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);
  const proxyUrl = storage.getProxyUrl();

  // Initialize app
  useEffect(() => {
    const initializeWords = (words) => {
      const shuffled = api.shuffle(words);
      setShuffledWords(shuffled);
      displayWord(shuffled[0]);
      setShuffledIndex(1);
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
        if (!cachedWords?.length) initializeWords(freshWords);
      }
    });
  }, []);

  const displayWord = (word, addToHistory = true) => {
    setCurrentWord(word);
    setTranslationRevealed(false);
    setShowExamples(false);
    setExamples([]);

    if (addToHistory) {
      setWordHistory(prev => [
        ...(historyIndex < prev.length - 1 ? prev.slice(0, historyIndex + 1) : prev),
        { ...word, examples: word.examples || [] }
      ]);
      setHistoryIndex(prev => prev + 1);
      
      if (word._id) {
        api.incrementReadCount(word._id).catch(() => {});
      }
    } else if (word.examples?.length > 0) {
      setExamples(word.examples);
      setShowExamples(true);
      examplesService.preloadAudio(word.examples, proxyUrl);
    }

    audio.preloadWord(word, proxyUrl);
  };

  const displayNewWord = () => {
    if (shuffledIndex < shuffledWords.length) {
      displayWord(shuffledWords[shuffledIndex]);
      setShuffledIndex(prev => prev + 1);
    } else {
      const reshuffled = api.shuffle(shuffledWords);
      setShuffledWords(reshuffled);
      setShuffledIndex(0);
      displayWord(reshuffled[0]);
      setShuffledIndex(1);
    }
  };

  const handleWordClick = () => {
    if (isGeneratingExamples) return;

    if (!translationRevealed) {
      setTranslationRevealed(true);
      audio.playWord(currentWord, proxyUrl);
    } else {
      setTranslationRevealed(false);
    }
  };

  const handlePlayAudio = () => {
    if (currentWord) {
      audio.playWord(currentWord, proxyUrl);
    }
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

  const handleGenerateExamples = async () => {
    if (!currentWord || isGeneratingExamples) return;

    // Show existing examples if available
    if (!showExamples && currentWord.examples?.length > 0) {
      setExamples(currentWord.examples);
      setShowExamples(true);
      examplesService.preloadAudio(currentWord.examples, proxyUrl);
      return;
    }

    setIsGeneratingExamples(true);

    try {
      const data = await examplesService.fetch(
        proxyUrl,
        currentWord.original,
        currentWord.translation,
        showExamples ? examples : [],
        currentWord._id
      );
      const updatedExamples = showExamples ? [...data.examples, ...examples] : data.examples;
      
      setExamples(updatedExamples);
      setShowExamples(true);
      
      if (currentWord._id) {
        await api.updateWord(currentWord._id, currentWord.original, currentWord.translation, updatedExamples);
      }
      
      updateExamplesInHistory(updatedExamples);
      examplesService.preloadAudio(data.examples, proxyUrl);

    } catch (error) {
      alert(`Failed to generate examples: ${error.message}`);
    } finally {
      setIsGeneratingExamples(false);
    }
  };

  const handlePrevious = () => {
    if (isGeneratingExamples || historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    displayWord(wordHistory[newIndex], false);
  };

  const handleNext = () => {
    if (isGeneratingExamples) return;

    if (historyIndex < wordHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      displayWord(wordHistory[newIndex], false);
    } else {
      displayNewWord();
    }
  };

  const handlePlayExample = (example, exampleIndex) => {
    audio.playExample(example, currentWord, exampleIndex, proxyUrl);
  };

  const handleGenerateRandomWord = async () => {
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

  const handleSubmitCustomWord = async (swedish) => {
    if (!swedish.trim()) {
      alert('Vänligen fyll i ett svenskt ord / Please enter a Swedish word');
      return;
    }

    setIsTranslating(true);

    try {
      const translation = await words.translate(proxyUrl, swedish);
      const newWord = await api.createWord(swedish, translation, []);
      if (!newWord) throw new Error('Failed to create word');

      setShuffledWords(prev => {
        const words = [...prev];
        words.splice(shuffledIndex, 0, newWord);
        return words;
      });

      setModalOpen(false);
      displayWord(newWord);
      setShuffledIndex(prev => prev + 1);

    } catch (error) {
      alert('Kunde inte hämta översättning / Failed to fetch translation');
    } finally {
      setIsTranslating(false);
    }
  };

  const canGoPrevious = historyIndex > 0 && !isGeneratingExamples;

  return html`
    <div>
      <button 
        class="add-word-btn" 
        onClick=${() => setModalOpen(true)}
        title="Add custom word"
      >
        +
      </button>
      
      <${CustomWordModal}
        isOpen=${modalOpen}
        onClose=${() => setModalOpen(false)}
        onSubmit=${handleSubmitCustomWord}
        isTranslating=${isTranslating}
        onGenerateRandom=${handleGenerateRandomWord}
        isGeneratingRandom=${isGeneratingRandom}
      />
      
      <div class="container">
        <${WordCard}
          word=${currentWord}
          onWordClick=${handleWordClick}
          translationRevealed=${translationRevealed}
        />
        
        <${ButtonGroup}
          onPrevious=${handlePrevious}
          onPlay=${handlePlayAudio}
          onGenerateExamples=${handleGenerateExamples}
          onNext=${handleNext}
          canGoPrevious=${canGoPrevious}
          isGeneratingExamples=${isGeneratingExamples}
          showExamples=${showExamples}
        />
        
        <${ExamplesSection}
          examples=${examples}
          showExamples=${showExamples}
          isGeneratingExamples=${isGeneratingExamples}
          translationRevealed=${translationRevealed}
          onPlayExample=${handlePlayExample}
        />
      </div>
    </div>
  `;
}

// Render the app
render(html`<${App} />`, document.body);
