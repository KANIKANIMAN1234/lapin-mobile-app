'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { callGas } from '@/lib/gas';

/**
 * MediaRecorder で録音し、OpenAI Whisper API で文字起こしするフック。
 * Web Speech API に依存しないため、LIFF / モバイル WebView でも安定動作する。
 */
export function useVoiceInput(onResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('');

  const onResultRef = useRef(onResult);
  const baseTextRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (currentText: string) => {
    if (busyRef.current) return false;
    baseTextRef.current = currentText;

    if (!navigator.mediaDevices?.getUserMedia) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setStatusText('🎙 録音中…停止ボタンで文字起こしします');
      return true;
    } catch (err) {
      console.error('[useVoiceInput] getUserMedia error:', err);
      stopStream();
      setStatusText('マイクにアクセスできません');
      setTimeout(() => setStatusText(''), 3000);
      return false;
    }
  }, [stopStream]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      setIsRecording(false);
      setStatusText('');
      stopStream();
      return;
    }

    busyRef.current = true;
    setStatusText('⏳ 文字起こし中…少々お待ちください');

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    stopStream();
    mediaRecorderRef.current = null;

    if (audioChunksRef.current.length === 0) {
      setIsRecording(false);
      setStatusText('');
      busyRef.current = false;
      return;
    }

    const mime = recorder.mimeType || 'audio/webm';
    const blob = new Blob(audioChunksRef.current, { type: mime });
    audioChunksRef.current = [];

    try {
      const base64 = await blobToBase64(blob);
      const res = await callGas('transcribeAudio', { audio_data: base64 });

      if (res.success && res.data?.text) {
        const prev = baseTextRef.current;
        const newText = prev ? prev + '\n' + res.data.text : res.data.text;
        onResultRef.current(newText);
        setStatusText('✅ 文字起こし完了');
      } else {
        const msg = res.error || '文字起こしに失敗しました';
        console.error('[useVoiceInput] transcribe error:', msg);
        setStatusText('❌ ' + msg);
      }
    } catch (err) {
      console.error('[useVoiceInput] transcribe network error:', err);
      setStatusText('❌ 通信エラーが発生しました');
    }

    setTimeout(() => setStatusText(''), 2500);
    setIsRecording(false);
    busyRef.current = false;
  }, [stopStream]);

  const toggle = useCallback(
    (currentText: string) => {
      if (busyRef.current) return 'ok';
      if (isRecording) {
        stopRecording();
        return 'ok';
      }

      if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
      startRecording(currentText);
      return 'ok';
    },
    [isRecording, startRecording, stopRecording],
  );

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch { /* */ }
      }
      stopStream();
    };
  }, [stopStream]);

  return { isRecording, statusText, toggle };
}

function pickMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}
