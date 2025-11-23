# Backend Refactoring Changes

## New Structure

### Configuration (`/backend/config/index.js`)
- Centralized configuration for all environment variables
- Single source of truth for settings
- Eliminates scattered `process.env` calls

### Services Layer (`/backend/services/`)
- **wordService.js** - All database operations for words
- **aiService.js** - OpenAI/AI operations
- **speechService.js** - AWS Polly text-to-speech operations

### Routes (`/backend/routes/`)
Routes are now properly namespaced under `/api`:
- `/api/words` - Word CRUD operations
- `/api/ai` - AI features (examples, translation, random words)
- `/api/speech` - TTS and audio file serving
- `/api/auth` - Authentication (PIN verification, token validation)
- `/api/utils` - Statistics and CSV export

## Breaking Changes

### API Endpoints
All endpoints now have proper namespacing:
- Old: `/words` → New: `/api/words`
- Old: `/generate-examples` → New: `/api/ai/generate-examples`
- Old: `/tts` → New: `/api/speech/tts`
- Old: `/speech/:filename` → New: `/api/speech/:filename`
- Old: `/verify-pin` → New: `/api/auth`
- Old: `/stats` → New: `/api/utils/stats`

### Route Handlers
Route files no longer include the resource name in paths:
- Before: `router.get('/words', ...)`
- After: `router.get('/', ...)` (mounted at `/words`)

## Migration Notes

1. Update all frontend API calls to use new endpoints
2. Database file (`database.js`) is deprecated - use `wordService` instead
3. All services are singletons - import and use directly
4. Config is required at app startup (loads .env automatically)
