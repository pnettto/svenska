import { html } from '../htm.js';

export function AppHeader({ isAuthenticated, onOpenWordTable, onOpenAddWord, onOpenLogin }) {
  return html`
    <div class="top-right-buttons">
      ${isAuthenticated ? html`
        <button 
          class="word-table-btn" 
          onClick=${onOpenWordTable}
          title="Se alla ord"
        >
          📋
        </button>
        <button 
          class="add-word-btn" 
          onClick=${onOpenAddWord}
          title="Add custom word"
        >
          +
        </button>
      ` : html`
        <button 
          class="login-btn" 
          onClick=${onOpenLogin}
          title="Logga in"
        >
          🔓
        </button>
      `}
    </div>
  `;
}
