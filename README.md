# Swedish Word New Tab - Chrome Extension

A Chrome extension that displays a random Swedish word with its English translation every time you open a new tab. Perfect for learning Swedish vocabulary through daily exposure!

## Features

- 🇸🇪 Display random Swedish words with English translations
- 🔊 Text-to-speech pronunciation using Microsoft Cognitive Services
- 💬 AI-generated example sentences with translations
- 🎨 Beautiful gradient design with clean UI
- 🔄 Navigate through word history (previous/next)
- ➕ Add custom words with AI-powered translation
- 📚 Comprehensive word database with various word types
- 💾 Offline support with cached words
- 🔐 PIN authentication for unlimited access after 5 free interactions

## Project Structure

```
svenska-new-tab/
├── frontend/           # Chrome extension frontend
│   ├── index.html     # New tab page
│   ├── main.js        # Main application logic
│   ├── components.js  # UI components
│   ├── hooks.js       # Custom hooks
│   ├── styles.css     # Styling
│   ├── manifest.json  # Chrome extension manifest
│   └── utils/         # Utility modules (API, audio, storage, etc.)
└── backend/           # Node.js proxy server
    ├── server.js      # Express server
    ├── database.js    # NeDB database operations
    ├── prompts.js     # OpenAI prompt templates
    ├── routes/        # API routes
    └── data/          # Data storage
```

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```

3. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   AZURE_SPEECH_KEY=your_azure_speech_key_here
   AZURE_SPEECH_REGION=your_azure_region_here
   PIN=your_secure_pin_here
   PORT=3001
   ```

   **Note**: The PIN environment variable is required for the authentication feature that limits free usage to 5 interactions per session.

4. Start the server:
   ```bash
   yarn start
   # or
   npm start
   ```

   The server will run on `http://localhost:3001` by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Update the proxy URL in your browser:
   - Open the extension settings once installed
   - Set the backend URL (e.g., `http://localhost:3001`)

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `frontend` folder
   - Open a new tab to test!

## Usage

### Basic Features
- **Open a new tab**: See a random Swedish word with translation
- **Reveal translation**: Click to show the English translation
- **New word**: Get a different random word
- **Previous/Next**: Navigate through your word history
- **Listen**: Hear the Swedish pronunciation

### Advanced Features
- **Generate examples**: Get AI-generated example sentences
- **Add custom words**: Use the "+" button to add your own words with AI translation
- **Offline mode**: Works with cached words when backend is unavailable
- **PIN Authentication**: After 5 free interactions per session, a PIN is required to continue using the app. Once authenticated, you have unlimited access for that session. The PIN is stored in localStorage for future sessions.

## Technologies Used

### Frontend
- Preact (lightweight React alternative)
- HTM (JSX-like syntax without build tools)
- Vanilla CSS with custom properties
- Chrome Extension APIs

### Backend
- Node.js + Express
- OpenAI API (for translations and examples)
- Microsoft Azure Cognitive Services (for text-to-speech)
- NeDB (embedded database)
- CORS middleware

## Development

### Backend Development
```bash
cd backend
yarn dev  # Runs with nodemon for auto-reload
```

### Frontend Development
Since this is a Chrome extension, simply reload the extension after making changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension card

For local testing without browser extension:
```bash
cd frontend
python3 -m http.server
# Visit http://localhost:8000
```

## API Endpoints

- `GET /api/words` - Get all words
- `GET /api/words/:id` - Get specific word
- `POST /api/words` - Add new word
- `POST /api/verify-pin` - Verify PIN for authentication
- `POST /api/llm/translate` - Translate text
- `POST /api/llm/examples` - Generate example sentences
- `POST /api/llm/audio` - Generate speech audio

## Deployment

The backend can be deployed to Fly.io:

```bash
cd backend
fly deploy
```

Update the frontend proxy URL to point to your deployed backend.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
