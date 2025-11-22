import { html } from '../htm.js';
import { WordCard } from './WordCard.js';
import { ButtonGroup } from './ButtonGroup.js';
import { ExamplesSection } from './ExamplesSection.js';

export function WordLearning({
  currentWord,
  translationRevealed,
  canGoPrevious,
  isGeneratingExamples,
  showExamples,
  examples,
  handlers
}) {
  return html`
    <div class="container">
      <${WordCard}
        word=${currentWord}
        onWordClick=${handlers.handleWordClick}
        translationRevealed=${translationRevealed}
      />
      
      <${ButtonGroup}
        onPrevious=${handlers.handlePrevious}
        onPlay=${handlers.handlePlay}
        onGenerateExamples=${handlers.handleGenerateExamples}
        onNext=${handlers.handleNext}
        canGoPrevious=${canGoPrevious}
        isGeneratingExamples=${isGeneratingExamples}
        showExamples=${showExamples}
      />
      
      <${ExamplesSection}
        examples=${examples}
        showExamples=${showExamples}
        isGeneratingExamples=${isGeneratingExamples}
        translationRevealed=${translationRevealed}
        onPlayExample=${handlers.handlePlayExample}
      />
    </div>
  `;
}
