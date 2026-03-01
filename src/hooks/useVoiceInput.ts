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
  const failCountRef = useRef(0);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const cleanup = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.onresult = null; rec.onerror = null; rec.onend = null; } catch { /* */ }
      try { rec.abort(); } catch { /* */ }
      recognitionRef.current = null;
    }
  }, []);

  const doRestart = useCallback(() => {
    if (intentionalStopRef.current) return;
    if (failCountRef.current > 5) {
      setIsRecording(false);
      setStatusText('音声認識を再起動できません。もう一度マイクボタンを押してください。');
      return;
    }

    const rec = createRecognition();
    if (!rec) {
      setIsRecording(false);
      setStatusText('');
      return;
    }

    rec.onresult = (event: SpeechRecResultEvent) => {
      failCountRef.current = 0;
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      accumulatedRef.current = transcript;
      onResultRef.current(baseTextRef.current + transcript);
    };

    rec.onerror = (e: SpeechRecErrorEvent) => {
      const err = e.error || '';
      console.warn('[useVoiceInput] onerror:', err);
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        intentionalStopRef.current = true;
        cleanup();
        setIsRecording(false);
        setStatusText('マイクの使用が許可されていません');
        return;
      }
      // no-speech, aborted, network, audio-capture → onend で再起動するので無視
    };

    rec.onend = () => {
      console.warn('[useVoiceInput] onend, intentional=', intentionalStopRef.current);
      if (intentionalStopRef.current) {
        setIsRecording(false);
        setStatusText('');
        return;
      }
      baseTextRef.current += accumulatedRef.current;
      accumulatedRef.current = '';
      failCountRef.current++;
      restartTimerRef.current = setTimeout(doRestart, 400);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setStatusText('音声認識中...話してください');
    } catch (err) {
      console.warn('[useVoiceInput] start failed:', err);
      failCountRef.current++;
      restartTimerRef.current = setTimeout(doRestart, 800);
    }
  }, [cleanup]);

  const start = useCallback(
    (currentText: string) => {
      cleanup();
      baseTextRef.current = currentText;
      accumulatedRef.current = '';
      intentionalStopRef.current = false;
      failCountRef.current = 0;

      const rec = createRecognition();
      if (!rec) return false;

      rec.onresult = (event: SpeechRecResultEvent) => {
        failCountRef.current = 0;
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        accumulatedRef.current = transcript;
        onResultRef.current(baseTextRef.current + transcript);
      };

      rec.onerror = (e: SpeechRecErrorEvent) => {
        const err = e.error || '';
        console.warn('[useVoiceInput] onerror:', err);
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          intentionalStopRef.current = true;
          cleanup();
          setIsRecording(false);
          setStatusText('マイクの使用が許可されていません');
          return;
        }
      };

      rec.onend = () => {
        console.warn('[useVoiceInput] onend, intentional=', intentionalStopRef.current);
        if (intentionalStopRef.current) {
          setIsRecording(false);
          setStatusText('');
          return;
        }
        baseTextRef.current += accumulatedRef.current;
        accumulatedRef.current = '';
        failCountRef.current++;
        restartTimerRef.current = setTimeout(doRestart, 400);
      };

      try {
        rec.start();
        recognitionRef.current = rec;
        setIsRecording(true);
        setStatusText('音声認識中...話してください');
        return true;
      } catch (err) {
        console.warn('[useVoiceInput] initial start failed:', err);
        return false;
      }
    },
    [cleanup, doRestart],
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

interface SpeechRecResultEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecErrorEvent {
  error: string;
  message?: string;
}

type SpeechRecInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecResultEvent) => void) | null;
  onerror: ((e: SpeechRecErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function createRecognition(): SpeechRecInstance | null {
  const W = window as unknown as Record<string, unknown>;
  const SpeechRec = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = new (SpeechRec as any)() as SpeechRecInstance;
  rec.lang = 'ja-JP';
  rec.continuous = true;
  rec.interimResults = true;
  return rec;
}
