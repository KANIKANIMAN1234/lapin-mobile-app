'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProjectOption } from '@/types';
import { callGasGet, callGas } from '@/lib/gas';

interface MeetingPageProps {
  projects: ProjectOption[];
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<unknown>;
  onShowLoading: (text: string) => void;
  onHideLoading: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

interface MeetingRecord {
  id: number;
  project_id: string;
  meeting_date: string;
  meeting_type: string;
  attendees: string;
  content: string;
  next_action: string;
  user_name: string;
}

const MEETING_TYPES = ['訪問', '電話', 'オンライン', 'メール', '来店', 'その他'];

export default function MeetingPage({ projects, sendToGas, onShowLoading, onHideLoading, onToast }: MeetingPageProps) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');

  const [form, setForm] = useState({
    project_id: '',
    meeting_date: new Date().toISOString().substring(0, 10),
    meeting_type: '訪問',
    attendees: '',
    content: '',
    next_action: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiFormatting, setAiFormatting] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  const loadMeetings = useCallback(async (projectId?: string) => {
    if (!projectId) { setMeetings([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await callGasGet('getMeetings', { project_id: projectId });
      if (res?.success && res.data?.meetings) {
        setMeetings(res.data.meetings);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedProject) loadMeetings(selectedProject);
    else { setMeetings([]); setLoading(false); }
  }, [selectedProject, loadMeetings]);

  const toggleVoice = useCallback(() => {
    if (isRecording) {
      const rec = recognitionRef.current as { stop?: () => void } | null;
      rec?.stop?.();
      setIsRecording(false);
      return;
    }
    const W = window as unknown as Record<string, unknown>;
    const SpeechRec = (W.SpeechRecognition || W.webkitSpeechRecognition) as { new(): {
      lang: string; continuous: boolean; interimResults: boolean;
      onresult: (e: { results: { isFinal: boolean;[n: number]: { transcript: string } }[] }) => void;
      onerror: () => void; onend: () => void; start: () => void; stop: () => void;
    } } | undefined;
    if (!SpeechRec) { onToast('このブラウザは音声入力に対応していません', 'error'); return; }
    const rec = new SpeechRec();
    rec.lang = 'ja-JP';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setForm((prev) => ({ ...prev, content: prev.content.split('\n【音声入力中】')[0] + (transcript ? '\n【音声入力中】' + transcript : '') }));
      const allFinal = Array.from(e.results).every((r) => r.isFinal);
      if (allFinal && transcript) {
        setForm((prev) => {
          const base = prev.content.split('\n【音声入力中】')[0];
          return { ...prev, content: (base ? base + '\n' : '') + transcript };
        });
      }
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }, [isRecording, onToast]);

  const handleAiFormat = useCallback(async () => {
    const raw = form.content.split('\n【音声入力中】')[0].trim();
    if (!raw) return;
    setAiFormatting(true);
    try {
      const res = await callGas('formatText', { input_text: raw, format_type: 'meeting' });
      const data = res as { success: boolean; data?: { formatted_text?: string } };
      if (data?.success && data.data?.formatted_text) {
        setForm((prev) => ({ ...prev, content: data.data!.formatted_text! }));
        onToast('AI整形が完了しました', 'success');
      } else {
        onToast('AI整形に失敗しました', 'error');
      }
    } catch {
      onToast('AI整形に失敗しました', 'error');
    }
    setAiFormatting(false);
  }, [form.content, onToast]);

  const handleSubmit = async () => {
    if (!form.project_id || !form.content.trim()) {
      onToast('案件と内容は必須です', 'error');
      return;
    }
    setSubmitting(true);
    onShowLoading('商談記録を保存中...');
    try {
      const cleanContent = form.content.split('\n【音声入力中】')[0].trim();
      await sendToGas('createMeeting', { ...form, content: cleanContent });
      onToast('商談記録を保存しました', 'success');
      setForm({
        project_id: form.project_id,
        meeting_date: new Date().toISOString().substring(0, 10),
        meeting_type: '訪問', attendees: '', content: '', next_action: '',
      });
      setView('list');
      setSelectedProject(form.project_id);
      await loadMeetings(form.project_id);
    } catch {
      onToast('保存に失敗しました', 'error');
    }
    onHideLoading();
    setSubmitting(false);
  };

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      '訪問': 'bg-blue-100 text-blue-700',
      '電話': 'bg-purple-100 text-purple-700',
      'オンライン': 'bg-cyan-100 text-cyan-700',
      'メール': 'bg-yellow-100 text-yellow-700',
      '来店': 'bg-green-100 text-green-700',
    };
    return map[type] || 'bg-gray-100 text-gray-700';
  };

  if (view === 'create') {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">商談記録を追加</h3>
          <button onClick={() => setView('list')} className="text-gray-400">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">案件 *</label>
            <select className="form-input w-full text-sm" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">案件を選択</option>
              {projects.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">日付 *</label>
              <input type="date" className="form-input w-full text-sm" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">種別</label>
              <select className="form-input w-full text-sm" value={form.meeting_type} onChange={(e) => setForm({ ...form, meeting_type: e.target.value })}>
                {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">参加者</label>
            <input className="form-input w-full text-sm" placeholder="例: 山田太郎, 高橋花子" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">内容 *</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                    isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className="material-icons" style={{ fontSize: 14 }}>{isRecording ? 'stop' : 'mic'}</span>
                  {isRecording ? '停止' : '音声'}
                </button>
                <button
                  type="button"
                  onClick={handleAiFormat}
                  disabled={aiFormatting || !form.content.split('\n【音声入力中】')[0].trim()}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 disabled:opacity-40 transition-colors"
                >
                  <span className="material-icons" style={{ fontSize: 14 }}>auto_fix_high</span>
                  {aiFormatting ? '整形中...' : 'AI整形'}
                </button>
              </div>
            </div>
            <textarea
              className={`form-input w-full text-sm ${isRecording ? 'border-red-300 bg-red-50/30' : ''}`}
              rows={6}
              placeholder={isRecording ? '音声を認識しています...' : '商談内容を入力（音声入力可）'}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            {isRecording && (
              <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                音声認識中...
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">次のアクション</label>
            <input className="form-input w-full text-sm" placeholder="例: 見積書を送付する" value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !form.project_id || !form.content.split('\n【音声入力中】')[0].trim()}
          className="mt-4 w-full py-3 bg-line-green text-white font-bold rounded-xl disabled:opacity-50 inline-flex items-center justify-center gap-1"
        >
          <span className="material-icons text-lg">save</span>
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base">商談記録</h3>
        <button
          onClick={() => { setView('create'); setForm((f) => ({ ...f, project_id: selectedProject })); }}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-line-green text-white text-xs font-bold rounded-lg"
        >
          <span className="material-icons text-sm">add</span>新規追加
        </button>
      </div>

      <div className="mb-3">
        <select
          className="form-input w-full text-sm"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">案件を選択して表示</option>
          {projects.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {!selectedProject ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <span className="material-icons text-4xl text-gray-300 mb-2 block">handshake</span>
          <p className="text-sm text-gray-400">案件を選択すると商談記録が表示されます</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-gray-400 text-sm">読み込み中...</div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <span className="material-icons text-4xl text-gray-300 mb-2 block">description</span>
          <p className="text-sm text-gray-400">商談記録はまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">{(m.meeting_date || '').substring(0, 10)}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${typeBadge(m.meeting_type)}`}>{m.meeting_type}</span>
                </div>
                <span className="text-[10px] text-gray-400">{m.user_name}</span>
              </div>
              {m.attendees && (
                <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-0.5">
                  <span className="material-icons" style={{ fontSize: 12 }}>people</span>{m.attendees}
                </p>
              )}
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.next_action && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-1">
                  <span className="material-icons text-orange-500" style={{ fontSize: 14, marginTop: 1 }}>flag</span>
                  <div>
                    <span className="text-[10px] text-orange-600 font-medium">次のアクション</span>
                    <p className="text-xs text-gray-700">{m.next_action}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
