'use client';

interface LineNotifyModalProps {
  message: string;
  assignedName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LineNotifyModal({ message, assignedName, onClose, onConfirm }: LineNotifyModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[440px] max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center gap-2 px-4 py-4 font-bold text-[0.95rem] border-b border-gray-200">
          <span className="material-icons text-line-green">chat</span>
          <span>LINE通知プレビュー</span>
          <button className="ml-auto border-none bg-transparent cursor-pointer text-gray-400" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* ボディ */}
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3">以下の内容が営業担当者と社長のLINEに送信されます。</p>
          <div className="flex gap-2 flex-wrap mb-3.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-2xl text-[0.75rem] font-semibold bg-blue-100 text-blue-800">
              <span className="material-icons text-sm">person</span>
              {assignedName}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-2xl text-[0.75rem] font-semibold bg-amber-100 text-amber-800">
              <span className="material-icons text-sm">person</span>
              社長
            </span>
          </div>
          <div className="bg-line-green-light rounded-[0_16px_16px_16px] p-3.5 text-[0.82rem] leading-relaxed text-gray-800 relative ml-2">
            <div
              className="absolute top-0 -left-2 w-0 h-0"
              style={{
                borderTop: '8px solid #e6f9ee',
                borderLeft: '8px solid transparent',
              }}
            />
            {message.split('\n').map((line, i) => (
              <div key={i}>
                {line.startsWith('【') ? <strong className="text-line-green-dark">{line}</strong> : line}
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="px-4 py-3 border-t border-gray-200 flex gap-2.5 justify-end">
          <button
            className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white font-semibold text-sm cursor-pointer"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button className="btn-line-action !w-auto !mt-0 px-5 py-2.5" onClick={onConfirm}>
            <span className="material-icons text-xl">send</span> 送信する
          </button>
        </div>
      </div>
    </div>
  );
}
