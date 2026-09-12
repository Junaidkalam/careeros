import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { listApplications, createApplication, ApplicationResponse, MatchResult } from '../lib/applications';
import { listJobs } from '../lib/jobs';
import { listResumes } from '../lib/resumes';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
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
  SAVED:               { label: 'Saved',              color: 'bg-muted text-muted-foreground' },
  APPLIED:             { label: 'Applied',            color: 'bg-blue-100 text-blue-800' },
  APPLICATION_VIEWED:  { label: 'Viewed',             color: 'bg-purple-100 text-purple-800' },
  RECRUITER_CONTACTED: { label: 'Recruiter Contact',  color: 'bg-indigo-100 text-indigo-800' },
  SHORTLISTED:         { label: 'Shortlisted',        color: 'bg-indigo-100 text-indigo-800' },
  ASSESSMENT:          { label: 'Assessment',         color: 'bg-orange-100 text-orange-800' },
  INTERVIEW:           { label: 'Interview',          color: 'bg-yellow-100 text-yellow-800' },
  OFFER:               { label: 'Offer',              color: 'bg-green-100 text-green-800' },
  REJECTED:            { label: 'Rejected',           color: 'bg-red-100 text-red-700' },
  WITHDRAWN:           { label: 'Withdrawn',          color: 'bg-muted text-muted-foreground' },
  POSITION_CLOSED:     { label: 'Closed',             color: 'bg-muted text-muted-foreground' },
  NO_RESPONSE:         { label: 'No Response',        color: 'bg-muted text-muted-foreground' },
};

function scoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 75)    return 'text-green-700';
  if (score >= 50)    return 'text-yellow-700';
  return 'text-red-600';
}

function MatchBreakdown({ result }: { result: MatchResult }) {
  return (
    <div className="mt-4 space-y-4 bg-card border border-border rounded-sm p-4">
      <div className="flex items-center gap-3">
        <span className={`text-3xl font-semibold stat-number ${scoreColor(result.overallScore)}`}>
          {result.overallScore}%
        </span>
        <div>
          <div className="text-[13px] font-medium text-foreground">Match Score</div>
          <div className="text-[12px] text-muted-foreground">{result.experienceAssessment}</div>
        </div>
      </div>

      {result.matchedSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-green-700 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.matchedSkills.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-sm bg-green-50 border border-green-200 text-green-800">{s}</span>
            ))}
          </div>
        </div>
      )}

      {result.missingSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-red-600 mb-1.5">
            <XCircle className="w-3.5 h-3.5" /> Missing
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.missingSkills.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-sm bg-red-50 border border-red-200 text-red-700">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppCard({ app, onClick }: { app: ApplicationResponse; onClick: () => void }) {
  const badge = STATUS_BADGE[app.status] || { label: app.status, color: 'bg-muted text-foreground' };
  
  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-card hover:bg-muted/50 border border-border rounded-sm p-3 transition-colors shadow-sm"
    >
      <div className="text-[13px] font-medium text-foreground leading-tight mb-1">{app.jobTitle}</div>
      <div className="text-[12px] text-muted-foreground mb-3">{app.companyName}</div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${badge.color}`}>
          {badge.label}
        </span>
        {app.matchScore !== null && (
          <span className={`text-[12px] font-semibold stat-number ${scoreColor(app.matchScore)}`}>
            {app.matchScore}%
          </span>
        )}
      </div>
    </button>
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

  const [dialogError, setDialogError] = useState<string | null>(null);

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
    <div className="max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display text-foreground font-normal">Applications</h1>
        <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleCloseDialog(); else openDialog(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openDialog}>
              <Plus className="w-4 h-4" /> Apply to a Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Apply to a Job</DialogTitle>
              <DialogDescription>
                Pick a saved job and resume. We'll run matching instantly.
              </DialogDescription>
            </DialogHeader>

            {!createdApp ? (
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                {(dialogError || createError) && (
                  <div className="text-[13px] text-destructive py-2 px-3 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {dialogError || createError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Job</Label>
                  <Select value={selJobId} onValueChange={setSelJobId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved job..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map(j => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.title} {j.company ? `— ${j.company}` : ''}
                        </SelectItem>
                      ))}
                      {jobs.length === 0 && (
                        <SelectItem value="_none" disabled>No saved jobs yet</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resume</Label>
                  <Select value={selResumeId} onValueChange={setSelResumeId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resume..." />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))}
                      {resumes.length === 0 && (
                        <SelectItem value="_none" disabled>No resumes uploaded yet</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Referral contact, application platform, etc."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                  <Button type="submit" disabled={!selJobId || !selResumeId || isSubmitting}>
                    {isSubmitting ? 'Running match...' : 'Apply & Match'}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="py-2 space-y-4">
                <div className="text-[13px] text-foreground">
                  Application created for <strong>{createdApp.jobTitle}</strong> at <strong>{createdApp.companyName}</strong>.
                </div>
                {matchResult ? (
                  <MatchBreakdown result={matchResult} />
                ) : (
                  <div className="text-[13px] text-muted-foreground italic">
                    Matching could not run (no profile generated for selected resume).
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={handleCloseDialog}>Done</Button>
                  <Button variant="outline" onClick={() => navigate(`/applications/${createdApp.id}`)}>
                    View Details
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {appsError && (
        <div className="mb-4 text-[13px] text-destructive py-2 px-3 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {appsError}
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      ) : appsError ? null : apps.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-md border border-dashed border-border text-muted-foreground">
          No applications yet. Click "Apply to a Job" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {BOARD_COLUMNS.map(col => {
            const colApps = apps.filter(a => (col.key as string[]).includes(a.status));
            return (
              <div key={col.label} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                    {col.label}
                  </span>
                  {colApps.length > 0 && (
                    <span className="text-[11px] text-muted-foreground/60">({colApps.length})</span>
                  )}
                </div>
                <Separator />
                <div className="space-y-2 pt-1">
                  {colApps.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground/40 py-4 text-center">&mdash;</div>
                  ) : colApps.map(app => (
                    <AppCard
                      key={app.id}
                      app={app}
                      onClick={() => navigate(`/applications/${app.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}