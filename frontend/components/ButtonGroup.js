import { html } from '../htm.js';

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
