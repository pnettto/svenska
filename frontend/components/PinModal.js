import { html } from '../htm.js';
import { useState, useRef, useEffect } from '../libs/hooks.module.js';

export function PinModal({ 
  isOpen, 
  onVerify,
  isVerifying,
  error
}) {
  const inputRef = useRef();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (pin.trim()) {
      onVerify(pin);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return html`
    <div class="modal pin-modal" onClick=${(e) => e.stopPropagation()}>
      <div class="modal-content pin-modal-content">
        <h2>🔒 PIN Required</h2>
        <p class="pin-message">
          You've used your free interactions. Please enter the PIN to continue using the app.
        </p>
        <div class="input-group">
          <label for="pin">PIN:</label>
          <input 
            ref=${inputRef}
            type="password" 
            id="pin"
            value=${pin}
            onInput=${(e) => setPin(e.target.value)}
            onKeyDown=${handleKeyDown}
            disabled=${isVerifying}
            placeholder="Enter PIN"
            maxLength="20"
          />
        </div>
        ${error && html`
          <div class="pin-error">${error}</div>
        `}
        <div class="modal-buttons">
          <button 
            class="btn-primary" 
            onClick=${handleSubmit}
            disabled=${isVerifying || !pin.trim()}
          >
            ${isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  `;
}
