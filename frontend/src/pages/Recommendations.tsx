import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, AlertTriangle, Building2, Zap, ChevronRight,
  CheckCircle2, XCircle, FileText, Plus, ArrowRight,
} from 'lucide-react';
import { listRecommendations, RecommendationResponse } from '../lib/recommendations';
import { listResumes } from '../lib/resumes';
import { createApplication } from '../lib/applications';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreRing(score: number) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color =
    score >= 70 ? '#22c55e' :
    score >= 40 ? '#eab308' :
    '#ef4444';
  return { radius, circ, filled, color };
}

function ScoreRing({ score }: { score: number }) {
  const { radius, circ, filled, color } = scoreRing(score);
  return (
    <div className="relative flex-shrink-0 w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor"
          strokeWidth="3.5" className="text-border/40" />
        <circle cx="22" cy="22" r={radius} fill="none" stroke={color}
          strokeWidth="3.5" strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-foreground">
        {score}
      </span>
    </div>
  );
}

// ─── Apply Dialog ─────────────────────────────────────────────────────────────

interface ApplyDialogProps {
  rec: RecommendationResponse;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ApplyDialog({ rec, open, onClose, onSuccess }: ApplyDialogProps) {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<{ id: string; label: string }[]>([]);
  const [selResumeId, setSelResumeId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    setError(null);
    setDone(false);
    setSelResumeId('');
    setNotes('');
    listResumes()
      .then((r) =>
        setResumes(
          r.map((x) => ({
            id: x.id,
            label: x.versionLabel ? `${x.filename} (${x.versionLabel})` : x.filename,
          }))
        )
      )
      .catch((err: any) => setError(err?.detail || err?.error || 'Failed to load resumes'))
      .finally(() => setIsLoading(false));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rec.jobId || !selResumeId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createApplication(rec.jobId, selResumeId, notes || undefined);
      setDone(true);
      onSuccess();
    } catch (err: any) {
      setError(err?.detail || err?.error || 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Apply to {rec.jobTitle}</DialogTitle>
          <DialogDescription>
            {rec.companyName && (
              <span className="text-muted-foreground">{rec.companyName} · </span>
            )}
            Match score: <strong>{rec.matchScore}%</strong>
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Application created!</p>
              <p className="text-sm text-muted-foreground mt-1">Track it in your Applications board.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={() => navigate('/applications')} className="gap-2">
                View Applications <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {error && (
              <div className="text-sm text-destructive py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />Resume
              </Label>
              {isLoading ? (
                <div className="h-10 rounded-md bg-secondary/40 animate-pulse" />
              ) : (
                <Select value={selResumeId} onValueChange={setSelResumeId} required>
                  <SelectTrigger className="bg-background/50 border-border/60 h-10">
                    <SelectValue placeholder="Select a resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.length === 0 ? (
                      <SelectItem value="none" disabled>No resumes uploaded</SelectItem>
                    ) : (
                      resumes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                Notes (optional)
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this application..."
                rows={3}
                className="bg-background/50 border-border/60 text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selResumeId || isSubmitting}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isSubmitting ? 'Applying...' : 'Apply'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  rank,
  onApply,
}: {
  rec: RecommendationResponse;
  rank: number;
  onApply: (rec: RecommendationResponse) => void;
}) {
  const tierColor =
    rec.matchScore >= 70 ? 'text-green-600 dark:text-green-500 bg-green-500/10 border-green-500/20' :
    rec.matchScore >= 40 ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
    'text-destructive bg-destructive/10 border-destructive/20';

  const tier = rec.matchScore >= 70 ? 'Strong' : rec.matchScore >= 40 ? 'Good' : 'Partial';

  return (
    <Card className="glass-panel border-border/40 hover:border-border/70 transition-all duration-200 premium-shadow hover:premium-shadow-hover group overflow-hidden">
      {/* Subtle rank indicator line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{
          background: `linear-gradient(90deg, ${
            rec.matchScore >= 70 ? '#22c55e' : rec.matchScore >= 40 ? '#eab308' : '#ef4444'
          }88, transparent)`,
        }}
      />

      <div className="p-6 flex gap-5 items-start relative">
        {/* Rank */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary/60 flex items-center justify-center text-[11px] font-bold text-muted-foreground border border-border/40 mt-1">
          {rank}
        </div>

        {/* Score Ring */}
        <ScoreRing score={rec.matchScore} />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground leading-tight">
                  {rec.jobTitle}
                </h3>
                {rec.companyName && (
                  <p className="text-[13px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5" /> {rec.companyName}
                  </p>
                )}
              </div>
              <Badge variant="outline" className={`text-[10px] font-bold tracking-wider uppercase shrink-0 ${tierColor}`}>
                {tier}
              </Badge>
            </div>
          </div>

          {/* Reason summary */}
          {rec.reasonSummary && (
            <div>
              <p className="text-[13px] text-muted-foreground leading-relaxed italic">
                "{rec.reasonSummary}"
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Based on your resume: {rec.resumeVersionLabel ? `${rec.resumeFilename} (${rec.resumeVersionLabel})` : rec.resumeFilename}
              </p>
            </div>
          )}

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5">
            {rec.matchedSkills.slice(0, 5).map((s) => (
              <Badge key={s} variant="outline"
                className="text-[10px] font-bold uppercase tracking-wide bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> {s}
              </Badge>
            ))}
            {rec.missingSkills.slice(0, 3).map((s) => (
              <Badge key={s} variant="outline"
                className="text-[10px] font-bold uppercase tracking-wide bg-destructive/10 text-destructive border-destructive/20 gap-1">
                <XCircle className="w-2.5 h-2.5" /> {s}
              </Badge>
            ))}
            {(rec.matchedSkills.length > 5 || rec.missingSkills.length > 3) && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground border-border/40">
                +{Math.max(0, rec.matchedSkills.length - 5) + Math.max(0, rec.missingSkills.length - 3)} more
              </Badge>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <Button
          size="sm"
          onClick={() => onApply(rec)}
          className="shrink-0 gap-1.5 font-bold text-[12px] h-9 mt-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          Apply <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Recommendations() {
  const [recs, setRecs] = useState<RecommendationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRec, setActiveRec] = useState<RecommendationResponse | null>(null);
  const navigate = useNavigate();

  const fetchRecs = () => {
    setIsLoading(true);
    setError(null);
    listRecommendations()
      .then(setRecs)
      .catch((err: any) => setError(err?.detail || err?.error || 'Failed to load recommendations'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchRecs(); }, []);

  const noResultReason = recs.length === 1 ? recs[0].noResultReason : null;
  const realRecs = recs.filter((r) => r.noResultReason === null);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Decorative glow */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recommended for You</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Your saved jobs ranked by skill and experience compatibility with your most recent resume.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-secondary/30 animate-pulse border border-border/30" />
          ))}
        </div>
      )}

      {/* No-result edge cases */}
      {!isLoading && !error && noResultReason && (
        <Card className="glass-panel border-border/40 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-4 ring-1 ring-border/40">
            <Sparkles className="w-6 h-6 text-muted-foreground/60" />
          </div>
          {noResultReason === 'noResume' ? (
            <>
              <h3 className="text-[15px] font-semibold mb-2">Upload a Resume First</h3>
              <p className="text-[13px] text-muted-foreground max-w-sm mx-auto mb-6">
                To get ranked recommendations, upload at least one resume so CareerOS can analyse your skills.
              </p>
              <Button onClick={() => navigate('/resumes')} className="gap-2">
                <Plus className="w-4 h-4" /> Upload Resume
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-[15px] font-semibold mb-2">No Saved Jobs Yet</h3>
              <p className="text-[13px] text-muted-foreground max-w-sm mx-auto mb-6">
                Save some jobs from the Jobs page and CareerOS will score and rank them against your resume.
              </p>
              <Button onClick={() => navigate('/jobs')} className="gap-2">
                <Plus className="w-4 h-4" /> Browse Jobs
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Recommendations list */}
      {!isLoading && !error && realRecs.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground font-medium">
              {realRecs.length} job{realRecs.length !== 1 ? 's' : ''} ranked by compatibility
            </p>
          </div>
          <div className="space-y-4 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[46px] top-12 bottom-4 w-px bg-gradient-to-b from-border/60 to-transparent pointer-events-none" />

            {realRecs.map((rec, i) => (
              <RecommendationCard
                key={rec.jobId}
                rec={rec}
                rank={i + 1}
                onApply={setActiveRec}
              />
            ))}
          </div>
        </>
      )}

      {/* Apply Dialog */}
      {activeRec && (
        <ApplyDialog
          rec={activeRec}
          open={activeRec !== null}
          onClose={() => setActiveRec(null)}
          onSuccess={() => {
            setActiveRec(null);
            fetchRecs(); // refresh to reflect newly applied job potentially disappearing
          }}
        />
      )}
    </div>
  );
}