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

export async function listJobs(): Promise<JobResponse[]> {
  return fetchApi<JobResponse[]>('/jobs');
}