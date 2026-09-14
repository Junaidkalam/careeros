import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listResumes, uploadResume, deleteResume, ResumeResponse } from '../lib/resumes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { AlertCircle, FileText, Upload, AlertTriangle, FileUp, Briefcase, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';

export default function Resumes() {
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [versionLabel, setVersionLabel] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [listError, setListError] = useState<string | null>(null);

  const fetchList = () => {
    setIsLoading(true);
    setListError(null);
    listResumes()
      .then(setResumes)
      .catch((err: any) => {
        console.error('fetchList error:', err);
        setListError(err?.detail || err?.error || err?.message || 'Failed to load resumes');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadResume(file, versionLabel || undefined);
      setIsUploadOpen(false);
      setFile(null);
      setVersionLabel('');
      fetchList();
    } catch (err: any) {
      setUploadError(err.detail || err.error || err.message || 'Upload failed');
    } finally {
        setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume? This will detach it from any connected applications.')) return;
    try {
      await deleteResume(id);
      fetchList();
    } catch (err: any) {
      setListError(err.detail || err.error || err.message || 'Failed to delete resume');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Resumes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your resumes and AI-parsed profiles.</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="w-4 h-4" /> Upload Resume
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Resume</DialogTitle>
              <DialogDescription>
                Upload your resume (.pdf or .docx). The AI will parse your profile automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-5 py-4">
              {uploadError && (
                <div className="text-sm text-destructive py-2 px-3 rounded-md bg-destructive/10 border border-destructive/20 flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {uploadError}
                </div>
              )}
              
              <div className="space-y-3">
                <Label htmlFor="resume-file">Resume File *</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="resume-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-secondary/20 hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-1 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PDF or DOCX</p>
                    </div>
                    <Input
                      id="resume-file"
                      type="file"
                      accept=".pdf,.docx"
                      required
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {file && (
                  <div className="text-sm text-primary font-medium flex items-center gap-2 bg-primary/5 p-2 rounded-md border border-primary/10">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{file.name}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version-label">Version Label (Optional)</Label>
                <Input
                  id="version-label"
                  placeholder="e.g. Java_Backend_v2"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!file || isUploading}>
                  {isUploading ? 'Uploading & Parsing...' : 'Upload'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {listError && (
        <div className="mb-4 text-sm text-destructive py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {listError}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">Loading resumes...</span>
          </div>
        </div>
      ) : listError ? null : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card/50 border border-dashed rounded-xl">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No resumes uploaded yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Upload your resume to let our AI automatically extract your skills, experience, and parse your profile.
          </p>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Upload Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map(r => (
            <Card 
              key={r.id} 
              className="flex flex-col cursor-pointer glass-panel border border-border/40 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group relative"
              onClick={() => navigate(`/resumes/${r.id}`)}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(r.id, e)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive h-8 w-8 z-10 rounded-md backdrop-blur-md bg-background/50 border border-border/50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start gap-4 mb-4 pr-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 text-primary rounded-xl shrink-0 flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-[15px] font-semibold text-foreground truncate group-hover:text-primary transition-colors" title={r.filename}>
                      {r.filename}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      {r.versionLabel && (
                        <Badge variant="secondary" className="font-bold text-[9px] uppercase tracking-wider bg-primary/10 text-primary border-0 rounded-sm px-1.5">
                          {r.versionLabel}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-muted-foreground/60 stat-number uppercase">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>

                {!r.profileGenerated ? (
                  <div className="mt-auto bg-destructive/5 border border-destructive/20 text-destructive text-xs p-3.5 rounded-xl flex gap-3 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold mb-1">AI Parsing Failed</strong>
                      <span className="opacity-90 leading-snug block">{r.warning || 'Could not extract text from this document.'}</span>
                    </div>
                  </div>
                ) : r.candidateProfile ? (
                  <div className="mt-auto space-y-4 pt-5 border-t border-border/40">
                    <div className="flex items-center justify-between gap-3 bg-secondary/20 p-2.5 rounded-lg border border-border/40">
                      {r.candidateProfile.primaryRole ? (
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground truncate">
                          <Briefcase className="w-4 h-4 text-primary/70 shrink-0" />
                          <span className="truncate">{r.candidateProfile.primaryRole}</span>
                        </div>
                      ) : (
                        <div className="text-[12px] text-muted-foreground italic">No role detected</div>
                      )}
                      {r.candidateProfile.experienceYears != null && (
                        <Badge variant="outline" className="text-[11px] font-bold tracking-widest uppercase bg-background/80 border-border/80 shrink-0">
                          {r.candidateProfile.experienceYears}y exp
                        </Badge>
                      )}
                    </div>
                    {r.candidateProfile.skills && r.candidateProfile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.candidateProfile.skills.slice(0, 5).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-secondary/60 text-secondary-foreground hover:bg-secondary/80 font-medium px-2 py-0.5 rounded-md border border-border/50 transition-colors">
                            {s.skillName}
                          </Badge>
                        ))}
                        {r.candidateProfile.skills.length > 5 && (
                          <span className="text-[10px] font-bold text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded-md border border-border/30 flex items-center">
                            +{r.candidateProfile.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}