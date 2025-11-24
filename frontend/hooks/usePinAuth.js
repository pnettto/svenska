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

  // Initialize authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = storage.getSessionToken();

      if (token) {
        // Verify token with backend
        const result = await verifyTokenApi(token);
        if (result.valid) {
          setIsAuthenticated(true);
        } else {
          // Invalid token, clear it and show modal
          storage.setSessionToken(null);
          setIsAuthenticated(false);
          setPinModalOpen(true);
        }
      } else {
        setIsAuthenticated(false);
        setPinModalOpen(true);
      }
    };

    initAuth();
  }, []);

  // Check if user should be blocked
  const shouldBlock = () => {
    return !isAuthenticated;
  };

  // Record an interaction (called when user performs an action)
  const recordInteraction = () => {
    if (isAuthenticated) {
      return true;
    }
    setPinModalOpen(true);
    return false;
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
    setIsAuthenticated(false);
    setPinModalOpen(true);
  };

  return {
    pinModalOpen,
    setPinModalOpen,
    isVerifying,
    pinError,
    isAuthenticated,
    shouldBlock: shouldBlock(),
    recordInteraction,
    verifyPin,
    resetAuth,
    handleAuthError
  };
}
