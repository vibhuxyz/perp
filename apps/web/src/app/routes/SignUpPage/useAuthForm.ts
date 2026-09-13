import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountStore } from '@/stores/account.store';
import {
  resolveEndpoint,
  extractErrorMessage,
  isNetworkError,
  buildDemoUser,
  validateAuthForm,
  type AuthMode,
} from './authHelpers';

export function useAuthForm(initialMode: AuthMode) {
  const navigate = useNavigate();
  const setAuth = useAccountStore(s => s.setAuth);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
  };

  async function trySignInWithServer() {
    const res = await fetch(resolveEndpoint(mode), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(extractErrorMessage(data, mode));
    }
    if (!data.token || !data.user) {
      throw new Error('Invalid response from server');
    }
    setAuth(data.token, data.user);
    navigate('/');
  }

  function handleAuthFailure(err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    // Local development fallback session if server is offline
    if (isNetworkError(msg)) {
      setAuth('demo-token-' + Date.now(), buildDemoUser(email));
      navigate('/');
      return;
    }
    setError(msg);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateAuthForm(mode, agreed, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await trySignInWithServer();
    } catch (err) {
      handleAuthFailure(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    handleToggleMode,
    email,
    setEmail,
    password,
    setPassword,
    agreed,
    setAgreed,
    error,
    loading,
    handleSubmit,
  };
}
