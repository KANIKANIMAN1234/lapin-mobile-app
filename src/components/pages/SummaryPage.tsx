'use client';

import { useState, useMemo } from 'react';
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
import type { ExpenseItem, ProjectOption } from '@/types';
import { formatYen } from '@/lib/utils';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SummaryPageProps {
  data: ExpenseItem[];
  projects: ProjectOption[];
}

const CHART_COLORS = ['#06C755', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];
const BAR_COLORS = ['#06C755', '#05a948', '#3b82f6', '#2563eb', '#8b5cf6', '#a78bfa'];

export default function SummaryPage({ data, projects }: SummaryPageProps) {
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.value, p.label));
    data.forEach((d) => {
      if (d.project && !map.has(d.project)) {
        map.set(d.project, d.projectName);
      }
    });
    return map;
  }, [projects, data]);

  const projectEntries = useMemo(() => Array.from(projectMap.entries()), [projectMap]);

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

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filtered.forEach((d) => {
      stats[d.category] = (stats[d.category] || 0) + d.amount;
    });
    return stats;
  }, [filtered]);

  const projectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filtered.forEach((d) => {
      const label = projectMap.get(d.project) || d.projectName || d.project;
      stats[label] = (stats[label] || 0) + d.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filtered, projectMap]);

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
            {projectEntries.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

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
                    ticks: { font: { size: 10 }, callback: (v) => '\u00a5' + (Number(v) / 1000).toFixed(0) + 'K' },
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
