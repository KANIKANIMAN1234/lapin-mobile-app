'use client';

import type { ToastType } from '@/hooks/useToast';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
}

const bgMap: Record<ToastType, string> = {
  success: 'bg-line-green',
  error: 'bg-red-500',
  info: 'bg-gray-800',
};

export default function Toast({ message, type, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-2.5 ${bgMap[type]} text-white rounded-lg text-sm z-[3000] whitespace-nowrap max-w-[90%] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}
