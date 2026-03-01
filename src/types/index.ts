export interface ExpenseItem {
  id: number;
  project: string;
  projectName: string;
  amount: number;
  category: string;
  memo: string;
  date: string;
  userName: string;
  imageUrls: string[];
}

export interface ProjectOption {
  value: string;
  label: string;
  workTypes: string[];
}

export interface ProjectMaster {
  name: string;
  orderAmount: number;
  plannedCostRate: number;
  scheduledPayments: number;
}

export interface StaffOption {
  value: string;
  label: string;
}

export interface AICandidate {
  project: string;
  name: string;
  confidence: number;
  reason: string;
}

export interface AttendanceLog {
  type: 'in' | 'out' | 'break_start' | 'break_end';
  time: string;
}

export type PageId =
  | 'input'
  | 'attendance'
  | 'report'
  | 'sitePhoto'
  | 'list'
  | 'summary'
  | 'newProject'
  | 'meeting'
  | 'adminProject'
  | 'adminNotice';
