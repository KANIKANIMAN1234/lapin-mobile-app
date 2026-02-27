'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PageId, ExpenseItem, ProjectOption, StaffOption } from '@/types';
import { useLiff, useSendToGas } from '@/hooks/useLiff';
import { useToast } from '@/hooks/useToast';
import { callGasGet, isGasConfigured } from '@/lib/gas';
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

function mapGasExpense(e: Record<string, unknown>): ExpenseItem {
  return {
    id: Number(e.id) || 0,
    project: String(e.project_id || ''),
    projectName: String(e.project_number || e.project_id || ''),
    amount: Number(e.amount) || 0,
    category: String(e.category || ''),
    memo: String(e.description || ''),
    date: String(e.expense_date || '').substring(0, 10),
    userName: String(e.user_name || ''),
    imageUrls: e.receipt_image_url ? [String(e.receipt_image_url)] : [],
  };
}

function mapGasProject(p: Record<string, unknown>): ProjectOption {
  const workType = String(p.work_type || '');
  return {
    value: String(p.id),
    label: `${p.project_number} ${p.customer_name} - ${workType.split(',')[0] || ''}`.trim(),
    workTypes: workType.split(',').map((t: string) => t.trim()).filter(Boolean),
  };
}

export default function Home() {
  const { userId, userName, isReady, isRetired } = useLiff();
  const sendToGas = useSendToGas();
  const { toast, show: showToast } = useToast();

  const [activePage, setActivePage] = useState<PageId>('input');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('処理中...');

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!isReady || !isGasConfigured()) {
      setDataLoaded(true);
      return;
    }
    let cancelled = false;

    async function loadData() {
      try {
        const [projRes, expRes] = await Promise.all([
          callGasGet('getProjects', { limit: '200' }),
          callGasGet('getExpenses', { limit: '200' }),
        ]);
        if (cancelled) return;

        if (projRes?.success && projRes.data?.projects) {
          setProjects(projRes.data.projects.map(mapGasProject));
        }
        if (expRes?.success && expRes.data?.expenses) {
          setExpenses(expRes.data.expenses.map(mapGasExpense));
        }
      } catch (err) {
        console.error('データ読み込みエラー:', err);
      }
      if (!cancelled) setDataLoaded(true);
    }

    loadData();
    return () => { cancelled = true; };
  }, [isReady]);

  const showLoading = useCallback((text: string) => {
    setLoadingText(text);
    setLoading(true);
  }, []);
  const hideLoading = useCallback(() => setLoading(false), []);
  const handleToast = useCallback(
    (msg: string, type: 'success' | 'error') => showToast(msg, type),
    [showToast],
  );

  const handleAddExpense = useCallback((item: Omit<ExpenseItem, 'id'>) => {
    setExpenses((prev) => [{ ...item, id: Date.now() }, ...prev]);
  }, []);

  const reloadExpenses = useCallback(async () => {
    if (!isGasConfigured()) return;
    try {
      const res = await callGasGet('getExpenses', { limit: '200' });
      if (res?.success && res.data?.expenses) {
        setExpenses(res.data.expenses.map(mapGasExpense));
      }
    } catch (err) {
      console.error('経費再読み込みエラー:', err);
    }
  }, []);

  if (isRetired) {
    return (
      <>
        <Header userName={userName} />
        <div className="text-center px-5 py-16">
          <span className="material-icons text-5xl text-red-600">block</span>
          <h3 className="mt-4 mb-2 text-gray-700">アクセスが制限されています</h3>
          <p className="text-gray-500 text-sm">
            このアカウントは退職処理されたため、ご利用いただけません。
            <br />管理者にお問い合わせください。
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
            projects={projects}
            onShowLoading={showLoading}
            onHideLoading={hideLoading}
            onToast={handleToast}
            sendToGas={sendToGas}
            onAddExpense={handleAddExpense}
          />
        )}

        {activePage === 'attendance' && (
          <AttendancePage
            sendToGas={sendToGas}
            onToast={handleToast}
          />
        )}

        {activePage === 'report' && (
          <ReportPage
            projects={projects}
            sendToGas={sendToGas}
            onShowLoading={showLoading}
            onHideLoading={hideLoading}
            onToast={handleToast}
          />
        )}

        {activePage === 'sitePhoto' && (
          <SitePhotoPage
            projects={projects}
            sendToGas={sendToGas}
            onShowLoading={showLoading}
            onHideLoading={hideLoading}
            onToast={handleToast}
          />
        )}

        {activePage === 'list' && (
          <HistoryPage data={expenses} projects={projects} onRefresh={reloadExpenses} />
        )}

        {activePage === 'summary' && (
          <SummaryPage data={expenses} projects={projects} />
        )}

        {activePage === 'newProject' && (
          <NewProjectPage
            sendToGas={sendToGas}
            onShowLoading={showLoading}
            onHideLoading={hideLoading}
            onToast={handleToast}
          />
        )}
      </div>

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
      <LoadingOverlay visible={loading} text={loadingText} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </>
  );
}
