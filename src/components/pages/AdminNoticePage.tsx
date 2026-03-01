'use client';

import { useState, useEffect, useCallback } from 'react';
import { callGasGet, isGasConfigured } from '@/lib/gas';

interface Notice {
  id: number;
  user_name: string;
  user_role: string;
  title: string;
  body: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
}

const NOTICE_CATEGORIES = [
  { value: 'general', label: '連絡事項', color: 'bg-blue-50 text-blue-700' },
  { value: 'notice', label: 'お知らせ', color: 'bg-green-50 text-green-700' },
  { value: 'tip', label: '今日のお気づき', color: 'bg-yellow-50 text-yellow-700' },
];

interface AdminNoticePageProps {
  userName: string;
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<unknown>;
  onShowLoading: (text: string) => void;
  onHideLoading: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AdminNoticePage({ userName, sendToGas, onShowLoading, onHideLoading, onToast }: AdminNoticePageProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);

  const fetchNotices = useCallback(async () => {
    if (!isGasConfigured()) { setLoading(false); return; }
    try {
      const res = await callGasGet('getNotices', { limit: '20' });
      if (res?.success && res.data?.notices) {
        setNotices(res.data.notices);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handlePost = async () => {
    if (!body.trim()) { onToast('本文を入力してください', 'error'); return; }
    setPosting(true);
    onShowLoading('投稿中...');

    try {
      const res = await sendToGas('createNotice', {
        title: title.trim(),
        body: body.trim(),
        category,
        is_pinned: pinned,
      }) as { success?: boolean; data?: Notice };

      onHideLoading();
      if (res?.success && res.data) {
        setNotices((prev) => [res.data as Notice, ...prev]);
        setTitle('');
        setBody('');
        setCategory('general');
        setPinned(false);
        onToast('投稿しました。全メンバーにLINE通知を送信しました。', 'success');
      }
    } catch (err) {
      onHideLoading();
      onToast(err instanceof Error ? err.message : '投稿に失敗しました', 'error');
    }
    setPosting(false);
  };

  const getCatBadge = (cat: string) => {
    const c = NOTICE_CATEGORIES.find((nc) => nc.value === cat);
    if (!c) return null;
    return <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${c.color}`}>{c.label}</span>;
  };

  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      const now = new Date();
      const diff = now.getTime() - dt.getTime();
      if (diff < 60000) return 'たった今';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
      return dt.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
    } catch { return d; }
  };

  return (
    <div className="max-w-[500px] mx-auto px-3 pb-20">
      <div className="form-card">
        <h3 className="flex items-center gap-1.5">
          <span className="material-icons text-line-green align-middle">campaign</span>
          連絡投稿
          <span className="ml-auto px-2 py-0.5 text-[10px] bg-red-50 text-red-600 rounded font-bold">管理者</span>
        </h3>

        <p className="text-[0.65rem] text-gray-400 mb-3">
          投稿すると全メンバーにLINE通知が送信されます
        </p>

        {showForm && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-red-600" style={{ fontSize: 14 }}>person</span>
              </div>
              <span className="text-sm font-medium">{userName}</span>
            </div>

            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="sp-input flex-shrink-0"
                style={{ width: 'auto' }}
              >
                {NOTICE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="件名（任意）"
                className="sp-input flex-1"
              />
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="連絡内容を入力してください..."
              rows={5}
              className="sp-textarea"
            />

            <label className="flex items-center gap-1.5 text-[0.72rem] text-gray-500 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" />
              ピン留め（上部に固定）
            </label>

            <button className="btn-line-action" onClick={handlePost} disabled={!body.trim() || posting}>
              <span className="material-icons text-xl">send</span>
              {posting ? '送信中...' : '投稿＆LINE通知'}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full text-center text-[0.72rem] text-gray-400 py-1"
        >
          {showForm ? '▲ 入力フォームを閉じる' : '▼ 入力フォームを開く'}
        </button>
      </div>

      {/* 過去の投稿一覧 */}
      <div className="mt-4">
        <h4 className="text-[0.78rem] font-bold text-gray-500 mb-2 flex items-center gap-1">
          <span className="material-icons text-sm">history</span> 過去の投稿
        </h4>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-8 text-gray-300 text-sm">
            <span className="material-icons" style={{ fontSize: 32 }}>forum</span>
            <p className="mt-1">まだ投稿はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-3 ${n.is_pinned ? 'border-yellow-300' : 'border-gray-100'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[0.72rem] font-medium">{n.user_name}</span>
                  {n.user_role === 'admin' && (
                    <span className="px-1 py-0.5 bg-red-50 text-red-600 text-[8px] font-bold rounded">管理者</span>
                  )}
                  {getCatBadge(n.category)}
                  {n.is_pinned && (
                    <span className="material-icons text-yellow-500" style={{ fontSize: 12 }}>push_pin</span>
                  )}
                  <span className="text-[10px] text-gray-400 ml-auto">{fmtDate(n.created_at)}</span>
                </div>
                {n.title && <p className="text-[0.78rem] font-bold mb-0.5">{n.title}</p>}
                <p className="text-[0.72rem] text-gray-700 whitespace-pre-wrap leading-relaxed">{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
