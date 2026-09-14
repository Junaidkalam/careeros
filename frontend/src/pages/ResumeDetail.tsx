import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResume, updateResumeProfile, deleteResume, ResumeResponse, CandidateSkill, SkillCategory } from '../lib/resumes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Save, X, Plus, FileText, Calendar, Briefcase, GraduationCap, Clock, AlertTriangle, Trash2 } from 'lucide-react';

const CATEGORIES: SkillCategory[] = [
  'PROGRAMMING_LANGUAGE', 'FRAMEWORK', 'LIBRARY', 'DATABASE', 'CLOUD', 
  'DEVOPS', 'TESTING', 'TOOL', 'CONCEPT', 'SOFT_SKILL', 'DOMAIN_SPECIFIC'
];

function CategoryColor(category: SkillCategory) {
  const map: Record<string, string> = {
    'PROGRAMMING_LANGUAGE': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    'FRAMEWORK': 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    'DATABASE': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    'CLOUD': 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
    'SOFT_SKILL': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  };
  return map[category] || 'bg-secondary text-secondary-foreground border-transparent';
}

function CategoryLabel(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

export default function ResumeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [summary, setSummary] = useState('');
  const [role, setRole] = useState('');
  const [education, setEducation] = useState('');
  const [years, setYears] = useState<number | ''>('');
  const [skills, setSkills] = useState<CandidateSkill[]>([]);

  // New skill state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCat, setNewSkillCat] = useState<SkillCategory>('TOOL');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getResume(id)
      .then(r => {
        setResume(r);
        if (r.candidateProfile) {
          setSummary(r.candidateProfile.summary || '');
          setRole(r.candidateProfile.primaryRole || '');
          setEducation(r.candidateProfile.education || '');
          setYears(r.candidateProfile.experienceYears ?? '');
          setSkills(r.candidateProfile.skills || []);
        }
      })
      .catch(err => setError(err.detail || err.error || 'Failed to load resume'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id || !resume) return;
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateResumeProfile(id, {
        summary: summary || null,
        primaryRole: role || null,
        education: education || null,
        experienceYears: years === '' ? null : Number(years),
        skills
      });
      setResume(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.detail || err.error || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !resume) return;
    if (!window.confirm('Are you sure you want to delete this resume? This will detach it from any connected applications.')) return;
    setIsDeleting(true);
    try {
      await deleteResume(id);
      navigate('/resumes');
    } catch (err: any) {
      setError(err.detail || err.error || 'Failed to delete resume');
      setIsDeleting(false);
    }
  };

  const removeSkill = (index: number) => {
    setSkills(s => s.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { skillName: newSkillName.trim(), category: newSkillCat }]);
    setNewSkillName('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Loading resume details...</span>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Resume Not Found</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{error || 'This resume may have been deleted or you do not have permission to view it.'}</p>
        <Button variant="outline" onClick={() => navigate('/resumes')}>
          Back to Resumes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Decorative Blur Background */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-xl py-4 border-b border-border/40">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/resumes')} className="shrink-0 bg-background/50 backdrop-blur-sm border-border/60 hover:bg-secondary/50 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-tight">{resume.filename}</h1>
              {resume.versionLabel && (
                <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary border border-primary/20">{resume.versionLabel}</Badge>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mt-1 flex items-center gap-2 font-medium">
              <Calendar className="w-3.5 h-3.5" /> Uploaded {new Date(resume.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 bg-secondary/10 p-1.5 rounded-xl border border-border/40 shadow-sm glass-panel">
          <Button 
            variant="ghost" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent h-9 text-sm"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isDeleting} className="min-w-[120px] h-9 text-sm shadow-sm">
            {isSaving ? (
              <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 glass-panel">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="text-sm text-green-700 py-3 px-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400 glass-panel">
          <Save className="w-4 h-4 shrink-0" />
          Profile updated successfully.
        </div>
      )}

      {!resume.profileGenerated ? (
        <Card className="p-8 text-center bg-destructive/5 border-destructive/20 shadow-sm glass-panel">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4 opacity-80" />
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground mb-2">AI Parsing Failed</h2>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
            {resume.warning || 'We could not extract readable text from this document. The file might be corrupted, scanned, or in an unsupported format.'}
          </p>
          <div className="mt-8 pt-8 border-t border-border/50 text-left">
            <h3 className="text-[13px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">Raw Text Extract:</h3>
            <pre className="text-xs text-muted-foreground bg-secondary/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-64 border border-border/50 font-mono">
              No text extracted.
            </pre>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-8 relative z-10">
          
          <div className="space-y-8">
            <Card className="p-7 glass-panel border-border/40 hover:border-border/80 transition-colors premium-shadow">
              <div className="flex items-center gap-2.5 mb-7 pb-4 border-b border-border/40">
                <div className="w-8 h-8 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-sm">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-semibold tracking-widest uppercase text-foreground/80">AI Generated Profile</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <Label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Primary Role</Label>
                  <Input 
                    value={role} 
                    onChange={e => setRole(e.target.value)} 
                    placeholder="e.g. Senior Software Engineer"
                    className="bg-background/50 font-medium h-10 shadow-sm focus-visible:ring-primary/20 transition-all border-border/60"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Experience (Years)</Label>
                  <Input 
                    type="number" 
                    value={years} 
                    onChange={e => setYears(e.target.value === '' ? '' : Number(e.target.value))} 
                    placeholder="e.g. 5"
                    min="0"
                    className="bg-background/50 font-medium h-10 shadow-sm max-w-[150px] focus-visible:ring-primary/20 transition-all border-border/60"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /> Education</Label>
                  <Input 
                    value={education} 
                    onChange={e => setEducation(e.target.value)} 
                    placeholder="e.g. B.S. Computer Science"
                    className="bg-background/50 font-medium h-10 shadow-sm focus-visible:ring-primary/20 transition-all border-border/60"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">Professional Summary</Label>
                  <Textarea 
                    value={summary} 
                    onChange={e => setSummary(e.target.value)} 
                    rows={6}
                    placeholder="Summary of experience and expertise..."
                    className="resize-y bg-background/50 font-medium leading-relaxed shadow-sm focus-visible:ring-primary/20 transition-all border-border/60 custom-scrollbar"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-7 glass-panel border-border/40 hover:border-border/80 transition-colors premium-shadow">
              <h2 className="text-[15px] font-semibold tracking-widest uppercase text-foreground/80 mb-7 pb-4 border-b border-border/40">Extracted Skills</h2>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {skills.length === 0 ? (
                  <span className="text-[13px] text-muted-foreground italic bg-secondary/30 px-4 py-2 rounded-lg border border-dashed border-border/60">No skills extracted.</span>
                ) : (
                  skills.map((s, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className={`text-[11px] font-bold tracking-wide uppercase px-2 py-1 flex items-center gap-1.5 transition-colors border shadow-sm ${CategoryColor(s.category)}`}
                    >
                      {s.skillName}
                      <button 
                        onClick={() => removeSkill(i)} 
                        className="opacity-60 hover:opacity-100 hover:text-foreground ml-1"
                        title="Remove skill"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              <div className="pt-6 border-t border-border/40">
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-4">Add a Skill</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Skill name (e.g. React)" 
                    value={newSkillName} 
                    onChange={e => setNewSkillName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    className="flex-1 bg-background/50 border-border/60 font-medium h-10 shadow-sm"
                  />
                  <Select value={newSkillCat} onValueChange={(v: SkillCategory) => setNewSkillCat(v)}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background/50 border-border/60 font-medium h-10 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c} className="text-sm font-medium">{CategoryLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addSkill} variant="secondary" className="shrink-0 gap-2 w-full sm:w-auto h-10 font-bold tracking-wide shadow-sm">
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="glass-panel overflow-hidden border-border/40 premium-shadow">
              <div className="p-4 border-b border-border/40 bg-secondary/10 flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground/80 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Raw Extraction
                </h3>
              </div>
              <div className="relative bg-background/50">
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                <pre className="text-[11px] text-muted-foreground/70 p-5 overflow-y-auto h-[600px] whitespace-pre-wrap font-mono leading-relaxed custom-scrollbar">
                  {'[Text extraction unavailable]'}
                </pre>
              </div>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}