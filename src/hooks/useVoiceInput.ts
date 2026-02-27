'use client';

import { useState, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export function useVoiceInput(onResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('');
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  const start = useCallback(
    (currentText: string) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return false;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;
      baseTextRef.current = currentText;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        onResult(baseTextRef.current + finalText + interim);
      };

      recognition.onerror = () => stop();
      recognition.onend = () => {
        if (recognitionRef.current) stop();
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setStatusText('音声認識中...話してください');
      return true;
    },
    [onResult],
  );

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setStatusText('音声入力を終了しました');
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
