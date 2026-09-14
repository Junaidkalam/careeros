import re

with open('src/pages/Jobs.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
states_injection = """
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
"""

content = content.replace("  const [loadError, setLoadError] = useState<string | null>(null);", "  const [loadError, setLoadError] = useState<string | null>(null);\n" + states_injection)

# Add "Discover Jobs" button next to "Add Job"
button_injection = """
            <Button onClick={handleDiscover} variant="outline" className="gap-2 shrink-0 ml-auto xl:ml-0" disabled={isDiscovering}>
              <Sparkles className="w-4 h-4 text-amber-500" /> Discover Jobs
            </Button>
            <DialogTrigger asChild>
"""

content = content.replace("<DialogTrigger asChild>", button_injection)


# Add Discovery section before the main list
discovery_section = """
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
                      <Badge variant={dj.matchScore >= 70 ? 'default' : 'secondary'} className={dj.matchScore >= 70 ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                        {dj.matchScore}% Match
                      </Badge>
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

"""

content = content.replace("{loadError && (", discovery_section + "\n      {loadError && (")

with open('src/pages/Jobs.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
