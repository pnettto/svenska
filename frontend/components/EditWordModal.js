import { html } from '../htm.js';
import { useState, useEffect, useRef } from '../libs/hooks.module.js';

export function EditWordModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  isUpdating,
  word
}) {
  const inputRef = useRef();
  const [swedish, setSwedish] = useState('');
  const [english, setEnglish] = useState('');

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen && word) {
      setSwedish(word.original || '');
      setEnglish(word.translation || '');
    } else if (!isOpen) {
      setSwedish('');
      setEnglish('');
    }
  }, [isOpen, word]);

  const handleSubmit = () => {
    onSubmit(swedish, english);
    setSwedish('');
    setEnglish('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleClose = () => {
    setSwedish('');
    setEnglish('');
    onClose();
  };

  if (!isOpen) return null;

  return html`
    <div class="modal" onClick=${(e) => e.target.classList.contains('modal') && handleClose()}>
      <div class="modal-content">
        <h2>Redigera ord</h2>
        <div class="input-group">
          <label for="editSwedish">Svenska ord:</label>
          <input 
            ref=${inputRef}
            type="text" 
            id="editSwedish"
            value=${swedish}
            onInput=${(e) => setSwedish(e.target.value)}
            onKeyDown=${handleKeyDown}
            disabled=${isUpdating}
            placeholder="t.ex. hund"
          />
        </div>
        <div class="input-group">
          <label for="editEnglish">Engelsk översättning:</label>
          <input 
            type="text" 
            id="editEnglish"
            value=${english}
            onInput=${(e) => setEnglish(e.target.value)}
            onKeyDown=${handleKeyDown}
            disabled=${isUpdating}
            placeholder="t.ex. dog"
          />
        </div>
        <div class="modal-buttons">
          <button 
            class="btn-secondary" 
            onClick=${handleClose}
            disabled=${isUpdating}
          >
            Avbryt
          </button>
          <button 
            class="btn-primary" 
            onClick=${handleSubmit}
            disabled=${isUpdating}
          >
            ${isUpdating ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  `;
}
