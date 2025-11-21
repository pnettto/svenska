# Frontend Hooks Architecture

The frontend has been refactored to use a modular, hook-based architecture. Each hook manages a specific feature area, making the code easier to understand and maintain.

## Structure

### Custom Hooks (`/hooks/`)

#### `useWords.js`
Manages the word pool and shuffling logic:
- Fetches and caches words from the API
- Shuffles words for randomized display
- Provides next word in shuffle
- Allows inserting custom words into the pool

#### `useWordNavigation.js`
Manages word history and navigation:
- Tracks current word and navigation history
- Handles prev/next navigation
- Increments read counts
- Preloads audio for words
- Updates examples in history

#### `useExamples.js`
Manages example generation and display:
- Loads existing examples for a word
- Generates new examples via AI
- Handles audio playback for examples
- Updates words with new examples

#### `useCustomWord.js`
Manages custom word creation:
- Handles modal state
- Generates random Swedish words via AI
- Translates Swedish to English
- Creates new words in the database

#### `useWordInteraction.js`
Manages word display interaction:
- Handles translation reveal/hide
- Plays word audio on click
- Resets state when navigating

### Main Component (`main.js`)

The `App` component now orchestrates these hooks:
- **~270 lines → ~120 lines** (56% reduction)
- Clear separation of concerns
- Declarative, easy-to-read structure
- Simple handler functions that coordinate hooks

## Benefits

1. **Modularity**: Each hook has a single responsibility
2. **Reusability**: Hooks can be used independently if needed
3. **Testability**: Isolated logic is easier to test
4. **Readability**: Main component shows the flow at a glance
5. **Maintainability**: Changes are localized to specific hooks

## Example Usage

```javascript
function App() {
  // Initialize hooks
  const words = useWords();
  const navigation = useWordNavigation();
  const examples = useExamples();
  
  // Coordinate behavior
  const handleNext = () => {
    const nextWord = navigation.goToNext() || words.getNextWord();
    examples.loadExistingExamples(nextWord);
  };
  
  // Render UI
  return html`...`;
}
```
