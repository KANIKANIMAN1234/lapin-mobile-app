'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ExpenseItem } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { formatYen } from '@/lib/utils';

interface HistoryPageProps {
  data: ExpenseItem[];
}

export default function HistoryPage({ data }: HistoryPageProps) {
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((d) => map.set(d.project, d.projectName));
    return Array.from(map.entries());
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const dt = new Date(d.date);
      return (
        (!filterProject || d.project === filterProject) &&
        (!filterCategory || d.category === filterCategory) &&
        (!filterYear || dt.getFullYear() === Number(filterYear)) &&
        (!filterMonth || dt.getMonth() + 1 === Number(filterMonth))
      );
    });
  }, [data, filterProject, filterCategory, filterYear, filterMonth]);

  const total = useMemo(() => filtered.reduce((sum, d) => sum + d.amount, 0), [filtered]);

  return (
    <div>
      {/* フィルタ */}
      <div className="bg-gray-100 p-2.5 rounded-xl mb-3">
        <div className="grid grid-cols-2 gap-2">
          <select className="sp-input py-2 text-xs" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">全案件</option>
            {projects.map(([id, name]) => (
              <option key={id} value={id}>{id} {name}</option>
            ))}
          </select>
          <select className="sp-input py-2 text-xs" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">全分類</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="sp-input py-2 text-xs" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">年</option>
            {Array.from({ length: 6 }, (_, i) => 2025 + i).map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select className="sp-input py-2 text-xs" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
      </div>

      {/* 合計 */}
      <div className="text-lg font-bold text-center text-gray-800 my-2.5 pb-2 border-b-2 border-line-green">
        合計: {formatYen(total)}
      </div>

      {/* リスト */}
      {filtered.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl p-3 mb-2 shadow-sm flex justify-between items-center"
        >
          <div>
            <div className="text-sm font-semibold">{item.memo}</div>
            <div className="text-[0.7rem] text-blue-500 font-medium">{item.project} {item.projectName}</div>
            <div className="text-[0.7rem] text-gray-400 mt-0.5">
              {item.category} / {item.date} / {item.userName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-red-500">{formatYen(item.amount)}</div>
            {item.imageUrls && item.imageUrls.length > 0 && (
              <div className="flex gap-1 mt-1">
                {item.imageUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[0.65rem] text-gray-600 no-underline"
                  >
                    📷 {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center text-gray-400 py-8 text-sm">データがありません</div>
      )}
    </div>
  );
}
