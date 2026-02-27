export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';
export const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

export const CATEGORIES = ['材料費', '交通費', '外注費', '消耗品費', '飲食費', 'その他'];

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

export const WORK_TYPES = ['外壁塗装', '屋根塗装', '水回り（キッチン）', '水回り（浴室）', '水回り（トイレ）', '内装リフォーム', '外構工事', 'その他'];
