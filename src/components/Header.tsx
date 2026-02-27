'use client';

interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  return (
    <header className="bg-white border-b-2 border-line-green px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="material-icons text-line-green text-[28px]">business</span>
        <div>
          <div className="text-[0.95rem] font-bold leading-tight">ラパンリフォーム Mobile</div>
          <div className="text-[0.65rem] text-line-green font-medium">LINE公式アカウント連携</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <span>{userName || '認証中...'}</span>
        <div className="w-7 h-7 rounded-full bg-line-green-light flex items-center justify-center">
          <span className="material-icons text-line-green text-lg">person</span>
        </div>
      </div>
    </header>
  );
}
