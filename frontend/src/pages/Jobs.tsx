import { useEffect, useState } from 'react';
import { listJobs, importJob, createJob, discoverJobs, JobResponse, JobRequest, JobDiscoveryResponse } from '../lib/jobs';
import { ApiError } from '../lib/api';
import { Plus, X, AlertTriangle, Link as LinkIcon, MapPin, MonitorPlay, DollarSign, Search, Briefcase, ChevronRight, Filter, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

function TagsInput({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onChange([...tags, input.trim()]);
      setInput('');
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-secondary/50 hover:bg-secondary/70 transition-colors py-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter(t => t !== tag))}
              className="text-muted-foreground hover:text-foreground ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Type and press Enter..."
          className="flex-1"
        />
        <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card/50 border border-dashed rounded-xl">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
        <Briefcase className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No jobs saved yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Keep track of all the roles you're interested in applying for. Import from a URL or add manually.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <Plus className="w-4 h-4" /> Add your first job
      </Button>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('Any');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('Any');
  const [minMatchScoreFilter, setMinMatchScoreFilter] = useState('Any');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Import
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Form
  const emptyForm: JobRequest = {
    title: '', companyName: '', postingUrl: '', location: '', workMode: '',
    employmentType: '', description: '', requiredSkills: [], preferredSkills: [],
    postedDate: '', salaryRange: '',
  };
  const [formData, setFormData] = useState<JobRequest>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Discovery
  const [discoveredJobs, setDiscoveredJobs] = useState<JobDiscoveryResponse[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setDiscoveryError(null);
    setShowDiscovery(true);
    try {
      const results = await discoverJobs();
      setDiscoveredJobs(results);
    } catch (err: any) {
      setDiscoveryError(err?.detail || err?.error || err?.message || 'Failed to discover jobs');
    } finally {
      setIsDiscovering(false);
    }
  };

  const saveDiscoveredJob = (draft: JobRequest) => {
    setImportUrl(''); setImportWarning(null); setImportError(null);
    setSaveError(null);
    setFormData({ ...draft, requiredSkills: draft.requiredSkills || [], preferredSkills: draft.preferredSkills || [] });
    setIsModalOpen(true);
  };


  const fetchJobs = async () => {
    setLoadError(null);
    try {
      const filters = {
        search: debouncedSearch,
        workMode: workModeFilter,
        employmentType: employmentTypeFilter,
        minMatchScore: minMatchScoreFilter === 'Any' ? undefined : parseInt(minMatchScoreFilter, 10),
      };
      setJobs(await listJobs(filters));
    }
    catch (err: any) {
      console.error('fetchJobs error:', err);
      setLoadError(err?.detail || err?.error || err?.message || 'Failed to load jobs');
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [debouncedSearch, workModeFilter, employmentTypeFilter, minMatchScoreFilter]);

  const openModal = () => {
    setImportUrl(''); setImportWarning(null); setImportError(null);
    setSaveError(null); setFormData(emptyForm); setIsModalOpen(true);
  };

  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true); setImportWarning(null); setImportError(null);
    try {
      const res = await importJob(importUrl);
      setFormData({ ...res.draft, requiredSkills: res.draft.requiredSkills || [], preferredSkills: res.draft.preferredSkills || [] });
      if (res.warning) setImportWarning(res.warning);
    } catch (err) {
      setImportError(err instanceof ApiError ? (err.detail || err.error) : 'Import failed. Fill the details manually.');
    } finally { setIsImporting(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setSaveError(null);
    try {
      const payload = { ...formData };
      if (!payload.postingUrl) delete payload.postingUrl;
      if (!payload.location) delete payload.location;
      if (!payload.workMode) delete payload.workMode;
      if (!payload.employmentType) delete payload.employmentType;
      if (!payload.description) delete payload.description;
      if (!payload.postedDate) delete payload.postedDate;
      if (!payload.salaryRange) delete payload.salaryRange;
      await createJob(payload);
      setIsModalOpen(false); fetchJobs();
    } catch (err) {
      if (err instanceof ApiError) {
        if ((err.error || err.detail || '').includes('already exist')) {
          setSaveError('This job appears to already exist in your tracker');
        } else {
          setSaveError(err.detail || err.error);
        }
      } else { setSaveError('Failed to save job.'); }
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your target roles.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px] bg-card"
            />
          </div>
          
          <Select value={workModeFilter} onValueChange={setWorkModeFilter}>
            <SelectTrigger className="w-[130px] shrink-0 bg-card">
              <SelectValue placeholder="Work Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any">Any Mode</SelectItem>
              <SelectItem value="REMOTE">Remote</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
              <SelectItem value="ONSITE">Onsite</SelectItem>
            </SelectContent>
          </Select>

          <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
            <SelectTrigger className="w-[140px] shrink-0 bg-card">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any">Any Type</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={minMatchScoreFilter} onValueChange={setMinMatchScoreFilter}>
            <SelectTrigger className="w-[140px] shrink-0 bg-card">
              <SelectValue placeholder="Match Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any">Any Score</SelectItem>
              <SelectItem value="50">50%+ Match</SelectItem>
              <SelectItem value="70">70%+ Match</SelectItem>
              <SelectItem value="90">90%+ Match</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            
            <Button onClick={handleDiscover} variant="outline" className="gap-2 shrink-0 ml-auto xl:ml-0" disabled={isDiscovering}>
              <Sparkles className="w-4 h-4 text-amber-500" /> Discover Jobs
            </Button>
            <DialogTrigger asChild>

              <Button onClick={openModal} className="gap-2 shrink-0 ml-auto xl:ml-0">
                <Plus className="w-4 h-4" /> Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
                <DialogDescription>
                  Import job details from a URL or enter them manually.
                </DialogDescription>
              </DialogHeader>

              {/* Import Section */}
              <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block font-semibold">Auto-Import (Optional)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://boards.greenhouse.io/..."
                      className="pl-9 bg-background"
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={handleImport} disabled={!importUrl || isImporting}>
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                </div>
                {importError && (
                  <p className="mt-3 text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 p-2 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {importError}
                  </p>
                )}
                {importWarning && (
                  <p className="mt-3 text-xs text-orange-600 flex items-center gap-1.5 bg-orange-50 p-2 rounded-md dark:bg-orange-950/50 dark:text-orange-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {importWarning}
                  </p>
                )}
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase font-semibold"><span className="bg-card px-2 text-muted-foreground">Or Enter Manually</span></div>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {saveError && (
                  <div className="text-sm text-destructive py-2 px-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title *</Label>
                    <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>URL</Label>
                    <Input type="url" value={formData.postingUrl || ''} onChange={e => setFormData({ ...formData, postingUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Mode</Label>
                    <Select value={formData.workMode || ''} onValueChange={v => setFormData({ ...formData, workMode: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REMOTE">Remote</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                        <SelectItem value="ONSITE">Onsite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select value={formData.employmentType || ''} onValueChange={v => setFormData({ ...formData, employmentType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Posted Date</Label>
                    <Input type="date" value={formData.postedDate || ''} onChange={e => setFormData({ ...formData, postedDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Salary Range</Label>
                    <Input placeholder="$120k - $150k" value={formData.salaryRange || ''} onChange={e => setFormData({ ...formData, salaryRange: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea className="h-24 resize-none" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <TagsInput label="Required Skills" tags={formData.requiredSkills || []} onChange={t => setFormData({ ...formData, requiredSkills: t })} />
                  </div>
                  <div className="sm:col-span-2">
                    <TagsInput label="Preferred Skills" tags={formData.preferredSkills || []} onChange={t => setFormData({ ...formData, preferredSkills: t })} />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Job'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      
      {showDiscovery && (
        <div className="bg-amber-50/50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-8 relative">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={() => setShowDiscovery(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
              <p className="text-sm text-muted-foreground">Jobs discovered via Adzuna based on your profile.</p>
            </div>
          </div>
          
          {isDiscovering ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-amber-500/5 animate-pulse border border-amber-500/10" />
              ))}
            </div>
          ) : discoveryError ? (
            <div className="text-sm text-destructive py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {discoveryError}
            </div>
          ) : discoveredJobs.length > 0 && discoveredJobs[0].noResultReason ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">{discoveredJobs[0].warning || 'No results found.'}</p>
              <p className="text-sm font-medium">{discoveredJobs[0].reasonSummary}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveredJobs.map((dj, i) => dj.draft && (
                <div key={i} className="bg-background rounded-xl p-5 border border-border hover:border-amber-500/30 transition-colors shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{dj.draft.title}</h4>
                      {dj.matchScore !== null ? (
                        <Badge variant={dj.matchScore >= 70 ? 'default' : 'secondary'} className={dj.matchScore >= 70 ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                          {dj.matchScore}% Match
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-dashed">
                          No Score
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-4">{dj.draft.companyName}</p>
                    <div className="flex flex-wrap gap-2 text-[12px] font-medium mb-4">
                      {dj.draft.location && <span className="bg-secondary px-2 py-1 rounded-md">{dj.draft.location}</span>}
                      {dj.draft.employmentType && <span className="bg-secondary px-2 py-1 rounded-md">{dj.draft.employmentType}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic mb-4">{dj.reasonSummary}</p>
                  </div>
                  <div className="pt-3 border-t flex justify-end">
                    <Button size="sm" onClick={() => saveDiscoveredJob(dj.draft!)} className="gap-2">
                      <Plus className="w-3.5 h-3.5" /> Save Job
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {loadError && (
        <div className="text-sm text-destructive py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-secondary/30 animate-pulse border border-border/30" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        (debouncedSearch || workModeFilter !== 'Any' || employmentTypeFilter !== 'Any' || minMatchScoreFilter !== 'Any') ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl bg-card/20">
            <Filter className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>No jobs match your current filters.</p>
            <Button variant="link" onClick={() => {
              setSearchQuery('');
              setWorkModeFilter('Any');
              setEmploymentTypeFilter('Any');
              setMinMatchScoreFilter('Any');
            }}>Clear all filters</Button>
          </div>
        ) : (
          <EmptyState onAdd={openModal} />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="group relative flex flex-col justify-between p-6 rounded-2xl glass-panel hover:-translate-y-1 transition-all duration-300 premium-shadow cursor-pointer overflow-hidden border border-border/40 hover:border-primary/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-lg shadow-sm shrink-0">
                    {job.companyName.charAt(0).toUpperCase()}
                  </div>
                  {job.postedDate ? (
                    <div className="text-[11px] font-bold tracking-widest text-muted-foreground/50 uppercase stat-number">
                      {new Date(job.postedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  ) : null}
                </div>
                
                <h4 className="text-[17px] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
                  {job.title}
                </h4>
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  {job.companyName}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6 text-[12px] font-medium">
                  {job.salaryRange && (
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                      <DollarSign className="w-3.5 h-3.5" /> {job.salaryRange}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1.5 text-muted-foreground bg-secondary/80 px-2 py-1 rounded-md">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                  )}
                  {job.workMode && (
                    <span className="flex items-center gap-1.5 text-muted-foreground bg-secondary/80 px-2 py-1 rounded-md">
                      <MonitorPlay className="w-3 h-3" /> {job.workMode}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {(job.requiredSkills || []).slice(0, 3).map((skill, i) => (
                    <div key={i} className="px-2 py-0.5 rounded-md bg-background border border-border text-[10px] font-semibold text-foreground shadow-sm truncate max-w-[80px]" title={skill}>
                      {skill}
                    </div>
                  ))}
                  {(job.requiredSkills || []).length > 3 && (
                    <div className="px-2 py-0.5 rounded-md bg-secondary border border-border text-[10px] font-semibold text-muted-foreground shadow-sm">
                      +{(job.requiredSkills || []).length - 3}
                    </div>
                  )}
                  {(!job.requiredSkills || job.requiredSkills.length === 0) && (
                    <span className="text-[11px] text-muted-foreground/60 italic">No skills listed</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  View <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}