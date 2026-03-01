'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { callGasGet, isGasConfigured } from '@/lib/gas';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SummaryPageProps {
  data: ExpenseItem[];
  projects: ProjectOption[];
}

interface KpiData {
  assigned_projects_count: number;
  assigned_projects_amount: number;
  sent_estimates_count: number;
  sent_estimates_amount: number;
  contract_count: number;
  contract_amount: number;
  contract_rate: number;
  average_contract_amount: number;
  gross_profit_amount: number;
  gross_profit_rate: number;
}

interface BonusData {
  period_label: string;
  period_months: string;
  fixed_cost: number;
  gross_profit: number;
  surplus: number;
  bonus_estimate: number;
  distribution_rate: number;
  target_amount: number;
  achievement_rate: number;
}

const CHART_COLORS = ['#06C755', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981'];
const BAR_COLORS = ['#06C755', '#05a948', '#3b82f6', '#2563eb', '#8b5cf6', '#a78bfa'];

export default function SummaryPage({ data, projects }: SummaryPageProps) {
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [bonus, setBonus] = useState<BonusData | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    if (!isGasConfigured()) { setDashLoading(false); return; }
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
    callGasGet('getDashboard', { start_date: startDate, end_date: endDate })
      .then((res) => {
        if (res?.success && res.data) {
          if (res.data.kpi) setKpi(res.data.kpi as KpiData);
          if (res.data.bonus_progress) setBonus(res.data.bonus_progress as BonusData);
        }
      })
      .catch(() => {})
      .finally(() => setDashLoading(false));
  }, []);

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

  const kpiItems = kpi ? [
    { title: '担当案件数', value: String(kpi.assigned_projects_count), unit: '件' },
    { title: '見込み金額', value: formatYen(kpi.assigned_projects_amount), unit: '' },
    { title: '送客金額', value: formatYen(kpi.sent_estimates_amount ?? 0), unit: '' },
    { title: '見積もり数', value: String(kpi.sent_estimates_count), unit: '件' },
    { title: '契約数', value: String(kpi.contract_count), unit: '件' },
    { title: '契約平均単価', value: kpi.average_contract_amount > 0 ? formatYen(kpi.average_contract_amount) : '-', unit: '' },
    { title: '契約率', value: String(kpi.contract_rate), unit: '%' },
    { title: '粗利率', value: String(kpi.gross_profit_rate), unit: '%' },
  ] : [];

  return (
    <div>
      {/* KPIカード */}
      {dashLoading ? (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-3 text-center text-gray-400 text-sm">KPI読み込み中...</div>
      ) : kpi && (
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {kpiItems.map((item) => (
            <div key={item.title} className="bg-white rounded-lg p-2 shadow-sm text-center">
              <div className="text-[10px] text-gray-500 mb-0.5 truncate">{item.title}</div>
              <div className="text-sm font-bold text-gray-900 leading-tight">
                {item.value}
                {item.unit && <span className="text-[10px] font-normal text-gray-500 ml-0.5">{item.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ボーナス進捗 */}
      {bonus && (
        <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <span className="material-icons text-amber-500" style={{ fontSize: 16 }}>emoji_events</span>
              マイボーナス進捗（{bonus.period_label}）
            </h3>
            <span className="text-[10px] text-gray-400">{bonus.period_months}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500">固定費負担額</div>
              <div className="text-xs font-bold">{formatYen(bonus.fixed_cost)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500">期間粗利</div>
              <div className="text-xs font-bold">{formatYen(bonus.gross_profit)}</div>
            </div>
            <div className={`rounded-lg p-2 text-center ${bonus.surplus >= 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="text-[10px] text-gray-500">粗利 − 固定費</div>
              <div className={`text-xs font-bold ${bonus.surplus >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {bonus.surplus >= 0 ? '+' : ''}{formatYen(bonus.surplus)}
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500">ボーナス見込み</div>
              <div className="text-xs font-bold text-amber-600">{formatYen(bonus.bonus_estimate)}</div>
              <div className="text-[9px] text-gray-400">超過分 × {bonus.distribution_rate}%</div>
            </div>
          </div>
          {/* プログレスバー */}
          <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5">
            <span>0</span>
            <span>固定費 {formatYen(bonus.fixed_cost)}</span>
            <span>目標 {formatYen(bonus.target_amount)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, bonus.achievement_rate)}%` }} />
            {bonus.target_amount > 0 && (
              <div className="absolute top-0 h-full w-px bg-red-400" style={{ left: `${Math.min(100, (bonus.fixed_cost / bonus.target_amount) * 100)}%` }} />
            )}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 text-center">
            現在: {formatYen(bonus.gross_profit)}（達成率 {bonus.achievement_rate}%）
          </div>
        </div>
      )}

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
