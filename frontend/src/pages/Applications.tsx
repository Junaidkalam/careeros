import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2, XCircle, AlertTriangle, Building2, FileText, ChevronRight } from 'lucide-react';
import { listApplications, createApplication, ApplicationResponse, MatchResult } from '../lib/applications';
import { listJobs } from '../lib/jobs';
import { listResumes } from '../lib/resumes';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const BOARD_COLUMNS = [
  { label: 'Saved',      key: ['SAVED'] },
  { label: 'Applied',    key: ['APPLIED'] },
  { label: 'In Progress',key: ['APPLICATION_VIEWED', 'RECRUITER_CONTACTED', 'SHORTLISTED', 'ASSESSMENT'] },
  { label: 'Interview',  key: ['INTERVIEW'] },
  { label: 'Offer',      key: ['OFFER'] },
  { label: 'Closed',     key: ['REJECTED', 'WITHDRAWN', 'POSITION_CLOSED', 'NO_RESPONSE'] },
];

const STATUS_BADGE: Record<string, { label: string, color: string }> = {
  SAVED:               { label: 'Saved',              color: 'bg-secondary text-secondary-foreground border-transparent' },
  APPLIED:             { label: 'Applied',            color: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400' },
  APPLICATION_VIEWED:  { label: 'Viewed',             color: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400' },
  RECRUITER_CONTACTED: { label: 'Contacted',          color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400' },
  SHORTLISTED:         { label: 'Shortlisted',        color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400' },
  ASSESSMENT:          { label: 'Assessment',         color: 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400' },
  INTERVIEW:           { label: 'Interview',          color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400' },
  OFFER:               { label: 'Offer',              color: 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400' },
  REJECTED:            { label: 'Rejected',           color: 'bg-destructive/10 text-destructive border-destructive/20' },
  WITHDRAWN:           { label: 'Withdrawn',          color: 'bg-secondary text-secondary-foreground border-transparent' },
  POSITION_CLOSED:     { label: 'Closed',             color: 'bg-secondary text-secondary-foreground border-transparent' },
  NO_RESPONSE:         { label: 'No Response',        color: 'bg-secondary text-secondary-foreground border-transparent' },
};

function scoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 75)    return 'text-green-600 dark:text-green-500';
  if (score >= 50)    return 'text-yellow-600 dark:text-yellow-500';
  return 'text-destructive';
}

function MatchBreakdown({ result }: { result: MatchResult }) {
  return (
    <div className="mt-5 space-y-4 bg-secondary/30 border border-border/60 rounded-xl p-5">
      <div className="flex items-center gap-4 border-b border-border/50 pb-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-background border shadow-sm">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-secondary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className={scoreColor(result.overallScore)}
              strokeDasharray={`${result.overallScore}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className={`text-xl font-semibold stat-number ${scoreColor(result.overallScore)}`}>
            {result.overallScore}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground tracking-tight">Match Score</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{result.experienceAssessment}</div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {result.matchedSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-green-600 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Matched
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.matchedSkills.map(s => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400 font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {result.missingSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-destructive mb-2">
              <XCircle className="w-3.5 h-3.5" /> Missing
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.missingSkills.map(s => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppCard({ app, onClick }: { app: ApplicationResponse; onClick: () => void }) {
  const badge = STATUS_BADGE[app.status] || { label: app.status, color: 'bg-secondary text-foreground border-transparent' };
  
  return (
    <Card 
      onClick={onClick}
      className="p-4 cursor-pointer glass-panel border border-border/40 hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-3 gap-2">
        <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border-0 ${badge.color}`}>
          {badge.label}
        </Badge>
        {app.matchScore !== null && (
          <div className="flex items-center gap-1.5" title="AI Match Score">
            <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-secondary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className={scoreColor(app.matchScore)}
                strokeDasharray={`${app.matchScore}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <span className={`text-[11px] font-bold stat-number ${scoreColor(app.matchScore)}`}>
              {app.matchScore}
            </span>
          </div>
        )}
      </div>
      
      <div className="text-[14px] font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {app.jobTitle}
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-medium truncate">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary shadow-sm">
            {app.companyName.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{app.companyName}</span>
        </div>
        <div className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-widest stat-number">
          {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </Card>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<{id: string, title: string, company: string}[]>([]);
  const [resumes, setResumes] = useState<{id: string, label: string}[]>([]);
  
  const [selJobId, setSelJobId] = useState('');
  const [selResumeId, setSelResumeId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdApp, setCreatedApp] = useState<ApplicationResponse | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const [appsError, setAppsError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const fetchApps = () => {
    setIsLoading(true);
    setAppsError(null);
    listApplications()
      .then(setApps)
      .catch((err: any) => {
        console.error('fetchApps error:', err);
        setAppsError(err?.detail || err?.error || err?.message || 'Failed to load applications');
      })
      .finally(() => setIsLoading(false));
  };
  useEffect(() => { fetchApps(); }, []);

  const openDialog = async () => {
    setIsOpen(true);
    setMatchResult(null);
    setCreatedApp(null);
    setCreateError(null);
    setDialogError(null);
    setSelJobId('');
    setSelResumeId('');
    setNotes('');
    try {
      const [j, r] = await Promise.all([listJobs(), listResumes()]);
      setJobs(j.map(x => ({ id: x.id, title: x.title, company: x.companyName || '' })));
      setResumes(r.map(x => ({ id: x.id, label: x.versionLabel ? `${x.filename} (${x.versionLabel})` : x.filename })));
    } catch (err: any) {
      console.error('openDialog load error:', err);
      setDialogError(err?.detail || err?.error || err?.message || 'Failed to load jobs or resumes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selJobId || !selResumeId) return;
    setIsSubmitting(true);
    setCreateError(null);
    try {
      const result = await createApplication(selJobId, selResumeId, notes || undefined);
      setCreatedApp(result);
      setMatchResult(result.matchResult);
      fetchApps();
    } catch (err: any) {
      setCreateError(err.detail || err.error || 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setMatchResult(null);
    setCreatedApp(null);
  };

  return (
    <div className="h-full flex flex-col min-h-0 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your job applications through the pipeline.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleCloseDialog(); else openDialog(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Apply to a Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Apply to a Job</DialogTitle>
              <DialogDescription>
                Select a saved job and your resume to automatically generate a compatibility match score.
              </DialogDescription>
            </DialogHeader>

            {!createdApp ? (
              <form onSubmit={handleSubmit} className="space-y-5 py-2">
                {(dialogError || createError) && (
                  <div className="text-sm text-destructive py-2 px-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {dialogError || createError}
                  </div>
                )}
                
                <div className="space-y-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="space-y-2">
                    <Label className="font-semibold">Target Job</Label>
                    <Select value={selJobId} onValueChange={setSelJobId} required>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a saved job..." />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map(j => (
                          <SelectItem key={j.id} value={j.id}>
                            <span className="font-medium">{j.title}</span> {j.company ? <span className="text-muted-foreground ml-1">at {j.company}</span> : ''}
                          </SelectItem>
                        ))}
                        {jobs.length === 0 && (
                          <SelectItem value="_none" disabled>No saved jobs yet</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Your Resume</Label>
                    <Select value={selResumeId} onValueChange={setSelResumeId} required>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a resume..." />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              {r.label}
                            </div>
                          </SelectItem>
                        ))}
                        {resumes.length === 0 && (
                          <SelectItem value="_none" disabled>No resumes uploaded yet</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    placeholder="Referral contact, application platform, etc."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <DialogFooter className="pt-4 border-t border-border mt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                  <Button type="submit" disabled={!selJobId || !selResumeId || isSubmitting}>
                    {isSubmitting ? 'Running match...' : 'Apply & Match'}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="py-2 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-900/50">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-1">
                    <CheckCircle2 className="w-4 h-4" /> Application Created
                  </div>
                  <div className="text-sm text-green-800/80 dark:text-green-300/80">
                    You applied for <strong className="text-green-900 dark:text-green-200">{createdApp.jobTitle}</strong> at <strong className="text-green-900 dark:text-green-200">{createdApp.companyName}</strong>.
                  </div>
                </div>

                {matchResult ? (
                  <MatchBreakdown result={matchResult} />
                ) : (
                  <div className="p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    Matching could not run (no profile generated for selected resume).
                  </div>
                )}
                
                <DialogFooter className="pt-4 mt-4">
                  <Button variant="outline" onClick={handleCloseDialog}>Close</Button>
                  <Button className="gap-1.5" onClick={() => navigate(`/applications/${createdApp.id}`)}>
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {appsError && (
        <div className="mb-4 text-sm text-destructive py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {appsError}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-32 flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">Loading board...</span>
          </div>
        </div>
      ) : appsError ? null : apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card/50 border border-dashed rounded-xl flex-1">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No applications yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Start tracking your job search by applying to a saved job with your resume.
          </p>
          <Button onClick={openDialog} className="gap-2">
            <Plus className="w-4 h-4" /> Apply to a Job
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 min-w-max h-full">
            {BOARD_COLUMNS.map(col => {
              const colApps = apps.filter(a => (col.key as string[]).includes(a.status));
              return (
                <div key={col.label} className="w-[300px] flex-shrink-0 flex flex-col bg-secondary/10 rounded-xl border border-border/40 overflow-hidden relative">
                  <div className="p-3 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between shadow-sm">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      {col.label}
                    </span>
                    <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground text-[10px] font-bold px-1.5 py-0">
                      {colApps.length}
                    </Badge>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                    {colApps.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground/30 mb-2" />
                        <span className="text-xs font-medium text-muted-foreground">Empty</span>
                      </div>
                    ) : (
                      colApps.map(app => (
                        <AppCard key={app.id} app={app} onClick={() => navigate(`/applications/${app.id}`)} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}