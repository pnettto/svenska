import { useState, useEffect } from '../libs/hooks.module.js';
import { storage } from '../utils/storage.js';
import { verifyPin as verifyPinApi, verifyToken as verifyTokenApi } from '../api/authApi.js';

/**
 * Manages PIN authentication state and interaction counting
 */
export function usePinAuth() {
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);

  const MAX_FREE_INTERACTIONS = 3;

  // Initialize authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = storage.getSessionToken();
      const count = storage.getInteractionCount();
      
      setInteractionCount(count);
      
      if (token) {
        // Verify token with backend
        const result = await verifyTokenApi(token);
        if (result.valid) {
          setIsAuthenticated(true);
        } else {
          // Invalid token, clear it
          storage.setSessionToken(null);
          setIsAuthenticated(false);
          
          // If they've exceeded free interactions, show PIN modal
          if (count >= MAX_FREE_INTERACTIONS) {
            setPinModalOpen(true);
          }
        }
      } else {
        setIsAuthenticated(false);
        
        // If they've exceeded free interactions and no token, show PIN modal
        if (count >= MAX_FREE_INTERACTIONS) {
          setPinModalOpen(true);
        }
      }
    };
    
    initAuth();
  }, []);

  // Check if user should be blocked
  const shouldBlock = () => {
    return !isAuthenticated && interactionCount >= MAX_FREE_INTERACTIONS;
  };

  // Record an interaction (called when user performs an action)
  const recordInteraction = () => {
    if (isAuthenticated) {
      return true; // Authenticated users have unlimited interactions
    }

    const newCount = storage.incrementInteractionCount();
    setInteractionCount(newCount);

    if (newCount >= MAX_FREE_INTERACTIONS) {
      setPinModalOpen(true);
      return false; // Block the action
    }

    return true; // Allow the action
  };

  // Handle auth errors from API
  const handleAuthError = (error) => {
    if (error?.authError) {
      // Clear authentication state and token
      storage.setSessionToken(null);
      setIsAuthenticated(false);
      setPinModalOpen(true);
      return true;
    }
    return false;
  };

  // Verify PIN with backend
  const verifyPin = async (pin) => {
    setIsVerifying(true);
    setPinError('');

    try {
      const result = await verifyPinApi(pin);
      
      if (result.valid && result.token) {
        storage.setSessionToken(result.token);
        setIsAuthenticated(true);
        setPinModalOpen(false);
        setPinError('');
        return true;
      } else {
        setPinError('Invalid PIN. Please try again.');
        return false;
      }
    } catch (error) {
      setPinError('Failed to verify PIN. Please try again.');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // For testing/development: reset authentication
  const resetAuth = () => {
    storage.setSessionToken(null);
    storage.resetInteractionCount();
    setIsAuthenticated(false);
    setInteractionCount(0);
    setPinModalOpen(false);
  };

  return {
    pinModalOpen,
    setPinModalOpen,
    isVerifying,
    pinError,
    isAuthenticated,
    interactionCount,
    remainingInteractions: Math.max(0, MAX_FREE_INTERACTIONS - interactionCount),
    shouldBlock: shouldBlock(),
    recordInteraction,
    verifyPin,
    resetAuth,
    handleAuthError
  };
}
