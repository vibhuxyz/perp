import { config } from '@/app/config';

export type AuthMode = 'signup' | 'login';

export function resolveEndpoint(mode: AuthMode): string {
  return mode === 'signup' ? `${config.apiUrl}/api/auth/signup` : `${config.apiUrl}/api/auth/signin`;
}

export function extractErrorMessage(data: { msg?: string; message?: string; errors?: string }, mode: AuthMode): string {
  return data?.msg || data?.message || data?.errors || `${mode === 'signup' ? 'Registration' : 'Login'} failed`;
}

export function isNetworkError(msg: string): boolean {
  return msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError');
}

export function buildDemoUser(email: string) {
  return {
    id: Date.now(),
    email,
    username: email.split('@')[0] || 'trader',
  };
}

export function validateAuthForm(mode: AuthMode, agreed: boolean, password: string): string | null {
  if (mode === 'signup' && !agreed) {
    return 'Please agree to the Terms & Privacy Policy to continue';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}
