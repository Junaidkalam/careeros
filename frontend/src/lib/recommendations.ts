import { fetchApi } from './api';

export interface RecommendationResponse {
  jobId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasonSummary: string | null;
  noResultReason: 'noResume' | 'noSavedJobs' | null;
  resumeFilename: string | null;
  resumeVersionLabel: string | null;
}

export async function listRecommendations(): Promise<RecommendationResponse[]> {
  return fetchApi<RecommendationResponse[]>('/recommendations');
}