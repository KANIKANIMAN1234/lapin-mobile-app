import { GAS_URL } from './constants';

let cachedIdToken: string | null = null;

export function setIdToken(token: string | null) {
  cachedIdToken = token;
}

export async function callGas(action: string, data: Record<string, unknown>) {
  if (!GAS_URL) {
    throw new Error('GAS_URL is not configured');
  }
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, token: cachedIdToken || '', data }),
  });
  return res.json();
}

export async function callGasGet(action: string, params: Record<string, string> = {}) {
  if (!GAS_URL) {
    throw new Error('GAS_URL is not configured');
  }
  const searchParams = new URLSearchParams({
    action,
    token: cachedIdToken || '',
    ...params,
  });
  const res = await fetch(`${GAS_URL}?${searchParams.toString()}`);
  return res.json();
}

export function isGasConfigured(): boolean {
  return !!GAS_URL;
}
