'use client';

import type { PageId } from '@/types';

interface NavItem {
  id: PageId;
  icon: string;
  label: string;
  className?: string;
  hidden?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'input', icon: 'add_circle', label: '経費' },
  { id: 'attendance', icon: 'schedule', label: '出退勤' },
  { id: 'report', icon: 'description', label: '日報' },
  { id: 'sitePhoto', icon: 'photo_library', label: '現場写真' },
  { id: 'meeting', icon: 'handshake', label: '商談' },
  { id: 'list', icon: 'receipt_long', label: '履歴' },
  { id: 'summary', icon: 'pie_chart', label: '集計' },
  { id: 'adminProject', icon: 'note_add', label: '案件登録', adminOnly: true },
  { id: 'adminNotice', icon: 'campaign', label: '連絡投稿', adminOnly: true },
  { id: 'newProject', icon: 'note_add', label: '新規登録', className: 'text-blue-500', hidden: true },
];

interface BottomNavProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  showNewProject?: boolean;
  userRole?: string;
}

export default function BottomNav({ activePage, onNavigate, showNewProject, userRole }: BottomNavProps) {
  const isAdmin = userRole === 'admin';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.hidden && !showNewProject) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const perRow = Math.ceil(visibleItems.length / 2);
  const row1 = visibleItems.slice(0, perRow);
  const row2 = visibleItems.slice(perRow);

  const renderItem = (item: NavItem) => {
    const isActive = activePage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`flex flex-col items-center gap-[2px] text-[0.65rem] font-semibold py-1.5 px-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer flex-1 min-w-0 ${
          isActive ? 'text-line-green' : item.className || 'text-gray-400'
        }`}
      >
        <span className="material-icons" style={{ fontSize: 22 }}>{item.icon}</span>
        <span className="truncate w-full text-center">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] z-50 max-w-[500px] mx-auto">
      <div className="flex justify-around items-center border-b border-gray-100">
        {row1.map(renderItem)}
      </div>
      <div className="flex justify-around items-center">
        {row2.map(renderItem)}
      </div>
    </nav>
  );
}
