import { fetchApi } from './api';

export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
  rejected: number;
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  interviewRate: number | null;
  offerRate: number | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>('/analytics/dashboard');
}