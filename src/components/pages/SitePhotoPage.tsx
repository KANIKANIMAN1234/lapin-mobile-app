'use client';

import { useState, useRef, useCallback } from 'react';
import type { ProjectOption } from '@/types';
import { PHOTO_CATEGORIES } from '@/lib/constants';
import { todayStr, formatText } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface SitePhotoPageProps {
  projects: ProjectOption[];
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<any>;
  onShowLoading: (text: string) => void;
  onHideLoading: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function SitePhotoPage({ projects, sendToGas, onShowLoading, onHideLoading, onToast }: SitePhotoPageProps) {
  const [project, setProject] = useState('');
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState('before');
  const [workType, setWorkType] = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onVoiceResult = useCallback((text: string) => setMemo(text), []);
  const voice = useVoiceInput(onVoiceResult);

  const handleProjectChange = (val: string) => {
    setProject(val);
    const opt = projects.find((o) => o.value === val);
    const types = opt?.workTypes || [];
    setWorkTypes(types);
    setWorkType(types[0] || '');
  };

  const handleFormat = () => {
    if (!memo.trim()) { onToast('整形する文章がありません', 'error'); return; }
    setMemo(formatText(memo));
    onToast('文章を整形しました', 'success');
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - photos.length;
    if (remaining <= 0) { onToast('写真は最大10枚までです', 'error'); return; }
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => setPhotos((prev) => [...prev, e.target?.result as string]);
        reader.readAsDataURL(file);
      });
  };

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const upload = async () => {
    if (!project) { onToast('案件を選択してください', 'error'); return; }
    if (photos.length === 0) { onToast('写真を選択してください', 'error'); return; }

    setSubmitting(true);
    onShowLoading('アップロード中...');

    try {
      for (let i = 0; i < photos.length; i++) {
        const fileName = `photo_${Date.now()}_${i}.jpg`;
        await sendToGas('uploadPhoto', {
          project_id: project,
          type: category,
          drive_url: 'pending_upload',
          file_name: fileName,
          description: memo || '',
          photo_date: date,
        });
      }

      const count = photos.length;
      onHideLoading();
      setPhotos([]);
      setMemo('');
      setDate(todayStr());
      onToast(`${count}枚の写真メタデータを登録しました`, 'success');
    } catch (err) {
      onHideLoading();
      onToast(err instanceof Error ? err.message : 'アップロードに失敗しました', 'error');
    }
    setSubmitting(false);
  };

  const handleVoiceToggle = () => {
    const result = voice.toggle(memo);
    if (result === 'unsupported') {
      onToast('お使いのブラウザは音声入力に対応していません', 'error');
    }
  };

  return (
    <div className="form-card">
      <h3>
        <span className="material-icons">photo_library</span> 現場写真登録
      </h3>

      <div className="mb-3">
        <label className="sp-label">案件</label>
        <select className="sp-input" value={project} onChange={(e) => handleProjectChange(e.target.value)}>
          <option value="">案件を選択</option>
          {projects.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="sp-label">撮影日</label>
        <input type="date" className="sp-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="sp-label">カテゴリ</label>
        <select className="sp-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {PHOTO_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="sp-label">工事種別</label>
        <select className="sp-input" value={workType} onChange={(e) => setWorkType(e.target.value)}>
          {workTypes.length === 0 ? (
            <option value="">案件を選択してください</option>
          ) : (
            workTypes.map((wt) => (
              <option key={wt} value={wt}>{wt}</option>
            ))
          )}
        </select>
      </div>

      <div className="mb-3">
        <label className="sp-label">メモ</label>
        <div className="relative">
          <textarea
            className="sp-textarea pr-[50px]"
            rows={3}
            placeholder="場所や内容を入力、または音声入力"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
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

      <div
        className="border-2 border-dashed border-gray-300 rounded-xl py-7 px-4 text-center cursor-pointer text-gray-400 transition-colors hover:border-line-green hover:text-line-green mb-3"
        onClick={() => fileRef.current?.click()}
      >
        <span className="material-icons text-[40px] mb-1">cloud_upload</span>
        <p className="text-sm my-1">タップして写真を選択</p>
        <p className="text-[0.7rem] text-gray-400">複数選択可（最大10枚）</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }}
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                className="absolute top-1 right-1 w-[22px] h-[22px] rounded-full bg-black/60 text-white border-none cursor-pointer flex items-center justify-center p-0"
                onClick={() => removePhoto(i)}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <button className="btn-line-action" onClick={upload} disabled={submitting}>
          <span className="material-icons text-xl">cloud_upload</span>
          {submitting ? 'アップロード中...' : 'アップロード'}
        </button>
      )}
    </div>
  );
}
