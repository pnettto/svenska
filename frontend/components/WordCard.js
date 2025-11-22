import { html } from '../htm.js';

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
