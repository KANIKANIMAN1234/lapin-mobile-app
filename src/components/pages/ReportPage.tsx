'use client';

import { useState, useRef, useCallback } from 'react';
import type { ProjectOption } from '@/types';
import { todayStr, formatText } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface ReportPageProps {
  projects: ProjectOption[];
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<any>;
  onShowLoading: (text: string) => void;
  onHideLoading: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ReportPage({ projects, sendToGas, onShowLoading, onHideLoading, onToast }: ReportPageProps) {
  const [date, setDate] = useState(todayStr());
  const [project, setProject] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const onVoiceResult = useCallback((text: string) => setContent(text), []);
  const voice = useVoiceInput(onVoiceResult);

  const handleFormat = () => {
    if (!content.trim()) {
      onToast('整形する文章がありません', 'error');
      return;
    }
    setContent(formatText(content));
    onToast('文章を整形しました', 'success');
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - photos.length;
    if (remaining <= 0) { onToast('写真は最大5枚までです', 'error'); return; }
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => setPhotos((prev) => [...prev, e.target?.result as string]);
        reader.readAsDataURL(file);
      });
  };

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!content.trim()) { onToast('報告内容を入力してください', 'error'); return; }

    setSubmitting(true);
    onShowLoading('日報を送信中...');

    try {
      await sendToGas('createReport', {
        report_date: date,
        content: content.trim(),
        title: `${date} 日報`,
      });

      onHideLoading();
      onToast('日報を送信しました', 'success');
      setContent('');
      setProject('');
      setPhotos([]);
      setDate(todayStr());
    } catch (err) {
      onHideLoading();
      onToast(err instanceof Error ? err.message : '送信に失敗しました', 'error');
    }
    setSubmitting(false);
  };

  const handleVoiceToggle = () => {
    const result = voice.toggle(content);
    if (result === 'unsupported') {
      onToast('お使いのブラウザは音声入力に対応していません', 'error');
    }
  };

  return (
    <div className="form-card">
      <h3>日報作成</h3>

      <div className="mb-3">
        <label className="sp-label">日付</label>
        <input type="date" className="sp-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="sp-label">案件</label>
        <select className="sp-input" value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">案件を選択（任意）</option>
          {projects.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="sp-label">報告内容</label>
        <div className="relative">
          <textarea
            className="sp-textarea pr-[50px]"
            rows={6}
            placeholder="報告内容を入力、または音声入力してください"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            className={`voice-btn ${voice.isRecording ? 'recording' : ''}`}
            onClick={handleVoiceToggle}
          >
            <span className="material-icons">{voice.isRecording ? 'stop' : 'mic'}</span>
          </button>
        </div>
        <div className={`text-xs min-h-[18px] mt-1 ${voice.isRecording ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
          {voice.statusText}
        </div>
        <button className="btn-format" onClick={handleFormat}>
          <span className="material-icons text-base">auto_fix_high</span> 文章を整形
        </button>
      </div>

      <div className="mb-3">
        <label className="sp-label">
          写真 <span className="text-gray-400 font-normal">(最大5枚)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {photos.map((src, i) => (
            <div key={i} className="w-[72px] h-[72px] rounded-lg overflow-hidden relative border border-gray-200">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white border-none cursor-pointer flex items-center justify-center p-0"
                onClick={() => removePhoto(i)}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <div
              className="w-[72px] h-[72px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer text-gray-400 hover:border-line-green hover:text-line-green transition-colors"
              onClick={() => photoInputRef.current?.click()}
            >
              <span className="material-icons text-[28px]">add_a_photo</span>
            </div>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }}
        />
      </div>

      <button className="btn-line-action" onClick={submit} disabled={submitting}>
        <span className="material-icons text-xl">send</span>
        {submitting ? '送信中...' : '日報を送信'}
      </button>
    </div>
  );
}
