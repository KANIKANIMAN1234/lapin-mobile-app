'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoiceInput(onResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('');
  const recognitionRef = useRef<SpeechRecInstance | null>(null);
  const baseTextRef = useRef('');
  const accumulatedRef = useRef('');
  const intentionalStopRef = useRef(false);
  const onResultRef = useRef(onResult);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const cleanup = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
  }, []);

  const launchRecognition = useCallback(() => {
    const rec = createRecognition();
    if (!rec) return false;

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      accumulatedRef.current = transcript;
      onResultRef.current(baseTextRef.current + transcript);
    };

    rec.onerror = (e) => {
      const err = (e as ErrorEvent & { error?: string }).error || '';
      if (err === 'no-speech' || err === 'aborted') return;
      intentionalStopRef.current = true;
      cleanup();
      setIsRecording(false);
      setStatusText('');
    };

    rec.onend = () => {
      if (intentionalStopRef.current) {
        setIsRecording(false);
        setStatusText('');
        return;
      }
      baseTextRef.current += accumulatedRef.current;
      accumulatedRef.current = '';
      restartTimerRef.current = setTimeout(() => {
        if (intentionalStopRef.current) return;
        launchRecognition();
      }, 300);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      return true;
    } catch {
      return false;
    }
  }, [cleanup]);

  const start = useCallback(
    (currentText: string) => {
      baseTextRef.current = currentText;
      accumulatedRef.current = '';
      intentionalStopRef.current = false;

      const ok = launchRecognition();
      if (!ok) return false;
      setIsRecording(true);
      setStatusText('音声認識中...話してください');
      return true;
    },
    [launchRecognition],
  );

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    cleanup();
    setIsRecording(false);
    setStatusText('');
  }, [cleanup]);

  const toggle = useCallback(
    (currentText: string) => {
      if (isRecording) {
        stop();
      } else {
        const ok = start(currentText);
        if (!ok) return 'unsupported';
      }
      return 'ok';
    },
    [isRecording, start, stop],
  );

  useEffect(() => {
    return () => { intentionalStopRef.current = true; cleanup(); };
  }, [cleanup]);

  return { isRecording, statusText, toggle };
}

type SpeechRecInstance = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (e: { resultIndex: number; results: SpeechRecognitionResultList }) => void;
  onerror: (e: Event) => void;
  onend: () => void;
  start: () => void; stop: () => void;
};

function createRecognition(): SpeechRecInstance | null {
  const W = window as unknown as Record<string, unknown>;
  const SpeechRec = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = new (SpeechRec as any)() as SpeechRecInstance;
  rec.lang = 'ja-JP';
  rec.continuous = false;
  rec.interimResults = true;
  return rec;
}
