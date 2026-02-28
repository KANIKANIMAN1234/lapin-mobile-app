'use client';

import { useState, useEffect, useRef } from 'react';
import type { AttendanceLog } from '@/types';
import { padTime, todayStr } from '@/lib/utils';
import { callGasGet, isGasConfigured } from '@/lib/gas';

interface AttendancePageProps {
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

type AttStatus = 'none' | 'working' | 'break' | 'left';

function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  });
}

export default function AttendancePage({ sendToGas, onToast }: AttendancePageProps) {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [attStatus, setAttStatus] = useState<AttStatus>('none');
  const [statusLabel, setStatusLabel] = useState('未打刻');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  // 時計の更新
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      setDateStr(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${days[now.getDay()]}）`);
      setTimeStr(`${padTime(now.getHours())}:${padTime(now.getMinutes())}:${padTime(now.getSeconds())}`);
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // GASから今日の勤怠ステータスを取得して復元
  useEffect(() => {
    if (!isGasConfigured()) { setLoading(false); return; }
    callGasGet('getAttendanceStatus').then((res) => {
      if (res?.success && res.data) {
        const d = res.data;
        const s = (d.status as AttStatus) || 'none';
        setAttStatus(s);

        const newLogs: AttendanceLog[] = [];
        if (d.clock_in) newLogs.push({ type: 'in', time: d.clock_in });
        if (d.break_start) newLogs.push({ type: 'break_start', time: d.break_start });
        if (d.break_end) newLogs.push({ type: 'break_end', time: d.break_end });
        if (d.clock_out) newLogs.push({ type: 'out', time: d.clock_out });
        setLogs(newLogs);

        if (s === 'working') setStatusLabel(`勤務中 (${d.clock_in}〜)`);
        else if (s === 'break') setStatusLabel('休憩中');
        else if (s === 'left') setStatusLabel(`退勤済み (${d.clock_in}〜${d.clock_out})`);
        else setStatusLabel('未打刻');
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const recordAttendance = async (type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out') => {
    const now = new Date();
    const t = `${padTime(now.getHours())}:${padTime(now.getMinutes())}`;
    const labels: Record<string, string> = { clock_in: '出勤', break_start: '休憩', break_end: '戻り', clock_out: '退勤' };

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { type, date: todayStr(), time: t };

      if (type === 'clock_in' || type === 'clock_out') {
        const loc = await getLocation();
        if (loc) {
          payload.latitude = loc.latitude;
          payload.longitude = loc.longitude;
        }
      }

      await sendToGas('createAttendance', payload);

      const logType = type === 'clock_in' ? 'in' : type === 'clock_out' ? 'out' : type === 'break_start' ? 'break_start' : 'break_end';
      setLogs((prev) => [...prev, { type: logType, time: t }]);

      if (type === 'clock_in') {
        setAttStatus('working');
        setStatusLabel(`勤務中 (${t}〜)`);
      } else if (type === 'break_start') {
        setAttStatus('break');
        setStatusLabel('休憩中');
      } else if (type === 'break_end') {
        setAttStatus('working');
        setStatusLabel('勤務中');
      } else {
        setAttStatus('left');
        const inLog = [...logs].reverse().find((l) => l.type === 'in');
        setStatusLabel(`退勤済み (${inLog ? inLog.time : ''}〜${t})`);
      }
      onToast(`${labels[type]}を記録しました (${t})`, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : `${labels[type]}の記録に失敗しました`, 'error');
    }
    setSubmitting(false);
  };

  const logLabels: Record<string, { icon: string; label: string; color: string }> = {
    in: { icon: 'login', label: '出勤', color: 'text-line-green' },
    out: { icon: 'logout', label: '退勤', color: 'text-red-500' },
    break_start: { icon: 'free_breakfast', label: '休憩', color: 'text-amber-500' },
    break_end: { icon: 'replay', label: '戻り', color: 'text-blue-500' },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <div className="py-8 text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
      <div className="text-sm text-gray-500 mb-1">{dateStr}</div>
      <div className="text-[2.8rem] font-extrabold text-gray-900 tracking-wider mb-6 tabular-nums">{timeStr}</div>

      <div className="grid grid-cols-2 gap-3 mb-5 max-w-[300px] mx-auto">
        <button
          className={`w-full aspect-square rounded-full border-none flex flex-col items-center justify-center gap-1.5 text-base font-bold cursor-pointer transition-transform shadow-lg ${
            submitting || attStatus !== 'none' ? 'bg-gray-300 cursor-not-allowed' : 'bg-line-green text-white active:scale-95'
          }`}
          onClick={() => recordAttendance('clock_in')}
          disabled={submitting || attStatus !== 'none'}
        >
          <span className="material-icons text-4xl">login</span>
          <span>出勤</span>
        </button>
        <button
          className={`w-full aspect-square rounded-full border-none flex flex-col items-center justify-center gap-1.5 text-base font-bold cursor-pointer transition-transform shadow-lg ${
            submitting || attStatus !== 'working' ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-400 text-white active:scale-95'
          }`}
          onClick={() => recordAttendance('break_start')}
          disabled={submitting || attStatus !== 'working'}
        >
          <span className="material-icons text-4xl">free_breakfast</span>
          <span>休憩</span>
        </button>
        <button
          className={`w-full aspect-square rounded-full border-none flex flex-col items-center justify-center gap-1.5 text-base font-bold cursor-pointer transition-transform shadow-lg ${
            submitting || attStatus !== 'break' ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white active:scale-95'
          }`}
          onClick={() => recordAttendance('break_end')}
          disabled={submitting || attStatus !== 'break'}
        >
          <span className="material-icons text-4xl">replay</span>
          <span>戻り</span>
        </button>
        <button
          className={`w-full aspect-square rounded-full border-none flex flex-col items-center justify-center gap-1.5 text-base font-bold cursor-pointer transition-transform shadow-lg ${
            submitting || attStatus === 'none' || attStatus === 'left' ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 text-white active:scale-95'
          }`}
          onClick={() => recordAttendance('clock_out')}
          disabled={submitting || attStatus === 'none' || attStatus === 'left'}
        >
          <span className="material-icons text-4xl">logout</span>
          <span>退勤</span>
        </button>
      </div>

      <div className="text-sm font-semibold text-gray-500 mb-4 px-4 py-2 bg-gray-50 rounded-full inline-block">
        {statusLabel}
      </div>

      <div className="mt-4 text-left">
        {[...logs].reverse().map((log, i) => {
          const info = logLabels[log.type] || { icon: 'schedule', label: log.type, color: 'text-gray-500' };
          return (
            <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 text-sm">
              <span className={`material-icons text-lg ${info.color}`}>{info.icon}</span>
              <span className="font-bold min-w-[50px]">{log.time}</span>
              <span className="text-gray-600">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
