'use client';

import { useState, useEffect, useCallback } from 'react';
import { WORK_TYPES, SALES_ROUTES } from '@/lib/constants';
import { todayStr } from '@/lib/utils';
import { callGasGet, isGasConfigured } from '@/lib/gas';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface AdminProjectPageProps {
  sendToGas: (action: string, data: Record<string, unknown>) => Promise<unknown>;
  onShowLoading: (text: string) => void;
  onHideLoading: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AdminProjectPage({ sendToGas, onShowLoading, onHideLoading, onToast }: AdminProjectPageProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerNameKana, setCustomerNameKana] = useState('');
  const [zip, setZip] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [route, setRoute] = useState('');
  const [inquiryDate, setInquiryDate] = useState(todayStr());
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const onDescVoice = useCallback((text: string) => setWorkDesc(text), []);
  const descVoice = useVoiceInput(onDescVoice);

  useEffect(() => {
    if (!isGasConfigured()) return;
    callGasGet('getEmployees').then((res) => {
      if (res?.success && res.data?.employees) {
        setEmployees(
          res.data.employees
            .filter((e: Employee & { status?: string }) => e.status !== 'retired')
        );
      }
    });
  }, []);

  const toggleWorkType = (wt: string) => {
    setSelectedWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((t) => t !== wt) : [...prev, wt],
    );
  };

  const handleSubmit = async () => {
    if (!customerName) { onToast('顧客名を入力してください', 'error'); return; }
    if (!address) { onToast('住所を入力してください', 'error'); return; }
    if (!phone) { onToast('電話番号を入力してください', 'error'); return; }
    if (selectedWorkTypes.length === 0) { onToast('工事種別を選択してください', 'error'); return; }
    if (!amount) { onToast('見込み金額を入力してください', 'error'); return; }
    if (!route) { onToast('取得経路を選択してください', 'error'); return; }

    setSubmitting(true);
    onShowLoading('案件を登録中...');

    try {
      await sendToGas('createProject', {
        customer_name: customerName,
        customer_name_kana: customerNameKana,
        postal_code: zip,
        address,
        phone,
        email,
        work_description: workDesc || selectedWorkTypes.join(','),
        work_type: selectedWorkTypes.join(','),
        estimated_amount: Number(amount),
        acquisition_route: route,
        inquiry_date: inquiryDate,
        assigned_to: assignedTo || undefined,
        notes,
      });

      onHideLoading();
      onToast('案件を登録しました。担当者にLINE通知を送信しました。', 'success');
      resetForm();
    } catch (err) {
      onHideLoading();
      onToast(err instanceof Error ? err.message : '案件登録に失敗しました', 'error');
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerNameKana('');
    setZip('');
    setAddress('');
    setPhone('');
    setEmail('');
    setWorkDesc('');
    setSelectedWorkTypes([]);
    setAmount('');
    setRoute('');
    setInquiryDate(todayStr());
    setAssignedTo('');
    setNotes('');
  };

  return (
    <div className="max-w-[500px] mx-auto px-3 pb-28">
      <div className="form-card">
        <h3 className="flex items-center gap-1.5">
          <span className="material-icons text-line-green align-middle">note_add</span>
          案件登録
          <span className="ml-auto px-2 py-0.5 text-[10px] bg-red-50 text-red-600 rounded font-bold">管理者</span>
        </h3>

        {/* 顧客情報 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-[0.72rem] font-bold text-gray-500 mb-2 flex items-center gap-1">
            <span className="material-icons text-sm">person</span> 顧客情報
          </p>

          <div className="mb-3">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              顧客名 <span className="text-red-500">*</span>
            </label>
            <input type="text" className="sp-input" placeholder="例: 山田太郎" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">顧客名（カナ）</label>
            <input type="text" className="sp-input" placeholder="例: ヤマダタロウ" value={customerNameKana} onChange={(e) => setCustomerNameKana(e.target.value)} />
          </div>

          <div className="flex gap-2 mb-3">
            <div className="w-1/3">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">郵便番号</label>
              <input type="text" className="sp-input" placeholder="530-0001" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                住所 <span className="text-red-500">*</span>
              </label>
              <input type="text" className="sp-input" placeholder="大阪府大阪市北区..." value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 mb-1">
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <input type="tel" className="sp-input" placeholder="06-1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">メール</label>
              <input type="email" className="sp-input" placeholder="sample@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 案件情報 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-[0.72rem] font-bold text-gray-500 mb-2 flex items-center gap-1">
            <span className="material-icons text-sm">assignment</span> 案件情報
          </p>

          <div className="mb-3">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              工事種別 <span className="text-red-500">*</span>（複数選択可）
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WORK_TYPES.map((wt) => (
                <label key={wt} className="flex items-center cursor-pointer">
                  <input type="checkbox" className="hidden" checked={selectedWorkTypes.includes(wt)} onChange={() => toggleWorkType(wt)} />
                  <span className={`inline-block px-3 py-1.5 text-[0.72rem] font-semibold border-[1.5px] rounded-full transition-colors whitespace-nowrap select-none ${
                    selectedWorkTypes.includes(wt)
                      ? 'bg-line-green text-white border-line-green'
                      : 'text-gray-600 bg-white border-gray-300'
                  }`}>
                    {wt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">工事内容</label>
            <div className="relative">
              <textarea className="sp-textarea pr-10" rows={2} placeholder="工事の概要を入力（音声入力可）" value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} />
              <button
                type="button"
                className={`absolute right-2 top-2 w-8 h-8 border-none rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  descVoice.isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'
                }`}
                onClick={() => {
                  const r = descVoice.toggle(workDesc);
                  if (r === 'unsupported') onToast('音声入力非対応', 'error');
                }}
              >
                <span className="material-icons text-lg">{descVoice.isRecording ? 'stop' : 'mic'}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                見込み金額（円） <span className="text-red-500">*</span>
              </label>
              <input type="number" className="sp-input" placeholder="1500000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                問い合わせ日 <span className="text-red-500">*</span>
              </label>
              <input type="date" className="sp-input" value={inquiryDate} onChange={(e) => setInquiryDate(e.target.value)} />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
              取得経路 <span className="text-red-500">*</span>
            </label>
            <select className="sp-input" value={route} onChange={(e) => setRoute(e.target.value)}>
              <option value="">選択してください</option>
              {SALES_ROUTES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 担当者割り当て */}
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-[0.72rem] font-bold text-blue-600 mb-2 flex items-center gap-1">
            <span className="material-icons text-sm">person_add</span> 担当者割り当て
          </p>
          <select className="sp-input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">自分が担当</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}（{emp.role === 'admin' ? '管理者' : emp.role === 'sales' ? '営業' : emp.role}）</option>
            ))}
          </select>
          <p className="text-[0.65rem] text-blue-500 mt-1.5">
            ※ 登録すると担当者にLINE通知が送信されます
          </p>
        </div>

        {/* 備考 */}
        <div className="mb-3">
          <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">備考</label>
          <textarea className="sp-textarea" rows={2} placeholder="その他メモ" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button className="btn-line-action mt-2" onClick={handleSubmit} disabled={submitting}>
          <span className="material-icons text-xl">send</span>
          {submitting ? '登録中...' : '案件を登録する'}
        </button>
      </div>
    </div>
  );
}
