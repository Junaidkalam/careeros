import { fetchApi, API_BASE_URL } from './api';

export type SkillCategory = 
  | 'PROGRAMMING_LANGUAGE' | 'FRAMEWORK' | 'LIBRARY' | 'DATABASE' | 'CLOUD' 
  | 'DEVOPS' | 'TESTING' | 'TOOL' | 'CONCEPT' | 'SOFT_SKILL' | 'DOMAIN_SPECIFIC';

export interface CandidateSkill {
  skillName: string;
  category: SkillCategory;
}

export interface CandidateProfile {
  summary: string | null;
  experienceYears: number | null;
  primaryRole: string | null;
  education: string | null;
  skills: CandidateSkill[];
}

export interface ResumeResponse {
  id: string;
  filename: string;
  versionLabel: string | null;
  createdAt: string;
  profileGenerated: boolean;
  warning: string | null;
  candidateProfile: CandidateProfile | null;
}

export interface ResumeProfileUpdateRequest {
  summary: string | null;
  experienceYears: number | null;
  primaryRole: string | null;
  education: string | null;
  skills: CandidateSkill[];
}

export async function uploadResume(file: File, versionLabel?: string): Promise<ResumeResponse> {
  // We use the raw fetch here because fetchApi sets Content-Type: application/json,
  // which must NOT be set for multipart/form-data (the browser sets it with the boundary).
  // We still read the token from the same in-memory source as fetchApi — window.__token.
  const token = window.__token;
  const formData = new FormData();
  formData.append('file', file);
  if (versionLabel) formData.append('versionLabel', versionLabel);

  const res = await fetch(`${API_BASE_URL}/resumes`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      throw new Error(`Upload failed with status ${res.status}`);
    }
    throw errorData; // Typically caught as ApiError in UI if structured properly
  }

  return res.json();
}

export async function listResumes(): Promise<ResumeResponse[]> {
  return fetchApi<ResumeResponse[]>('/resumes');
}

export async function getResume(id: string): Promise<ResumeResponse> {
  return fetchApi<ResumeResponse>(`/resumes/${id}`);
}

export async function updateResumeProfile(id: string, payload: ResumeProfileUpdateRequest): Promise<ResumeResponse> {
  return fetchApi<ResumeResponse>(`/resumes/${id}/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}