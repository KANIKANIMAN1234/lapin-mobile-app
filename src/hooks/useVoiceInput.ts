'use client';

import { useState, useRef, useCallback } from 'react';

export function useVoiceInput(onResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('');
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const baseTextRef = useRef('');
  const intentionalStopRef = useRef(false);

  const start = useCallback(
    (currentText: string) => {
      const rec = createRecognition();
      if (!rec) return false;

      baseTextRef.current = currentText;
      intentionalStopRef.current = false;

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        onResult(baseTextRef.current + transcript);
      };

      rec.onerror = (e: Event & { error?: string }) => {
        const error = e.error || '';
        if (error === 'no-speech' || error === 'aborted') return;
        stop();
      };

      rec.onend = () => {
        if (!intentionalStopRef.current && recognitionRef.current) {
          try { rec.start(); } catch { stop(); }
          return;
        }
        setIsRecording(false);
      };

      try {
        rec.start();
        recognitionRef.current = rec;
        setIsRecording(true);
        setStatusText('音声認識中...話してください');
        return true;
      } catch {
        return false;
      }
    },
    [onResult],
  );

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setStatusText('');
  }, []);

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

  return { isRecording, statusText, toggle };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

function createRecognition() {
  const W = window as unknown as Record<string, unknown>;
  const SpeechRec = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  const Ctor = SpeechRec as { new (): {
    lang: string; continuous: boolean; interimResults: boolean;
    onresult: (e: SpeechRecognitionEvent) => void;
    onerror: (e: Event & { error?: string }) => void;
    onend: () => void;
    start: () => void; stop: () => void;
  } };
  const rec = new Ctor();
  rec.lang = 'ja-JP';
  rec.continuous = true;
  rec.interimResults = true;
  return rec;
}
