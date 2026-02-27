import { GAS_URL } from './constants';

export async function callGas(action: string, data: Record<string, unknown>) {
  if (!GAS_URL) {
    throw new Error('GAS_URL is not configured');
  }
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action, data }),
  });
  return res.json();
}

export function isGasConfigured(): boolean {
  return !!GAS_URL;
}
