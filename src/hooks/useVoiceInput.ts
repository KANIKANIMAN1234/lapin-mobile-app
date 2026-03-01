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

  const showStatus = useCallback((msg: string, autoHideMs?: number) => {
    setStatusText(msg);
    if (autoHideMs) setTimeout(() => setStatusText(''), autoHideMs);
  }, []);

  const startRecording = useCallback(async (currentText: string): Promise<boolean> => {
    if (busyRef.current) return false;
    baseTextRef.current = currentText;

    if (typeof navigator === 'undefined') {
      showStatus('❌ このブラウザは音声入力に対応していません', 5000);
      return false;
    }

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      showStatus('❌ マイクにアクセスできるブラウザで開いてください（LINEアプリ外のChromeブラウザ等）', 8000);
      return false;
    }

    try {
      showStatus('🎤 マイクへのアクセスを要求中...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      showStatus('🎙 録音中…停止ボタンを押すと文字起こしします');
      return true;
    } catch (err) {
      console.error('[useVoiceInput] getUserMedia error:', err);
      stopStream();
      const errName = (err as DOMException)?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        showStatus('❌ マイクの使用が拒否されました。ブラウザの設定でマイクを許可してください。', 8000);
      } else if (errName === 'NotFoundError') {
        showStatus('❌ マイクが見つかりません', 5000);
      } else {
        showStatus('❌ マイクを開始できません: ' + (errName || String(err)), 5000);
      }
      return false;
    }
  }, [stopStream, showStatus]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      setIsRecording(false);
      showStatus('');
      stopStream();
      return;
    }

    busyRef.current = true;
    showStatus('⏳ 文字起こし中…少々お待ちください');
    setIsRecording(false);

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    stopStream();
    mediaRecorderRef.current = null;

    if (audioChunksRef.current.length === 0) {
      showStatus('音声データがありません', 3000);
      busyRef.current = false;
      return;
    }

    const mime = recorder.mimeType || 'audio/webm';
    const blob = new Blob(audioChunksRef.current, { type: mime });
    audioChunksRef.current = [];
    console.log('[useVoiceInput] audio blob:', blob.size, 'bytes, type:', mime);

    try {
      const base64 = await blobToBase64(blob);
      const pureMime = mime.split(';')[0] || 'audio/webm';
      console.log('[useVoiceInput] sending to GAS, base64 length:', base64.length, 'mime:', pureMime);
      const res = await callGas('transcribeAudio', { audio_data: base64, mime_type: pureMime });
      console.log('[useVoiceInput] GAS response:', JSON.stringify(res).substring(0, 300));

      if (res.success && res.data?.text) {
        const prev = baseTextRef.current;
        const newText = prev ? prev + '\n' + res.data.text : res.data.text;
        onResultRef.current(newText);
        showStatus('✅ 文字起こし完了', 2500);
      } else {
        const msg = typeof res.error === 'string' ? res.error
          : typeof res.error === 'object' && res.error ? JSON.stringify(res.error)
          : '文字起こしに失敗しました';
        console.error('[useVoiceInput] transcribe error:', msg);
        showStatus('❌ ' + msg, 5000);
      }
    } catch (err) {
      console.error('[useVoiceInput] transcribe network error:', err);
      showStatus('❌ 通信エラーが発生しました', 5000);
    }

    busyRef.current = false;
  }, [stopStream, showStatus]);

  const toggle = useCallback(
    (currentText: string) => {
      if (busyRef.current) return 'ok';
      if (isRecording) {
        stopRecording();
        return 'ok';
      }

      if (typeof MediaRecorder === 'undefined') return 'unsupported';
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
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
  ];
  for (const m of candidates) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch { /* */ }
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
