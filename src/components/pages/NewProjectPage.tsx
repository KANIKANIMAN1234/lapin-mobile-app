'use client';

import { useState, useCallback } from 'react';
import { WORK_TYPES, SALES_ROUTES, STAFF_OPTIONS } from '@/lib/constants';
import { formatText } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import LineNotifyModal from '@/components/LineNotifyModal';

interface NewProjectPageProps {
  onShowLoading: (text: string) => void;
  onHideLoading: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function NewProjectPage({ onShowLoading, onHideLoading, onToast }: NewProjectPageProps) {
  const [customerName, setCustomerName] = useState('');
  const [zip, setZip] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [route, setRoute] = useState('');
  const [assigned, setAssigned] = useState('');
  const [projectMemo, setProjectMemo] = useState('');
  const [showModal, setShowModal] = useState(false);

  const onDescVoice = useCallback((text: string) => setWorkDesc(text), []);
  const onMemoVoice = useCallback((text: string) => setProjectMemo(text), []);
  const descVoice = useVoiceInput(onDescVoice);
  const memoVoice = useVoiceInput(onMemoVoice);

  const toggleWorkType = (wt: string) => {
    setSelectedWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((t) => t !== wt) : [...prev, wt],
    );
  };

  const handleFormat = (field: 'desc' | 'memo') => {
    const text = field === 'desc' ? workDesc : projectMemo;
    if (!text.trim()) { onToast('整形する文章がありません', 'error'); return; }
    const formatted = formatText(text);
    if (field === 'desc') setWorkDesc(formatted);
    else setProjectMemo(formatted);
    onToast('文章を整形しました', 'success');
  };

  const handleVoiceToggle = (field: 'desc' | 'memo') => {
    const voice = field === 'desc' ? descVoice : memoVoice;
    const text = field === 'desc' ? workDesc : projectMemo;
    const result = voice.toggle(text);
    if (result === 'unsupported') {
      onToast('お使いのブラウザは音声入力に対応していません', 'error');
    }
  };

  const handleSubmit = () => {
    if (!customerName) { onToast('顧客名を入力してください', 'error'); return; }
    if (!address) { onToast('住所を入力してください', 'error'); return; }
    if (!phone) { onToast('電話番号を入力してください', 'error'); return; }
    if (!workDesc) { onToast('工事概要を入力してください', 'error'); return; }
    if (selectedWorkTypes.length === 0) { onToast('工事種別を選択してください', 'error'); return; }
    if (!amount) { onToast('見込み金額を入力してください', 'error'); return; }
    if (!route) { onToast('集客ルートを選択してください', 'error'); return; }
    if (!assigned) { onToast('営業担当者を選択してください', 'error'); return; }
    setShowModal(true);
  };

  const buildNotifyMessage = () => {
    const staff = STAFF_OPTIONS.find((s) => s.value === assigned);
    return `【新規案件登録】\n顧客名: ${customerName}\n住所: ${address}\n電話: ${phone}\n工事概要: ${workDesc}\n工事種別: ${selectedWorkTypes.join('・')}\n見込み金額: ¥${Number(amount).toLocaleString()}\n集客ルート: ${route}\n営業担当: ${staff?.label || ''}\n備考: ${projectMemo || 'なし'}`;
  };

  const handleConfirmNotify = () => {
    setShowModal(false);
    onShowLoading('案件を登録中...');
    setTimeout(() => {
      onHideLoading();
      onToast('案件を登録し、LINE通知を送信しました', 'success');
      resetForm();
    }, 1500);
  };

  const resetForm = () => {
    setCustomerName('');
    setZip('');
    setAddress('');
    setPhone('');
    setEmail('');
    setWorkDesc('');
    setSelectedWorkTypes([]);
    setAmount('');
    setRoute('');
    setAssigned('');
    setProjectMemo('');
  };

  return (
    <>
      <div className="max-w-[500px] mx-auto px-3">
        <div className="form-card">
          <h3>
            <span className="material-icons text-line-green align-middle">note_add</span> 新規案件登録
          </h3>

          {/* 顧客名 */}
          <div className="mb-3.5">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              顧客名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="sp-input"
              placeholder="例: 山本太郎"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* 郵便番号・住所 */}
          <div className="flex gap-2.5 mb-3.5">
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">郵便番号</label>
              <input type="text" className="sp-input" placeholder="123-4567" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                住所 <span className="text-red-500">*</span>
              </label>
              <input type="text" className="sp-input" placeholder="大阪市北区..." value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          {/* 電話・メール */}
          <div className="flex gap-2.5 mb-3.5">
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input type="tel" className="sp-input" placeholder="06-1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">メールアドレス</label>
              <input type="email" className="sp-input" placeholder="sample@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <hr className="my-4 border-none border-t border-gray-200" />

          {/* 工事概要 */}
          <div className="mb-3.5">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              工事概要 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                className="sp-textarea pr-10"
                rows={3}
                placeholder="工事の概要を入力（音声入力可）"
                value={workDesc}
                onChange={(e) => setWorkDesc(e.target.value)}
              />
              <button
                className={`absolute right-2 top-2 w-8 h-8 border-none rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  descVoice.isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'
                }`}
                onClick={() => handleVoiceToggle('desc')}
              >
                <span className="material-icons text-lg">{descVoice.isRecording ? 'stop' : 'mic'}</span>
              </button>
            </div>
            <button
              className="inline-flex items-center gap-1 mt-1.5 px-3.5 py-1.5 border border-gray-300 rounded-full bg-white text-gray-600 text-[0.72rem] font-semibold cursor-pointer active:bg-gray-100"
              onClick={() => handleFormat('desc')}
            >
              <span className="material-icons text-sm text-indigo-500">auto_fix_high</span> 文章を整形する
            </button>
          </div>

          {/* 工事種別 */}
          <div className="mb-3.5">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              工事種別 <span className="text-red-500">*</span>（複数選択可）
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TYPES.map((wt) => (
                <label key={wt} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedWorkTypes.includes(wt)}
                    onChange={() => toggleWorkType(wt)}
                  />
                  <span
                    className={`inline-block px-3.5 py-1.5 text-[0.78rem] font-semibold border-[1.5px] rounded-full transition-colors whitespace-nowrap select-none ${
                      selectedWorkTypes.includes(wt)
                        ? 'bg-line-green text-white border-line-green'
                        : 'text-gray-600 bg-gray-50 border-gray-300'
                    }`}
                  >
                    {wt.replace('水回り（', '').replace('）', '') || wt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 見込み金額 */}
          <div className="mb-3.5">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              見込み金額 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="sp-input"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <hr className="my-4 border-none border-t border-gray-200" />

          {/* 集客ルート */}
          <div className="mb-3.5">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              集客ルート <span className="text-red-500">*</span>
            </label>
            <select className="sp-input" value={route} onChange={(e) => setRoute(e.target.value)}>
              <option value="">選択してください</option>
              {SALES_ROUTES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* 営業担当者 */}
          <div className="mb-3.5">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              営業担当者 <span className="text-red-500">*</span>
            </label>
            <select className="sp-input" value={assigned} onChange={(e) => setAssigned(e.target.value)}>
              <option value="">選択してください</option>
              {STAFF_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* 備考メモ */}
          <div className="mb-3.5">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">備考メモ</label>
            <div className="relative">
              <textarea
                className="sp-textarea pr-10"
                rows={2}
                placeholder="お客様の要望等（音声入力可）"
                value={projectMemo}
                onChange={(e) => setProjectMemo(e.target.value)}
              />
              <button
                className={`absolute right-2 top-2 w-8 h-8 border-none rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  memoVoice.isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'
                }`}
                onClick={() => handleVoiceToggle('memo')}
              >
                <span className="material-icons text-lg">{memoVoice.isRecording ? 'stop' : 'mic'}</span>
              </button>
            </div>
            <button
              className="inline-flex items-center gap-1 mt-1.5 px-3.5 py-1.5 border border-gray-300 rounded-full bg-white text-gray-600 text-[0.72rem] font-semibold cursor-pointer active:bg-gray-100"
              onClick={() => handleFormat('memo')}
            >
              <span className="material-icons text-sm text-indigo-500">auto_fix_high</span> 文章を整形する
            </button>
          </div>

          <button className="btn-line-action mt-4" onClick={handleSubmit}>
            <span className="material-icons text-xl">send</span> 案件を登録して通知する
          </button>
        </div>
      </div>

      {showModal && (
        <LineNotifyModal
          message={buildNotifyMessage()}
          assignedName={STAFF_OPTIONS.find((s) => s.value === assigned)?.label || ''}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmNotify}
        />
      )}
    </>
  );
}
