import { html } from '../htm.js';
import { useState, useEffect, useRef } from '../hooks.js';

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
