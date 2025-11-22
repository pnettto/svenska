import { html } from '../htm.js';

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
