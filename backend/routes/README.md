# Backend Routes Structure

The routes have been split into focused modules for better organization:

## `/routes/words.js` (110 lines)
CRUD operations for word management:
- `GET /api/words` - Get all words
- `GET /api/words/:id` - Get single word
- `POST /api/words` - Create new word
- `PUT /api/words/:id` - Update word
- `PATCH /api/words/:id` - Partial update (read count, speech)
- `DELETE /api/words/:id` - Delete word

## `/routes/ai.js` (80 lines)
OpenAI-powered features:
- `POST /api/generate-examples` - Generate example sentences
- `POST /api/translate` - Translate text

## `/routes/speech.js` (115 lines)
Azure Speech Service integration:
- `POST /api/tts` - Text-to-speech with caching
- `GET /api/speech/:filename` - Serve cached audio files

## `/routes/utils.js` (60 lines)
Utility endpoints:
- `GET /api/stats` - Database statistics
- `GET /api/export` - CSV export

## `/routes/index.js` (15 lines)
Main router that combines all route modules

---

**Total:** ~380 lines split across 5 focused files instead of 1 monolithic 352-line file.

Each file is now:
- ✅ Easy to locate specific functionality
- ✅ Simple to understand at a glance
- ✅ Quick to modify without affecting other features
- ✅ Clear separation of concerns
