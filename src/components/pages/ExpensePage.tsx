'use client';

import { useState, useRef, useCallback } from 'react';
import type { ProjectOption } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { todayStr } from '@/lib/utils';

interface ExpensePageProps {
  userId: string;
  userName: string;
  isReady: boolean;
  projects: ProjectOption[];
  onShowLoading: (text: string) => void;
  onHideLoading: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<any>;
  onAddExpense: (item: any) => void;
}

export default function ExpensePage({
  userId,
  userName,
  isReady,
  projects,
  onShowLoading,
  onHideLoading,
  onToast,
  sendToGas,
  onAddExpense,
}: ExpensePageProps) {
  const [imageBlobs, setImageBlobs] = useState<string[]>([]);
  const [project, setProject] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState('材料費');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newBlobs = [...imageBlobs];
      Array.from(files).forEach((file) => {
        if (newBlobs.length >= 3) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          newBlobs.push(e.target?.result as string);
          setImageBlobs([...newBlobs]);
        };
        reader.readAsDataURL(file);
      });
    },
    [imageBlobs],
  );

  const removeImg = (i: number) => {
    setImageBlobs((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!amount) { onToast('金額を入力してください', 'error'); return; }
    if (!project) { onToast('案件を選択してください', 'error'); return; }

    setSubmitting(true);
    onShowLoading('スプレッドシートに登録中...');

    try {
      await sendToGas('createExpense', {
        date,
        amount: Number(amount),
        category,
        description: memo || '未設定',
        project_id: project === 'general' ? '' : project,
        notes: '',
      });

      const opt = projects.find((o) => o.value === project);
      onAddExpense({
        project,
        projectName: opt?.label || '共通経費',
        amount: Number(amount),
        category,
        memo: memo || '未設定',
        date,
        userName,
        imageUrls: [],
      });

      onHideLoading();
      onToast('スプレッドシートに登録しました', 'success');
      resetForm();
    } catch (err) {
      onHideLoading();
      onToast(err instanceof Error ? err.message : '送信に失敗しました', 'error');
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setAmount('');
    setMemo('');
    setProject('');
    setDate(todayStr());
    setImageBlobs([]);
  };

  return (
    <div>
      {/* レシート・領収書 */}
      <div className="form-card">
        <h3>
          <span className="material-icons">photo_camera</span> レシート・領収書
        </h3>
        <div
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-line-green rounded-xl bg-line-green-light cursor-pointer transition-colors active:bg-green-200 mb-3"
          onClick={() => cameraRef.current?.click()}
        >
          <span className="material-icons text-[40px] text-line-green mb-1">receipt_long</span>
          <p className="text-line-green-dark font-semibold text-sm">レシート・領収書を撮影</p>
          <p className="text-[0.7rem] text-gray-400">タップしてカメラを起動</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            className="flex items-center justify-center gap-1.5 bg-gray-700 text-white py-2.5 rounded-lg text-xs font-semibold border-none cursor-pointer active:bg-gray-800"
            onClick={() => cameraRef.current?.click()}
          >
            <span className="material-icons text-lg">camera_alt</span> カメラ起動
          </button>
          <button
            className="flex items-center justify-center gap-1.5 bg-gray-700 text-white py-2.5 rounded-lg text-xs font-semibold border-none cursor-pointer active:bg-gray-800"
            onClick={() => galleryRef.current?.click()}
          >
            <span className="material-icons text-lg">photo_library</span> 写真選択
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />

        {imageBlobs.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {imageBlobs.map((blob, i) => (
              <div key={i} className="relative w-[32%]">
                <img src={blob} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                <div
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-[22px] h-[22px] text-xs text-center leading-[22px] cursor-pointer border-2 border-white"
                  onClick={() => removeImg(i)}
                >
                  ×
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 経費情報 */}
      <div className="form-card">
        <h3>
          <span className="material-icons">edit_note</span> 経費情報
        </h3>

        <label className="sp-label">案件番号 / 案件</label>
        <select className="sp-input" value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">案件を選択</option>
          {projects.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
          <option value="general">共通経費（案件なし）</option>
        </select>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="sp-label">金額</label>
            <input
              type="number"
              className="sp-input"
              placeholder="0"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="sp-label">日付</label>
            <input type="date" className="sp-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <label className="sp-label">カテゴリ</label>
        <select className="sp-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="sp-label">備考</label>
        <input
          type="text"
          className="sp-input"
          placeholder="品目や用途を入力"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <button className="btn-submit" onClick={handleSubmit} disabled={!isReady || submitting}>
          <span className="material-icons text-xl">cloud_upload</span>
          {!isReady ? '認証中...' : submitting ? '送信中...' : 'スプレッドシートに登録'}
        </button>
      </div>
    </div>
  );
}
