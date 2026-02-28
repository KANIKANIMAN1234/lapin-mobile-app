import { GAS_URL } from './constants';

const TOKEN_KEY = 'lapin_session_token';

function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setSessionToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getSessionToken(): string {
  return getStoredToken();
}

export async function createSessionFromIdToken(idToken: string): Promise<string | null> {
  if (!GAS_URL) return null;
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'createSession', token: '', data: { id_token: idToken } }),
  });
  const json = await res.json();
  if (json.success && json.data?.session_token) {
    setSessionToken(json.data.session_token);
    return json.data.session_token;
  }
  return null;
}

export async function callGas(action: string, data: Record<string, unknown>) {
  if (!GAS_URL) {
    throw new Error('GAS_URL is not configured');
  }
  const token = getStoredToken();
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, token, data }),
  });
  return res.json();
}

export async function callGasGet(action: string, params: Record<string, string> = {}) {
  if (!GAS_URL) {
    throw new Error('GAS_URL is not configured');
  }
  const token = getStoredToken();
  const searchParams = new URLSearchParams({
    action,
    token,
    ...params,
  });
  const res = await fetch(`${GAS_URL}?${searchParams.toString()}`);
  return res.json();
}

export function isGasConfigured(): boolean {
  return !!GAS_URL;
}
