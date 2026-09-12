import { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats } from '../lib/analytics';
import { ApiError } from '../lib/api';
import { Separator } from '../components/ui/separator';
import { Card } from '../components/ui/card';

function formatRate(rate: number | null): string {
  if (rate === null || rate === undefined || isNaN(rate)) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

/* ─── Tier-2 compact count ─── */
function SecondaryCount({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-center px-4">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-semibold stat-number mt-0.5 text-foreground">
        {value}
      </div>
    </div>
  );
}

/* ─── Tier-3 bordered snapshot panel ─── */
function SnapshotPanel({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="flex flex-col px-5 py-4 w-40 rounded-sm shadow-none">
      <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-semibold stat-number mt-1 text-foreground">
        {value}
      </span>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => {
        setError(err instanceof ApiError ? (err.detail || err.error) : 'Failed to load dashboard.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-primary border-r-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[13px] text-destructive py-4 px-1">
        Error: {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-[780px] space-y-10">
      {/* Page title */}
      <h1 className="text-2xl font-display text-foreground font-normal mb-8">
        Dashboard
      </h1>

      {/* ── TIER 1 — Primary signal ── */}
      <div className="space-y-4">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
          Pipeline
        </div>
        
        <div className="flex flex-wrap items-end gap-12 pb-6">
          {/* Hero: active pipeline */}
          <div className="flex flex-col">
            <div className="stat-number text-5xl font-semibold leading-none text-foreground">
              {stats.activeApplications}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">Active applications</div>
          </div>

          {/* Hero: interview rate */}
          <div className="flex flex-col">
            <div className="stat-number text-5xl font-semibold leading-none text-primary">
              {formatRate(stats.interviewRate)}
            </div>
            <div className="text-[13px] text-muted-foreground mt-2">Interview rate</div>
          </div>

          {/* Offer rate — smaller beside the heroes */}
          <div className="ml-auto self-end flex flex-col text-right">
            <div className="stat-number text-2xl font-semibold text-foreground">
              {formatRate(stats.offerRate)}
            </div>
            <div className="text-[13px] text-muted-foreground mt-0.5">Offer rate</div>
          </div>
        </div>
      </div>
      
      <Separator />

      {/* ── TIER 2 — Secondary counts (inline strip) ── */}
      <div className="space-y-4 pb-2">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
          Totals
        </div>
        
        <div className="flex items-center h-16">
          <SecondaryCount label="Total" value={stats.totalApplications} />
          <Separator orientation="vertical" className="h-10 mx-2" />
          <SecondaryCount label="Interviews" value={stats.interviews} />
          <Separator orientation="vertical" className="h-10 mx-2" />
          <SecondaryCount label="Offers" value={stats.offers} />
          <Separator orientation="vertical" className="h-10 mx-2" />
          <SecondaryCount label="Rejected" value={stats.rejected} />
        </div>
      </div>

      <Separator />

      {/* ── TIER 3 — Time-bounded snapshots (bordered panels) ── */}
      <div className="space-y-4">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
          Activity
        </div>
        <div className="flex gap-6">
          <SnapshotPanel label="This week" value={stats.applicationsThisWeek} />
          <SnapshotPanel label="This month" value={stats.applicationsThisMonth} />
        </div>
      </div>
    </div>
  );
}