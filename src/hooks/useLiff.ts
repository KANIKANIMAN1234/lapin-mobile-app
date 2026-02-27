'use client';

import { useState, useEffect, useCallback } from 'react';
import { LIFF_ID } from '@/lib/constants';
import { callGas, isGasConfigured, setIdToken } from '@/lib/gas';

interface LiffState {
  userId: string;
  userName: string;
  isReady: boolean;
  isRetired: boolean;
}

export function useLiff() {
  const [state, setState] = useState<LiffState>({
    userId: '',
    userName: '',
    isReady: false,
    isRetired: false,
  });

  useEffect(() => {
    async function init() {
      if (typeof window === 'undefined') return;

      if (LIFF_ID) {
        try {
          const liff = (await import('@line/liff')).default;
          await liff.init({ liffId: LIFF_ID });
          if (!liff.isLoggedIn()) {
            liff.login();
            return;
          }
          const idToken = liff.getIDToken();
          setIdToken(idToken);

          const profile = await liff.getProfile();
          let displayName = profile.displayName;
          if (isGasConfigured()) {
            const regResult = await callGas('registerUser', {
              lineUserId: profile.userId,
              displayName: profile.displayName,
            });
            if (regResult?.data?.is_deleted) {
              setState({ userId: profile.userId, userName: displayName, isReady: true, isRetired: true });
              return;
            }
            if (regResult?.data?.name) {
              displayName = regResult.data.name;
            }
          }
          setState({ userId: profile.userId, userName: displayName, isReady: true, isRetired: false });
        } catch {
          enableDemo();
        }
      } else {
        enableDemo();
      }
    }

    function enableDemo() {
      setState({ userId: 'demo_user', userName: 'テストユーザー', isReady: true, isRetired: false });
    }

    init();
  }, []);

  return state;
}

export function useSendToGas() {
  const send = useCallback(async (action: string, data: Record<string, unknown>) => {
    if (isGasConfigured()) {
      const result = await callGas(action, data);
      if (result?.success === false) {
        throw new Error(result.error?.message || 'GASエラー');
      }
      return result;
    }
    console.warn('[MOCK MODE] GAS_URL未設定 action=' + action);
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, mock: true };
  }, []);
  return send;
}
