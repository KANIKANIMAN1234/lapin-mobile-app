import type { ExpenseItem, ProjectMaster } from '@/types';

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';
export const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

export const CATEGORIES = ['材料費', '交通費', '外注費', '消耗品費', '飲食費', 'その他'];

export const PROJECT_MASTER: Record<string, ProjectMaster> = {
  '2026-001': { name: '山本太郎様', orderAmount: 1800000, plannedCostRate: 55, scheduledPayments: 320000 },
  '2026-002': { name: '佐藤花子様', orderAmount: 2500000, plannedCostRate: 50, scheduledPayments: 580000 },
  '2026-003': { name: '田中一郎様', orderAmount: 1200000, plannedCostRate: 48, scheduledPayments: 150000 },
  '2026-005': { name: '高橋三郎様', orderAmount: 2200000, plannedCostRate: 52, scheduledPayments: 450000 },
  general: { name: '共通経費', orderAmount: 0, plannedCostRate: 0, scheduledPayments: 0 },
};

export const PROJECT_OPTIONS = [
  { value: '2026-001', label: '2026-001 山本太郎様 - 外壁塗装', workTypes: ['外壁塗装', '屋根塗装'] },
  { value: '2026-002', label: '2026-002 佐藤花子様 - キッチン', workTypes: ['キッチンリフォーム'] },
  { value: '2026-003', label: '2026-003 田中一郎様 - 屋根塗装', workTypes: ['屋根塗装'] },
  { value: '2026-005', label: '2026-005 高橋三郎様 - 外壁塗装', workTypes: ['外壁塗装'] },
];

export const PHOTO_CATEGORIES = [
  { value: 'before', label: '契約前' },
  { value: 'inspection', label: '現調' },
  { value: 'pre_construction', label: '施工前' },
  { value: 'undercoat', label: '下地' },
  { value: 'during', label: '施工中' },
  { value: 'after', label: '施工後' },
  { value: 'completed', label: '完工' },
  { value: 'other', label: 'その他' },
];

export const SALES_ROUTES = ['チラシ', 'Web自然流入', 'Web広告', '新聞', '紹介', 'イベント', 'OB施策', 'LINE'];

export const STAFF_OPTIONS = [
  { value: 'yamada', label: '山田太郎' },
  { value: 'sato', label: '佐藤花子' },
  { value: 'suzuki', label: '鈴木一郎' },
  { value: 'takahashi', label: '高橋次郎' },
];

export const WORK_TYPES = ['外壁塗装', '屋根塗装', '水回り（キッチン）', '水回り（浴室）', '水回り（トイレ）', '内装リフォーム', '外構工事', 'その他'];

export const MOCK_DATA: ExpenseItem[] = [
  { id: 1, project: '2026-001', projectName: '山本太郎様', amount: 12500, category: '材料費', memo: '塗料・ローラー', date: '2026-02-25', userName: '山田太郎', imageUrls: [] },
  { id: 2, project: '2026-005', projectName: '高橋三郎様', amount: 8900, category: '材料費', memo: 'マスキングテープ・養生', date: '2026-02-24', userName: '山田太郎', imageUrls: [] },
  { id: 3, project: '2026-001', projectName: '山本太郎様', amount: 3200, category: '交通費', memo: '現場往復 ガソリン代', date: '2026-02-23', userName: '山田太郎', imageUrls: [] },
  { id: 4, project: '2026-003', projectName: '田中一郎様', amount: 1500, category: '飲食費', memo: '現場確認時 昼食', date: '2026-02-22', userName: '鈴木一郎', imageUrls: [] },
  { id: 5, project: '2026-002', projectName: '佐藤花子様', amount: 45000, category: '外注費', memo: '設備業者 水道工事', date: '2026-02-20', userName: '佐藤花子', imageUrls: [] },
  { id: 6, project: '2026-005', projectName: '高橋三郎様', amount: 15800, category: '材料費', memo: '塗料（パーフェクトトップ）', date: '2026-02-19', userName: '山田太郎', imageUrls: [] },
  { id: 7, project: '2026-001', projectName: '山本太郎様', amount: 5600, category: '消耗品費', memo: 'ブラシ・ヤスリ・手袋', date: '2026-02-18', userName: '山田太郎', imageUrls: [] },
  { id: 8, project: 'general', projectName: '共通経費', amount: 2800, category: '交通費', memo: '倉庫往復', date: '2026-02-17', userName: '高橋三郎', imageUrls: [] },
];
