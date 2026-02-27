'use client';

import { useState, useEffect, useCallback } from 'react';
import { LIFF_ID } from '@/lib/constants';
import { callGas, isGasConfigured } from '@/lib/gas';

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
          const profile = await liff.getProfile();
          if (isGasConfigured()) {
            const regResult = await callGas('register', {
              userId: profile.userId,
              displayName: profile.displayName,
            });
            if (regResult?.status === 'retired') {
              setState({ userId: profile.userId, userName: profile.displayName, isReady: true, isRetired: true });
              return;
            }
          }
          setState({ userId: profile.userId, userName: profile.displayName, isReady: true, isRetired: false });
        } catch {
          enableDemo();
        }
      } else {
        enableDemo();
      }
    }

    function enableDemo() {
      setState({ userId: 'demo_user', userName: '山田太郎', isReady: true, isRetired: false });
    }

    init();
  }, []);

  return state;
}

export function useSendToGas() {
  const send = useCallback(async (action: string, data: Record<string, unknown>) => {
    if (isGasConfigured()) {
      return callGas(action, data);
    }
    await new Promise((r) => setTimeout(r, 1500));
    return { status: 'success' };
  }, []);
  return send;
}
