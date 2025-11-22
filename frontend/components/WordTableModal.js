import { html } from '../htm.js';
import { useState } from '../hooks.js';

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
