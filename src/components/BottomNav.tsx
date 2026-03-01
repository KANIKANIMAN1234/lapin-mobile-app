'use client';

import type { PageId } from '@/types';

interface NavItem {
  id: PageId;
  icon: string;
  label: string;
  className?: string;
  hidden?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'input', icon: 'add_circle', label: '経費' },
  { id: 'attendance', icon: 'schedule', label: '出退勤' },
  { id: 'report', icon: 'description', label: '日報' },
  { id: 'sitePhoto', icon: 'photo_library', label: '現場写真' },
  { id: 'meeting', icon: 'handshake', label: '商談' },
  { id: 'list', icon: 'receipt_long', label: '履歴' },
  { id: 'summary', icon: 'pie_chart', label: '集計' },
  { id: 'newProject', icon: 'note_add', label: '新規登録', className: 'text-blue-500', hidden: true },
];

interface BottomNavProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  showNewProject?: boolean;
}

export default function BottomNav({ activePage, onNavigate, showNewProject }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex justify-around items-center z-50 max-w-[500px] mx-auto">
      {NAV_ITEMS.map((item) => {
        if (item.hidden && !showNewProject) return null;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-[1px] text-[0.55rem] font-semibold p-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${
              isActive ? 'text-line-green' : item.className || 'text-gray-400'
            }`}
          >
            <span className="material-icons text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
