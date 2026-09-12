import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listApplications, updateApplicationStatus, getApplicationTimeline,
  ApplicationResponse, ApplicationEventResponse, ApplicationStatus, MatchResult
} from '../lib/applications';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ArrowLeft, CheckCircle2, XCircle, Minus, Clock } from 'lucide-react';

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
  if (score >= 75)    return 'text-green-700';
  if (score >= 50)    return 'text-yellow-700';
  return 'text-red-600';
}

function MatchPanel({ result }: { result: MatchResult }) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Match Breakdown</div>

      {result.experienceAssessment && (
        <p className="text-[13px] text-muted-foreground italic">{result.experienceAssessment}</p>
      )}

      {result.matchedSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-green-700 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.matchedSkills.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-sm bg-green-50 border border-green-200 text-green-800">{s}</span>
            ))}
          </div>
        </div>
      )}

      {result.partialMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-yellow-700 mb-2">
            <Minus className="w-3.5 h-3.5" /> Partial matches
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.partialMatches.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-sm bg-yellow-50 border border-yellow-200 text-yellow-800">{s}</span>
            ))}
          </div>
        </div>
      )}

      {result.missingSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-red-600 mb-2">
            <XCircle className="w-3.5 h-3.5" /> Missing skills
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

function TimelineItem({ event }: { event: ApplicationEventResponse }) {
  const label = event.eventType.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
        <div className="flex-1 w-px bg-border mt-1" />
      </div>
      <div className="pb-5">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        {event.note && <div className="text-[12px] text-muted-foreground mt-0.5">{event.note}</div>}
        <div className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(event.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<ApplicationResponse | null>(null);
  const [timeline, setTimeline] = useState<ApplicationEventResponse[]>([]);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const [apps, tl] = await Promise.all([
      listApplications(),
      getApplicationTimeline(id),
    ]);
    const found = apps.find(a => a.id === id);
    if (found) { setApp(found); setNewStatus(found.status); }
    setTimeline(tl);
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async () => {
    if (!id || !app || !newStatus || newStatus === app.status) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updated = await updateApplicationStatus(id, newStatus);
      setApp(updated);
      // Refresh timeline to get the new STATUS_CHANGED event
      const tl = await getApplicationTimeline(id);
      setTimeline(tl);
    } catch (err: any) {
      setUpdateError(err.detail || err.error || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!app) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-[860px] pb-20">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => navigate('/applications')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display text-foreground font-normal truncate">{app.jobTitle}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {app.companyName} Â· Applied {new Date(app.createdAt).toLocaleDateString()}
          </p>
        </div>
        {app.matchScore !== null && (
          <div className="text-right shrink-0">
            <div className={`text-3xl font-semibold stat-number ${scoreColor(app.matchScore)}`}>
              {app.matchScore}%
            </div>
            <div className="text-[11px] text-muted-foreground">match</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8">
        {/* Left: Timeline */}
        <div className="space-y-6">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Timeline</div>
          {timeline.length === 0 ? (
            <div className="text-[13px] text-muted-foreground">No events yet.</div>
          ) : (
            <div>
              {timeline.map(ev => <TimelineItem key={ev.id} event={ev} />)}
            </div>
          )}

          {app.matchResult && (
            <>
              <Separator />
              <MatchPanel result={app.matchResult} />
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-sm p-4 space-y-4">
            <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Update Status</div>
            {updateError && (
              <div className="text-[12px] text-destructive">{updateError}</div>
            )}
            <div className="space-y-2">
              <Label className="text-[12px]">Current: <strong>{STATUS_LABELS[app.status]}</strong></Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!newStatus || newStatus === app.status || isUpdating}
              onClick={handleStatusChange}
            >
              {isUpdating ? 'Saving...' : 'Update Status'}
            </Button>
          </div>

          {app.notes && (
            <div className="bg-card border border-border rounded-sm p-4 space-y-2">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Notes</div>
              <p className="text-[13px] text-foreground whitespace-pre-wrap">{app.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}