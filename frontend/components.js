import { html } from './htm.js';
import { useState, useEffect, useRef } from './hooks.js';

export function WordCard({ word, onWordClick, translationRevealed }) {
  if (!word) return null;

  return html`
    <div class="word-card">
      <h1 
        class="swedish-word" 
        onClick=${onWordClick}
      >
        ${word.original}
      </h1>
      <p 
        class="english-translation ${translationRevealed ? '' : 'hidden'}"
      >
        ${word.translation}
      </p>
    </div>
  `;
}

export function ButtonGroup({ 
  onPrevious, 
  onPlay, 
  onGenerateExamples, 
  onNext,
  canGoPrevious,
  isGeneratingExamples,
  showExamples
}) {
  return html`
    <div class="button-group">
      <button 
        class="btn" 
        onClick=${onPrevious}
        disabled=${!canGoPrevious}
        title="Previous word"
      >
        ←
      </button>
      <button 
        class="btn" 
        onClick=${onPlay}
        title="Play audio"
      >
        Lyssna
      </button>
      <button 
        class="btn" 
        onClick=${onGenerateExamples}
        disabled=${isGeneratingExamples}
        title=${showExamples ? "Generate more examples" : "Show examples"}
      >
        ${showExamples ? 'Fler' : 'Exampel'}
      </button>
      <button 
        class="btn" 
        onClick=${onNext}
        disabled=${isGeneratingExamples}
        title="Next word"
      >
        →
      </button>
    </div>
  `;
}

export function ExamplesSection({ 
  examples, 
  showExamples, 
  isGeneratingExamples, 
  translationRevealed,
  onPlayExample 
}) {
  return html`
    <div class="examples-section">
      ${isGeneratingExamples && html`
        <div class="loading">Generera exempel...</div>
      `}

      ${showExamples && html`
        <div class="examples-container">
          <h3>Exampelmeningar:</h3>
          <div class="examples-list">
            ${examples.map((example, index) => html`
              <div class="example-item" key=${example.swedish}>
                <div 
                  class="example-swedish"
                  onClick=${() => onPlayExample(example, index)}
                  style="cursor: pointer;"
                  title="Click to hear pronunciation"
                >
                  🔊 ${example.swedish}
                </div>
                <div class="example-english ${translationRevealed ? '' : 'hidden'}">
                  ${example.english}
                </div>
              </div>
            `)}
          </div>
        </div>
      `}
    </div>
  `;
}

export function CustomWordModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  isTranslating,
  onGenerateRandom,
  isGeneratingRandom
}) {
  const inputRef = useRef();
  const [customSwedish, setCustomSwedish] = useState('');

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit(customSwedish);
    setCustomSwedish('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleClose = () => {
    setCustomSwedish('');
    onClose();
  };

  const handleGenerateRandom = async () => {
    const result = await onGenerateRandom();
    if (result) {
      setCustomSwedish(result.swedish);
    }
  };

  if (!isOpen) return null;

  return html`
    <div class="modal" onClick=${(e) => e.target.classList.contains('modal') && handleClose()}>
      <div class="modal-content">
        <h2>Lägg till eget ord</h2>
        <div class="input-group">
          <label for="customSwedish">Svenska ord:</label>
          <input 
            ref=${inputRef}
            type="text" 
            id="customSwedish"
            value=${customSwedish}
            onInput=${(e) => setCustomSwedish(e.target.value)}
            onKeyDown=${handleKeyDown}
            disabled=${isTranslating || isGeneratingRandom}
            placeholder="t.ex. hund"
          />
          <button 
            class="btn-ai" 
            onClick=${handleGenerateRandom}
            disabled=${isTranslating || isGeneratingRandom}
            title="Generera slumpmässigt ord med AI"
          >
            ${isGeneratingRandom ? '✨ Genererar...' : '✨ AI slumpord'}
          </button>
        </div>
        <div class="modal-buttons">
          <button 
            class="btn-secondary" 
            onClick=${handleClose}
            disabled=${isTranslating || isGeneratingRandom}
          >
            Avbryt
          </button>
          <button 
            class="btn-primary" 
            onClick=${handleSubmit}
            disabled=${isTranslating || isGeneratingRandom}
          >
            Lägg till
          </button>
        </div>
        ${isTranslating && html`
          <div class="loading-translation">Hämtar översättning...</div>
        `}
      </div>
    </div>
  `;
}

export function WordTableModal({ 
  isOpen, 
  onClose, 
  words,
  onSelectWord
}) {
  const [showTranslations, setShowTranslations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleWordClick = (word) => {
    onSelectWord(word);
    handleClose();
  };

  if (!isOpen) return null;

  // Filter and sort words
  const filteredWords = searchTerm 
    ? words.filter(word => 
        word.original?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.translation?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : words;

  const sortedWords = [...filteredWords].sort((a, b) => {
    const aVal = a.original?.toLowerCase() || '';
    const bVal = b.original?.toLowerCase() || '';
    if (sortOrder === 'asc') {
      return aVal.localeCompare(bVal, 'sv');
    } else {
      return bVal.localeCompare(aVal, 'sv');
    }
  });

  return html`
    <div class="modal word-table-modal" onClick=${(e) => e.target.classList.contains('modal') && handleClose()}>
      <div class="modal-content word-table-content">
        <div class="word-table-header">
          <h2>Alla ord (${filteredWords.length})</h2>
          <button class="btn-close" onClick=${handleClose} title="Stäng">×</button>
        </div>
        
        <div class="word-table-controls">
          <input 
            type="text"
            class="word-table-search"
            placeholder="Sök ord..."
            value=${searchTerm}
            onInput=${(e) => setSearchTerm(e.target.value)}
          />
          <button 
            class="btn-toggle-translations" 
            onClick=${() => setShowTranslations(!showTranslations)}
          >
            ${showTranslations ? '🙈 Göm översättningar' : '👁️ Visa översättningar'}
          </button>
        </div>

        <div class="word-table-container">
          <table class="word-table">
            <thead>
              <tr>
                <th onClick=${handleSort} class="sortable" title="Click to sort">
                  Svenska ${sortOrder === 'asc' ? '↑' : '↓'}
                </th>
                ${showTranslations && html`<th>English</th>`}
              </tr>
            </thead>
            <tbody>
              ${sortedWords.map((word) => html`
                <tr 
                  key=${word._id || word.original}
                  onClick=${() => handleWordClick(word)}
                  class="word-table-row"
                >
                  <td class="word-swedish">${word.original}</td>
                  ${showTranslations && html`<td class="word-english">${word.translation}</td>`}
                </tr>
              `)}
            </tbody>
          </table>
          ${sortedWords.length === 0 && html`
            <div class="no-results">Inga ord hittades</div>
          `}
        </div>
      </div>
    </div>
  `;
}
