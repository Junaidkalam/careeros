import { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats } from '../lib/analytics';
import { getDueFollowUps, ApplicationResponse } from '../lib/applications';
import { ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Activity, Target, Trophy, AlertCircle, TrendingUp, Sparkles, ChevronRight, Calendar, ArrowRight } from 'lucide-react';

function formatRate(rate: number | null): string {
  if (rate === null || rate === undefined || isNaN(rate)) return '0%';
  return `${(rate * 100).toFixed(1)}%`;
}

function InsightCard({ title, value, subtitle, icon: Icon, trend = null, primary = false }: { title: string, value: string | number, subtitle: string, icon: any, trend?: string | null, primary?: boolean }) {
  return (
    <Card className={`relative overflow-hidden p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${primary ? 'bg-primary text-primary-foreground shadow-md' : 'glass-panel border-border/40 hover:border-border/80 premium-shadow'}`}>
      {primary && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none transform -translate-x-1/2 translate-y-1/2" />
        </>
      )}
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`p-2.5 rounded-xl ${primary ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-secondary/50 text-muted-foreground border border-border/50 shadow-sm'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center ${primary ? 'bg-white/20 text-white' : 'bg-green-500/10 text-green-600 dark:text-green-400'}`}>
            <TrendingUp className="w-3 h-3 mr-1"/> {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <div className={`text-4xl font-bold tracking-tight stat-number mb-1 ${primary ? 'text-white' : 'text-foreground'}`}>
          {value}
        </div>
        <h3 className={`text-[13px] font-semibold tracking-tight ${primary ? 'text-white/90' : 'text-foreground/80'}`}>
          {title}
        </h3>
        <p className={`text-[11px] font-medium mt-1 ${primary ? 'text-white/60' : 'text-muted-foreground/70'}`}>
          {subtitle}
        </p>
      </div>
    </Card>
  );
}

function FunnelStep({ label, value, isLast = false }: { label: string, value: number, isLast?: boolean }) {
  return (
    <div className="flex items-center gap-4 flex-1">
      <div className="flex-1 space-y-2">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">{label}</div>
        <div className="text-2xl font-bold stat-number text-foreground">{value}</div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary/40 rounded-full w-full" />
        </div>
      </div>
      {!isLast && (
        <div className="text-muted-foreground/30 px-2 mt-6">
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { name } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dueFollowUps, setDueFollowUps] = useState<ApplicationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getDueFollowUps()
    ])
      .then(([statsData, followUpsData]) => {
        setStats(statsData);
        setDueFollowUps(followUpsData);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? (err.detail || err.error) : 'Failed to load dashboard.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium animate-pulse">Syncing career intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 glass-panel">
        <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-destructive">Failed to load insights</h3>
          <p className="text-[13px] text-destructive/80 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const greetingTime = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20 relative">
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Welcome Section */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            {greetingTime}, {name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary/60" /> Here's your career search intelligence at a glance.
          </p>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <InsightCard 
          title="Active Applications" 
          value={stats.activeApplications} 
          subtitle="Currently in progress"
          icon={Activity}
          primary
        />
        <InsightCard 
          title="Interview Rate" 
          value={formatRate(stats.interviewRate)} 
          subtitle="Applications converting to interviews"
          icon={Target}
        />
        <InsightCard 
          title="Offer Rate" 
          value={formatRate(stats.offerRate)} 
          subtitle="Interviews converting to offers"
          icon={Trophy}
        />
      </div>

      {/* Application Funnel */}
      <div className="space-y-4 relative z-10">
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Application Pipeline</h3>
        <Card className="p-8 glass-panel border-border/40 premium-shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <FunnelStep label="Applied" value={stats.totalApplications} />
            <FunnelStep label="Interviewing" value={stats.interviews} />
            <FunnelStep label="Offers" value={stats.offers} />
            <FunnelStep label="Rejected" value={stats.rejected} isLast />
          </div>
        </Card>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
        <Card className="p-7 flex flex-col justify-between glass-panel hover:border-border/80 transition-colors premium-shadow">
          <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70 mb-4">Velocity</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold stat-number text-foreground tracking-tight">{stats.applicationsThisWeek}</div>
              <div className="text-[13px] font-semibold text-foreground/80 mt-1">Applications this week</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-7 h-7" />
            </div>
          </div>
        </Card>

        <Card className="p-7 flex flex-col justify-between glass-panel hover:border-border/80 transition-colors premium-shadow">
          <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70 mb-4">Consistency</div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold stat-number text-foreground tracking-tight">{stats.applicationsThisMonth}</div>
              <div className="text-[13px] font-semibold text-foreground/80 mt-1">Applications this month</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20 text-purple-600 dark:text-purple-400">
              <Activity className="w-7 h-7" />
            </div>
          </div>
        </Card>
      </div>

      {dueFollowUps.length > 0 && (
        <div className="space-y-4 relative z-10 mt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Follow-ups Due</h3>
            <div className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-md ring-1 ring-yellow-500/20">{dueFollowUps.length} Pending</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dueFollowUps.map(app => (
              <Card key={app.id} className="p-5 glass-panel border-border/40 hover:border-primary/30 transition-colors premium-shadow group">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-sm">{app.status.replace(/_/g, ' ')}</div>
                  <div className="text-[10px] font-bold text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Past due</div>
                </div>
                <h4 className="font-semibold text-foreground text-sm line-clamp-1">{app.jobTitle}</h4>
                <p className="text-muted-foreground text-[13px] mt-0.5">{app.companyName}</p>
                <Link to={`/applications/${app.id}`} className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-primary group-hover:underline">
                  Take action <ArrowRight className="w-3 h-3" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}