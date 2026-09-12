import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResume, updateResumeProfile, ResumeResponse, CandidateSkill, SkillCategory } from '../lib/resumes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';

const CATEGORIES: SkillCategory[] = [
  'PROGRAMMING_LANGUAGE', 'FRAMEWORK', 'LIBRARY', 'DATABASE', 'CLOUD', 
  'DEVOPS', 'TESTING', 'TOOL', 'CONCEPT', 'SOFT_SKILL', 'DOMAIN_SPECIFIC'
];

export default function ResumeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<ResumeResponse | null>(null);
  
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

  useEffect(() => {
    if (!id) return;
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
      .catch(console.error);
  }, [id]);

  const handleSave = async () => {
    if (!id || !resume) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateResumeProfile(id, {
        summary: summary || null,
        primaryRole: role || null,
        education: education || null,
        experienceYears: years === '' ? null : Number(years),
        skills
      });
      setResume(updated);
      alert('Profile saved successfully');
    } catch (err: any) {
      setError(err.detail || err.error || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { skillName: newSkillName.trim(), category: newSkillCat }]);
    setNewSkillName('');
  };

  if (!resume) return <div className="p-10">Loading...</div>;

  return (
    <div className="max-w-[800px] pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => navigate('/resumes')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-display text-foreground font-normal">{resume.filename}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Uploaded {new Date(resume.createdAt).toLocaleString()} 
            {resume.versionLabel ? ` • ${resume.versionLabel}` : ''}
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isSaving || !resume.profileGenerated} className="gap-2">
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-[13px] text-destructive py-2 px-3 rounded-sm bg-destructive/10 border border-destructive/20">
          {error}
        </div>
      )}

      {!resume.profileGenerated ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-5 rounded-md">
          <h3 className="font-semibold mb-2">AI Parsing Failed</h3>
          <p className="text-[13px]">{resume.warning || 'No extractable text found.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role">Primary Role</Label>
              <Input id="role" value={role} onChange={e => setRole(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">Years of Experience</Label>
              <Input id="years" type="number" step="0.5" value={years} onChange={e => setYears(e.target.value ? Number(e.target.value) : '')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea id="summary" rows={5} value={summary} onChange={e => setSummary(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Education</Label>
            <Textarea id="education" rows={3} value={education} onChange={e => setEducation(e.target.value)} />
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <Label>Skills</Label>
            
            {/* Display Skills */}
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1 flex items-center bg-card border border-border">
                  <span className="text-[12px] font-normal">{s.skillName}</span>
                  <button onClick={() => removeSkill(i)} className="text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {skills.length === 0 && <span className="text-[13px] text-muted-foreground">No skills parsed.</span>}
            </div>

            {/* Add Skill */}
            <div className="flex items-center gap-2 max-w-md pt-2">
              <Input 
                placeholder="New skill..." 
                value={newSkillName} 
                onChange={e => setNewSkillName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                className="flex-1"
              />
              <select 
                className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newSkillCat}
                onChange={e => setNewSkillCat(e.target.value as SkillCategory)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}