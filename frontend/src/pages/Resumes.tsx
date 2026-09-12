import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listResumes, uploadResume, ResumeResponse } from '../lib/resumes';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { AlertCircle, FileText, Upload, AlertTriangle } from 'lucide-react';
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
        fetchList();
      }
  };

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display text-foreground font-normal">Resumes</h1>
        
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
            <form onSubmit={handleUpload} className="space-y-4 py-4">
              {uploadError && (
                <div className="text-[13px] text-destructive py-2 px-3 rounded-sm bg-destructive/10 border border-destructive/20">
                  {uploadError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="resume-file">Resume File</Label>
                <Input
                  id="resume-file"
                  type="file"
                  accept=".pdf,.docx"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer file:text-primary file:font-medium file:bg-primary/10 file:border-0 file:mr-4 file:px-3 file:py-1 file:rounded-sm hover:file:bg-primary/20"
                />
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
              <DialogFooter className="pt-4">
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
        <div className="mb-4 text-[13px] text-destructive py-2 px-3 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {listError}
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      ) : listError ? null : resumes.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-md border border-dashed border-border text-muted-foreground">
          No resumes uploaded yet. Upload one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map(r => (
            <Card 
              key={r.id} 
              className="p-5 flex flex-col cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/resumes/${r.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-foreground font-medium truncate">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{r.filename}</span>
                </div>
                {r.versionLabel && (
                  <Badge variant="secondary" className="font-normal text-[11px] shrink-0">
                    {r.versionLabel}
                  </Badge>
                )}
              </div>
              <div className="text-[12px] text-muted-foreground mb-4">
                Uploaded {new Date(r.createdAt).toLocaleDateString()}
              </div>

              {!r.profileGenerated ? (
                <div className="mt-auto bg-destructive/10 border border-destructive/20 text-destructive text-[12px] p-3 rounded-sm flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-medium">AI Parsing Failed</strong>
                    {r.warning || 'Could not extract text from this document.'}
                  </div>
                </div>
              ) : r.candidateProfile ? (
                <div className="mt-auto space-y-3 pt-3 border-t border-border">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {r.candidateProfile.primaryRole && (
                      <div className="text-[13px] font-medium text-foreground">
                        {r.candidateProfile.primaryRole}
                      </div>
                    )}
                    {r.candidateProfile.experienceYears != null && (
                      <div className="text-[12px] text-muted-foreground">
                        {r.candidateProfile.experienceYears} yrs exp
                      </div>
                    )}
                  </div>
                  {r.candidateProfile.skills && r.candidateProfile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.candidateProfile.skills.slice(0, 4).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-[11px] font-normal px-1.5 py-0">
                          {s.skillName}
                        </Badge>
                      ))}
                      {r.candidateProfile.skills.length > 4 && (
                        <span className="text-[11px] text-muted-foreground pl-1">
                          +{r.candidateProfile.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}