import { fetchApi } from './api';

export type ApplicationStatus =
  | 'SAVED' | 'APPLIED' | 'APPLICATION_VIEWED' | 'RECRUITER_CONTACTED'
  | 'SHORTLISTED' | 'ASSESSMENT' | 'INTERVIEW' | 'OFFER'
  | 'REJECTED' | 'WITHDRAWN' | 'POSITION_CLOSED' | 'NO_RESPONSE';

export type EventType =
  | 'JOB_DISCOVERED' | 'JOB_SAVED' | 'RESUME_SELECTED' | 'APPLICATION_SUBMITTED'
  | 'STATUS_CHANGED' | 'RECRUITER_CONTACTED' | 'ASSESSMENT_COMPLETED'
  | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'FOLLOW_UP_SENT'
  | 'OFFER_RECEIVED' | 'REJECTION_RECEIVED' | 'NOTE';

export interface MatchResult {
  overallScore: number;
  matchedSkills: string[];
  partialMatches: string[];
  missingSkills: string[];
  experienceAssessment: string;
}

export interface ApplicationResponse {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  resumeId: string;
  status: ApplicationStatus;
  matchScore: number | null;
  matchResult: MatchResult | null;
  notes: string | null;
  createdAt: string;
}

export interface ApplicationEventResponse {
  id: string;
  eventType: EventType;
  note: string | null;
  createdAt: string;
}

export async function createApplication(
  jobId: string,
  resumeId: string,
  notes?: string
): Promise<ApplicationResponse> {
  return fetchApi<ApplicationResponse>('/applications', {
    method: 'POST',
    body: JSON.stringify({ jobId, resumeId, notes: notes || null }),
  });
}

export async function listApplications(): Promise<ApplicationResponse[]> {
  return fetchApi<ApplicationResponse[]>('/applications');
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  note?: string
): Promise<ApplicationResponse> {
  return fetchApi<ApplicationResponse>(`/applications/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note: note || null }),
  });
}

export async function getApplicationTimeline(id: string): Promise<ApplicationEventResponse[]> {
  return fetchApi<ApplicationEventResponse[]>(`/applications/${id}/timeline`);
}