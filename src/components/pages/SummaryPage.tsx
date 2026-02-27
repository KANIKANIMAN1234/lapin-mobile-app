'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { ExpenseItem } from '@/types';
import { PROJECT_MASTER } from '@/lib/constants';
import { formatYen } from '@/lib/utils';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SummaryPageProps {
  data: ExpenseItem[];
}

const CHART_COLORS = ['#06C755', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];
const BAR_COLORS = ['#06C755', '#05a948', '#3b82f6', '#2563eb', '#8b5cf6', '#a78bfa'];

export default function SummaryPage({ data }: SummaryPageProps) {
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((d) => map.set(d.project, d.projectName));
    return Array.from(map.entries());
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const dt = new Date(d.date);
      return (
        (!filterYear || dt.getFullYear() === Number(filterYear)) &&
        (!filterMonth || dt.getMonth() + 1 === Number(filterMonth)) &&
        (!filterProject || d.project === filterProject)
      );
    });
  }, [data, filterYear, filterMonth, filterProject]);

  const total = useMemo(() => filtered.reduce((sum, d) => sum + d.amount, 0), [filtered]);

  // カテゴリ別集計
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filtered.forEach((d) => {
      stats[d.category] = (stats[d.category] || 0) + d.amount;
    });
    return stats;
  }, [filtered]);

  // 案件別集計
  const projectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filtered.forEach((d) => {
      const key = `${d.project} ${d.projectName}`;
      stats[key] = (stats[key] || 0) + d.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // 案件別原価率
  const costRatioData = useMemo(() => {
    const expByProject: Record<string, number> = {};
    filtered.forEach((d) => {
      if (d.project !== 'general') {
        expByProject[d.project] = (expByProject[d.project] || 0) + d.amount;
      }
    });

    let projectIds = Object.keys(PROJECT_MASTER).filter((k) => k !== 'general');
    if (filterProject && filterProject !== 'general') {
      projectIds = projectIds.filter((k) => k === filterProject);
    }

    return projectIds
      .map((pid) => {
        const master = PROJECT_MASTER[pid];
        if (!master || master.orderAmount === 0) return null;
        const actualExp = expByProject[pid] || 0;
        const actualRate = (actualExp / master.orderAmount) * 100;
        const estimatedExp = actualExp + master.scheduledPayments;
        const estimatedRate = (estimatedExp / master.orderAmount) * 100;
        return { pid, master, actualRate, estimatedRate };
      })
      .filter(Boolean) as Array<{
      pid: string;
      master: (typeof PROJECT_MASTER)[string];
      actualRate: number;
      estimatedRate: number;
    }>;
  }, [filtered, filterProject]);

  const getRateClass = (rate: number, planned: number) => {
    if (rate >= planned) return 'text-red-500 font-bold';
    if (rate >= planned * 0.8) return 'text-amber-500 font-semibold';
    return 'text-emerald-500 font-semibold';
  };

  const categoryChartData = {
    labels: Object.keys(categoryStats),
    datasets: [
      {
        data: Object.values(categoryStats),
        backgroundColor: CHART_COLORS,
      },
    ],
  };

  const projectChartData = {
    labels: projectStats.map((s) => s[0]),
    datasets: [
      {
        data: projectStats.map((s) => s[1]),
        backgroundColor: projectStats.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
        borderRadius: 4,
      },
    ],
  };

  return (
    <div>
      {/* フィルタ */}
      <div className="bg-gray-100 p-2.5 rounded-xl mb-3">
        <div className="grid grid-cols-3 gap-2">
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
          <select className="sp-input py-2 text-xs" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">全案件</option>
            {projects.map(([id, name]) => (
              <option key={id} value={id}>{id} {name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-gray-900">{formatYen(total)}</div>
          <div className="text-[0.7rem] text-gray-500 mt-0.5">経費合計</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-gray-900">{filtered.length}件</div>
          <div className="text-[0.7rem] text-gray-500 mt-0.5">登録件数</div>
        </div>
      </div>

      {/* 原価率テーブル */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">案件別 原価率一覧</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.72rem] whitespace-nowrap">
            <thead>
              <tr>
                <th className="py-1.5 px-1.5 border-b border-gray-200 bg-gray-50 font-bold text-gray-600 text-left sticky top-0">案件</th>
                <th className="py-1.5 px-1.5 border-b border-gray-200 bg-gray-50 font-bold text-gray-600 text-right">受注金額</th>
                <th className="py-1.5 px-1.5 border-b border-gray-200 bg-gray-50 font-bold text-gray-600 text-right">予定原価率</th>
                <th className="py-1.5 px-1.5 border-b border-gray-200 bg-gray-50 font-bold text-gray-600 text-right">実質原価率</th>
                <th className="py-1.5 px-1.5 border-b border-gray-200 bg-gray-50 font-bold text-gray-600 text-right">想定原価率</th>
              </tr>
            </thead>
            <tbody>
              {costRatioData.map((row, i) => (
                <tr key={row.pid} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                  <td className="py-1.5 px-1.5 border-b border-gray-100 font-semibold text-left">
                    {row.pid}<br />{row.master.name}
                  </td>
                  <td className="py-1.5 px-1.5 border-b border-gray-100 text-right">
                    {formatYen(row.master.orderAmount)}
                  </td>
                  <td className="py-1.5 px-1.5 border-b border-gray-100 text-right">
                    {row.master.plannedCostRate}%
                  </td>
                  <td className={`py-1.5 px-1.5 border-b border-gray-100 text-right ${getRateClass(row.actualRate, row.master.plannedCostRate)}`}>
                    {row.actualRate.toFixed(1)}%
                  </td>
                  <td className={`py-1.5 px-1.5 border-b border-gray-100 text-right ${getRateClass(row.estimatedRate, row.master.plannedCostRate)}`}>
                    {row.estimatedRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* カテゴリ別円グラフ */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">カテゴリ別内訳</h3>
        <div className="flex justify-center">
          {Object.keys(categoryStats).length > 0 ? (
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                  legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                  tooltip: {
                    callbacks: {
                      label: (c) => {
                        const totalVal = (c.dataset.data as number[]).reduce((a, b) => a + b, 0);
                        return `${c.label}: ${formatYen(c.raw as number)} (${(((c.raw as number) / totalVal) * 100).toFixed(1)}%)`;
                      },
                    },
                  },
                },
              }}
            />
          ) : (
            <p className="text-gray-400 text-sm py-4">データがありません</p>
          )}
        </div>
      </div>

      {/* 案件別棒グラフ */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">案件別経費</h3>
        <div className="h-[220px]">
          {projectStats.length > 0 ? (
            <Bar
              data={projectChartData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: { font: { size: 10 }, callback: (v) => '¥' + (Number(v) / 1000).toFixed(0) + 'K' },
                  },
                  y: { ticks: { font: { size: 9 } } },
                },
              }}
            />
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">データがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
