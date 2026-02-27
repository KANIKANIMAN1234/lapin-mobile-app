'use client';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

export default function LoadingOverlay({ visible, text = '処理中...' }: LoadingOverlayProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-white/85 z-[2000] flex items-center justify-center flex-col gap-3">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-line-green rounded-full animate-spin" />
      <div className="text-sm text-gray-500">{text}</div>
    </div>
  );
}
