import { fetchApi } from './api';

export interface JobRequest {
  title: string;
  companyName: string;
  postingUrl?: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  postedDate?: string;
  salaryRange?: string;
}

export interface JobResponse extends JobRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobExtractionResponse {
  draft: JobRequest;
  extractedFromJsonLd: boolean;
  warning?: string;
}

export async function importJob(url: string): Promise<JobExtractionResponse> {
  return fetchApi<JobExtractionResponse>('/jobs/import', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function createJob(request: JobRequest): Promise<JobResponse> {
  return fetchApi<JobResponse>('/jobs', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export interface JobFilters {
  search?: string;
  workMode?: string;
  employmentType?: string;
  minMatchScore?: number;
}

export async function listJobs(filters?: JobFilters): Promise<JobResponse[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.workMode && filters.workMode !== 'Any') params.append('workMode', filters.workMode);
  if (filters?.employmentType && filters.employmentType !== 'Any') params.append('employmentType', filters.employmentType);
  if (filters?.minMatchScore !== undefined && filters.minMatchScore > 0) params.append('minMatchScore', filters.minMatchScore.toString());
  
  const query = params.toString();
  return fetchApi<JobResponse[]>(`/jobs${query ? `?${query}` : ''}`);
}

export interface JobDiscoveryResponse {
  draft: JobRequest | null;
  matchScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  reasonSummary: string;
  source: string;
  noResultReason: string | null;
  warning: string | null;
}

export async function discoverJobs(): Promise<JobDiscoveryResponse[]> {
  return fetchApi<JobDiscoveryResponse[]>('/jobs/discover');
}