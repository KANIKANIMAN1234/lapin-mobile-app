'use client';

import { useState, useCallback } from 'react';
import type { PageId, ExpenseItem } from '@/types';
import { MOCK_DATA } from '@/lib/constants';
import { useLiff, useSendToGas } from '@/hooks/useLiff';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import LoadingOverlay from '@/components/LoadingOverlay';
import Toast from '@/components/Toast';
import ExpensePage from '@/components/pages/ExpensePage';
import AttendancePage from '@/components/pages/AttendancePage';
import ReportPage from '@/components/pages/ReportPage';
import SitePhotoPage from '@/components/pages/SitePhotoPage';
import HistoryPage from '@/components/pages/HistoryPage';
import SummaryPage from '@/components/pages/SummaryPage';
import NewProjectPage from '@/components/pages/NewProjectPage';

export default function Home() {
  const { userId, userName, isReady, isRetired } = useLiff();
  const sendToGas = useSendToGas();
  const { toast, show: showToast } = useToast();

  const [activePage, setActivePage] = useState<PageId>('input');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('処理中...');
  const [allData, setAllData] = useState<ExpenseItem[]>(MOCK_DATA);

  const showLoading = useCallback((text: string) => {
    setLoadingText(text);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => setLoading(false), []);

  const handleAddExpense = useCallback((item: Omit<ExpenseItem, 'id'>) => {
    setAllData((prev) => [{ ...item, id: prev.length + 1 }, ...prev]);
  }, []);

  const handleToast = useCallback(
    (msg: string, type: 'success' | 'error') => showToast(msg, type),
    [showToast],
  );

  if (isRetired) {
    return (
      <>
        <Header userName={userName} />
        <div className="text-center px-5 py-16">
          <span className="material-icons text-5xl text-red-600">block</span>
          <h3 className="mt-4 mb-2 text-gray-700">アクセスが制限されています</h3>
          <p className="text-gray-500 text-sm">
            このアカウントは退職処理されたため、ご利用いただけません。
            <br />
            管理者にお問い合わせください。
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header userName={userName} />
      <div className="max-w-[500px] mx-auto p-3">
        {activePage === 'input' && (
          <ExpensePage
            userId={userId}
            userName={userName}
            isReady={isReady}
            onShowLoading={showLoading}
            onHideLoading={hideLoading}
            onToast={handleToast}
            sendToGas={sendToGas}
            onAddExpense={handleAddExpense}
          />
        )}

        {activePage === 'attendance' && <AttendancePage onToast={handleToast} />}

        {activePage === 'report' && (
          <ReportPage onShowLoading={showLoading} onHideLoading={hideLoading} onToast={handleToast} />
        )}

        {activePage === 'sitePhoto' && (
          <SitePhotoPage onShowLoading={showLoading} onHideLoading={hideLoading} onToast={handleToast} />
        )}

        {activePage === 'list' && <HistoryPage data={allData} />}

        {activePage === 'summary' && <SummaryPage data={allData} />}

        {activePage === 'newProject' && (
          <NewProjectPage onShowLoading={showLoading} onHideLoading={hideLoading} onToast={handleToast} />
        )}
      </div>

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
      <LoadingOverlay visible={loading} text={loadingText} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </>
  );
}
