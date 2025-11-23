// API base URL
export const API_BASE_URL = localStorage.getItem('apiBaseUrl') || 'https://svenska-new-tab-backend.fly.dev';

// Storage keys
export const STORAGE_KEYS = {
    CACHE: 'swedishWords',
    PIN_AUTH: 'pinAuthenticated',
    INTERACTION_COUNT: 'interactionCount',
    API_BASE_URL: 'apiBaseUrl',
    SESSION_TOKEN: 'sessionToken'
};

// Rate limits
export const RATE_LIMITS = {
    FREE_INTERACTIONS: 3
};

// UI constants
export const UI_CONSTANTS = {
    MODAL_ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000
};
