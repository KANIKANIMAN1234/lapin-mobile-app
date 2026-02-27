'use client';

import { useState, useEffect, useRef } from 'react';
import type { AttendanceLog } from '@/types';
import { padTime, todayStr } from '@/lib/utils';

interface AttendancePageProps {
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AttendancePage({ sendToGas, onToast }: AttendancePageProps) {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [status, setStatus] = useState('未打刻');
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

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

  const recordAttendance = async (type: 'clock_in' | 'clock_out') => {
    const now = new Date();
    const t = `${padTime(now.getHours())}:${padTime(now.getMinutes())}`;
    const typeLabel = type === 'clock_in' ? '出勤' : '退勤';

    setSubmitting(true);
    try {
      await sendToGas('createAttendance', {
        type,
        date: todayStr(),
        time: t,
      });

      setLogs((prev) => [...prev, { type: type === 'clock_in' ? 'in' : 'out', time: t }]);
      if (type === 'clock_in') {
        setIsClockedIn(true);
        setStatus(`出勤中 (${t}〜)`);
      } else {
        setIsClockedIn(false);
        const inLog = [...logs].reverse().find((l) => l.type === 'in');
        setStatus(`退勤済み (${inLog ? inLog.time : ''}〜${t})`);
      }
      onToast(`${typeLabel}を記録しました (${t})`, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : `${typeLabel}の記録に失敗しました`, 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
      <div className="text-sm text-gray-500 mb-1">{dateStr}</div>
      <div className="text-[2.8rem] font-extrabold text-gray-900 tracking-wider mb-6 tabular-nums">{timeStr}</div>
      <div className="flex gap-4 justify-center mb-5">
        <button
          className={`w-[130px] h-[130px] rounded-full border-none flex flex-col items-center justify-center gap-1.5 text-base font-bold cursor-pointer transition-transform shadow-lg ${
            isClockedIn || submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-line-green text-white active:scale-95'
          }`}
          onClick={() => recordAttendance('clock_in')}
          disabled={isClockedIn || submitting}
        >
          <span className="material-icons text-4xl">login</span>
          <span>{submitting ? '記録中...' : '出勤'}</span>
        </button>
        <button
          className={`w-[130px] h-[130px] rounded-full border-none flex flex-col items-center justify-center gap-1.5 text-base font-bold cursor-pointer transition-transform shadow-lg ${
            !isClockedIn || submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 text-white active:scale-95'
          }`}
          onClick={() => recordAttendance('clock_out')}
          disabled={!isClockedIn || submitting}
        >
          <span className="material-icons text-4xl">logout</span>
          <span>{submitting ? '記録中...' : '退勤'}</span>
        </button>
      </div>
      <div className="text-sm font-semibold text-gray-500 mb-4 px-4 py-2 bg-gray-50 rounded-full inline-block">
        {status}
      </div>
      <div className="mt-4 text-left">
        {[...logs].reverse().map((log, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 text-sm">
            <span className={`material-icons text-lg ${log.type === 'in' ? 'text-line-green' : 'text-red-500'}`}>
              {log.type === 'in' ? 'login' : 'logout'}
            </span>
            <span className="font-bold min-w-[50px]">{log.time}</span>
            <span className="text-gray-600">{log.type === 'in' ? '出勤' : '退勤'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
