'use client';

import { useState, useEffect, useCallback } from 'react';
import { LIFF_ID } from '@/lib/constants';
import { callGas, callGasGet, isGasConfigured, getSessionToken, createSessionFromIdToken } from '@/lib/gas';

interface LiffState {
  userId: string;
  userName: string;
  userRole: string;
  isReady: boolean;
  isRetired: boolean;
}

export function useLiff() {
  const [state, setState] = useState<LiffState>({
    userId: '',
    userName: '',
    userRole: '',
    isReady: false,
    isRetired: false,
  });

  useEffect(() => {
    async function init() {
      if (typeof window === 'undefined') return;

      // 既存セッショントークンがあれば、ユーザー情報を取得して復元
      const existingSession = getSessionToken();
      if (existingSession && isGasConfigured()) {
        try {
          const userRes = await callGasGet('getUserInfo');
          if (userRes?.success && userRes.data) {
            const isDeleted = userRes.data.is_deleted;
            setState({
              userId: String(userRes.data.id || ''),
              userName: String(userRes.data.name || ''),
              userRole: String(userRes.data.role || ''),
              isReady: true,
              isRetired: !!isDeleted,
            });
            return;
          }
        } catch {
          // セッションが無効な場合はLIFF再認証にフォールスルー
        }
      }

      if (LIFF_ID) {
        try {
          const liff = (await import('@line/liff')).default;
          await liff.init({ liffId: LIFF_ID });
          if (!liff.isLoggedIn()) {
            liff.login();
            return;
          }
          const idToken = liff.getIDToken();

          const profile = await liff.getProfile();
          let displayName = profile.displayName;

          if (isGasConfigured() && idToken) {
            // セッショントークンを発行・保存
            await createSessionFromIdToken(idToken);

            const regResult = await callGas('registerUser', {
              lineUserId: profile.userId,
              displayName: profile.displayName,
            });
            if (regResult?.data?.is_deleted) {
              setState({ userId: profile.userId, userName: displayName, userRole: '', isReady: true, isRetired: true });
              return;
            }
            if (regResult?.data?.name) {
              displayName = regResult.data.name;
            }
            const role = String(regResult?.data?.role || '');
            setState({ userId: profile.userId, userName: displayName, userRole: role, isReady: true, isRetired: false });
            return;
          }
          setState({ userId: profile.userId, userName: displayName, userRole: '', isReady: true, isRetired: false });
        } catch {
          enableDemo();
        }
      } else {
        enableDemo();
      }
    }

    function enableDemo() {
      setState({ userId: 'demo_user', userName: 'テストユーザー', userRole: '', isReady: true, isRetired: false });
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
