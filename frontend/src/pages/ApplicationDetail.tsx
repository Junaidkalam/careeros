import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getApplication, updateApplicationStatus, getApplicationTimeline, updateFollowUpDate,
  ApplicationResponse, ApplicationEventResponse, ApplicationStatus, MatchResult
} from '../lib/applications';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { ArrowLeft, CheckCircle2, XCircle, Minus, Clock, Building2, Calendar, ExternalLink } from 'lucide-react';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'SAVED', 'APPLIED', 'APPLICATION_VIEWED', 'RECRUITER_CONTACTED',
  'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'OFFER',
  'REJECTED', 'WITHDRAWN', 'POSITION_CLOSED', 'NO_RESPONSE',
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  APPLICATION_VIEWED: 'Application Viewed',
  RECRUITER_CONTACTED: 'Recruiter Contacted',
  SHORTLISTED: 'Shortlisted',
  ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  POSITION_CLOSED: 'Position Closed',
  NO_RESPONSE: 'No Response',
};

function scoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 75)    return 'text-green-600 dark:text-green-500';
  if (score >= 50)    return 'text-yellow-600 dark:text-yellow-500';
  return 'text-destructive';
}

function MatchPanel({ result }: { result: MatchResult }) {
  const total = result.matchedSkills.length + result.missingSkills.length + (result.partialMatches?.length || 0);
  const matchPct = total > 0 ? (result.matchedSkills.length / total) * 100 : 0;
  const missingPct = total > 0 ? (result.missingSkills.length / total) * 100 : 0;
  const partialPct = total > 0 ? ((result.partialMatches?.length || 0) / total) * 100 : 0;

  return (
    <div className="space-y-8">
      {result.experienceAssessment && (
        <div className="p-5 bg-secondary/20 rounded-xl border border-border/40 premium-shadow">
          <h4 className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/70 mb-3">AI Experience Analysis</h4>
          <p className="text-[14px] text-foreground/90 leading-relaxed font-medium">{result.experienceAssessment}</p>
        </div>
      )}

      {total > 0 && (
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/70">Skill Compatibility</h4>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
            {matchPct > 0 && <div style={{ width: `${matchPct}%` }} className="h-full bg-green-500/80" title="Matched" />}
            {partialPct > 0 && <div style={{ width: `${partialPct}%` }} className="h-full bg-yellow-500/80" title="Partial" />}
            {missingPct > 0 && <div style={{ width: `${missingPct}%` }} className="h-full bg-destructive/80" title="Missing" />}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {result.matchedSkills.length > 0 && (
          <div className="space-y-3 p-4 bg-green-500/5 rounded-xl border border-green-500/10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Matched
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.matchedSkills.map(s => (
                <Badge key={s} variant="outline" className="text-[11px] bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 font-semibold px-2 py-0.5 rounded-md">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(result.partialMatches && result.partialMatches.length > 0) && (
          <div className="space-y-3 p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-yellow-600 dark:text-yellow-400">
              <Minus className="w-3.5 h-3.5" /> Partial
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.partialMatches.map(s => (
                <Badge key={s} variant="outline" className="text-[11px] bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-semibold px-2 py-0.5 rounded-md">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {result.missingSkills.length > 0 && (
          <div className="space-y-3 p-4 bg-destructive/5 rounded-xl border border-destructive/10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-destructive">
              <XCircle className="w-3.5 h-3.5" /> Missing
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.missingSkills.map(s => (
                <Badge key={s} variant="outline" className="text-[11px] bg-destructive/10 border-destructive/20 text-destructive font-semibold px-2 py-0.5 rounded-md">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event, isLast }: { event: ApplicationEventResponse, isLast: boolean }) {
  const label = event.eventType.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20 shrink-0 shadow-sm z-10 group-hover:scale-110 transition-transform">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        {!isLast && <div className="w-px h-full bg-border/60 my-2 group-hover:bg-primary/20 transition-colors" />}
      </div>
      <div className={`pb-10 pt-1.5 flex-1`}>
        <div className="flex items-center justify-between gap-4">
          <div className="font-semibold text-foreground text-[14px]">{label}</div>
          <div className="text-[11px] font-bold tracking-widest text-muted-foreground/60 stat-number uppercase">
            {new Date(event.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
        {event.note && (
          <div className="mt-3 text-[13px] text-foreground/90 bg-secondary/40 p-4 rounded-xl border border-border/40 premium-shadow">
            {event.note}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<ApplicationResponse | null>(null);
  const [timeline, setTimeline] = useState<ApplicationEventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [appData, events] = await Promise.all([
        getApplication(id),
        getApplicationTimeline(id)
      ]);
      if (appData) setApp(appData);
      setTimeline(events);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!id || !app) return;
    setIsUpdating(true);
    try {
      await updateApplicationStatus(id, newStatus);
      await fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFollowUpChange = async (newDate: string | null) => {
    if (!id || !app) return;
    setIsUpdating(true);
    try {
      await updateFollowUpDate(id, newDate);
      await fetchData();
    } catch (err) {
      console.error('Failed to update follow-up date', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Loading application...</span>
        </div>
      </div>
    );
  }

  if (!app) return <div className="p-10 text-center text-muted-foreground">Application not found</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500 relative">
      {/* Decorative Blur Background */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-0 z-20 bg-background/80 backdrop-blur-xl py-4 border-b border-border/40">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/applications')} className="shrink-0 bg-background/50 backdrop-blur-sm border-border/60 hover:bg-secondary/50 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-tight">{app.jobTitle}</h1>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5 font-medium">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="text-foreground/80">{app.companyName}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-secondary/10 p-1.5 rounded-xl border border-border/40 shadow-sm glass-panel">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Follow-up</span>
            <input 
              type="date"
              className="w-[140px] h-8 bg-background border border-border/40 font-semibold text-sm shadow-sm hover:border-primary/40 transition-colors rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={app.followUpDate || ''}
              onChange={(e) => handleFollowUpChange(e.target.value || null)}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center gap-3 bg-secondary/10 p-1.5 rounded-xl border border-border/40 shadow-sm glass-panel">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2">Status</span>
            <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)} disabled={isUpdating}>
              <SelectTrigger className="w-[180px] h-8 bg-background border-border/40 font-semibold text-sm shadow-sm hover:border-primary/40 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s} className="font-medium text-sm">{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 relative z-10">
        {/* Left Column: Match & Details */}
        <div className="space-y-6">
          <Card className="p-6 glass-panel border-border/40 hover:border-border/80 transition-colors premium-shadow">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
              <h2 className="text-[15px] font-semibold tracking-tight uppercase text-foreground/80">Compatibility Match</h2>
              {app.matchResult && app.matchScore !== null && (
                <div className={`flex items-center gap-2 font-bold stat-number text-2xl ${scoreColor(app.matchScore)}`}>
                  {app.matchScore}%
                </div>
              )}
            </div>
            
            {app.matchResult ? (
              <MatchPanel result={app.matchResult} />
            ) : (
              <div className="text-sm text-muted-foreground/80 font-medium italic bg-secondary/20 p-4 rounded-lg border border-dashed border-border/60">
                No matching results found. Matching requires a generated candidate profile.
              </div>
            )}
          </Card>

          <Card className="p-6 glass-panel border-border/40 hover:border-border/80 transition-colors premium-shadow">
            <h2 className="text-[15px] font-semibold tracking-tight uppercase text-foreground/80 mb-6 pb-4 border-b border-border/40">Timeline</h2>
            {timeline.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No events recorded.</div>
            ) : (
              <div className="pt-2 pl-2">
                {timeline.map((event, index) => (
                  <TimelineItem 
                    key={event.id} 
                    event={event} 
                    isLast={index === timeline.length - 1} 
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Meta */}
        <div className="space-y-6">
          <Card className="p-6 glass-panel border-border/40 hover:border-border/80 transition-colors premium-shadow sticky top-32">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-foreground/80 mb-5 pb-3 border-b border-border/40">Application Details</h3>
            
            <div className="space-y-5">
              <div>
                <span className="block text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1.5">Created On</span>
                <div className="text-[13px] text-foreground font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground/80" />
                  {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              
              <div className="border-t border-border/40 pt-5">
                <span className="block text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1.5">Resume Used</span>
                <Button variant="ghost" size="sm" className="w-full justify-start text-[13px] font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors" onClick={() => navigate(`/resumes/${app.resumeId}`)}>
                  View Document <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </Button>
              </div>

              <div className="border-t border-border/40 pt-5">
                <span className="block text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1.5">Job Post</span>
                <Button variant="ghost" size="sm" className="w-full justify-start text-[13px] font-medium text-foreground hover:bg-secondary border border-border/40 transition-colors" onClick={() => navigate('/jobs')}>
                  View Role <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}