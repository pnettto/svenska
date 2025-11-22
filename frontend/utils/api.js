// This file has been refactored. All API functions are now in /frontend/api/
// Import from the specific API modules instead:
//   - wordApi.js - Word CRUD operations
//   - authApi.js - Authentication (verifyPin, verifyToken)
//   - speechApi.js - Text-to-speech generation
//   - aiApi.js - AI features (generateExamples, translate)
//   - request.js - Shared request utility

export * from '../api/wordApi.js';
export * from '../api/authApi.js';
export * from '../api/speechApi.js';
export * from '../api/aiApi.js';
