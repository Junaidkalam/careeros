import { useEffect, useState } from 'react';
import { listJobs, importJob, createJob, JobResponse, JobRequest } from '../lib/jobs';
import { ApiError } from '../lib/api';
import { Plus, X, AlertTriangle, Link as LinkIcon } from 'lucide-react';

/* --- */
const inputCls = "block w-full rounded-sm py-2 px-3 text-[14px] focus:outline-none";
const inputStyle = { background: '#FDFCFB', border: '1px solid #D6D3D1', transition: 'border-color 0.15s' };
const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.currentTarget.style.borderColor = '#0F766E');
const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.currentTarget.style.borderColor = '#D6D3D1');

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold tracking-wider uppercase text-stone-500 mb-1.5">
      {children}
    </label>
  );
}

/* --- */
function TagsInput({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onChange([...tags, input.trim()]);
      setInput('');
    }
  };
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center text-[12px] font-medium px-2 py-0.5 rounded-sm"
            style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4' }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter(t => t !== tag))}
              className="ml-1.5 text-teal-400 hover:text-teal-700"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          className={inputCls + " flex-1"}
          style={inputStyle}
          onFocus={handleFocus} onBlur={handleBlur}
          placeholder="Type and press Enter..."
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-2 text-[13px] font-medium text-stone-600 rounded-sm"
          style={{ border: '1px solid #D6D3D1', background: '#FDFCFB' }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* --- */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-20 text-center">
      <div
        className="text-[13px] text-stone-400 mb-4"
        style={{ fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}
      >
        No jobs saved yet.
      </div>
      <button
        onClick={onAdd}
        className="text-[13px] font-medium"
        style={{ color: '#0F766E' }}
      >
        + Add your first job
      </button>
    </div>
  );
}

/* --- */
export default function Jobs() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const fetchJobs = async () => {
    setLoadError(null);
    try { setJobs(await listJobs()); }
    catch (err: any) {
      console.error('fetchJobs error:', err);
      setLoadError(err?.detail || err?.error || err?.message || 'Failed to load jobs');
    }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchJobs(); }, []);

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

  /* --- */
  const cols = ['Role', 'Company', 'Location', 'Work Mode', 'Posted'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-[24px]"
          style={{ fontFamily: '"DM Serif Display", Georgia, serif', color: '#1C1917', fontWeight: 400 }}
        >
          Jobs
        </h1>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: '#0F766E' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Job
        </button>
      </div>

      {/* Table */}
      {loadError && (
        <div
          className="mb-4 text-[13px] text-red-700 py-2 px-3 rounded-sm flex items-center gap-2"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {loadError}
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="animate-spin rounded-full h-5 w-5 border-2 border-transparent"
            style={{ borderTopColor: '#0F766E', borderRightColor: '#0F766E' }}
          />
        </div>
      ) : loadError ? null : jobs.length === 0 ? (
        <EmptyState onAdd={openModal} />
      ) : (
        <div style={{ borderTop: '1px solid #D6D3D1', borderBottom: '1px solid #D6D3D1' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #D6D3D1' }}>
                {cols.map(c => (
                  <th
                    key={c}
                    className="px-4 py-3 text-left text-[13px] font-medium"
                    style={{ color: '#78716C' }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => (
                <tr
                  key={job.id}
                  style={{
                    background: idx % 2 === 1 ? '#FAFAF9' : 'transparent',
                    borderBottom: '1px solid #E7E5E4',
                  }}
                >
                  <td className="px-4 py-3 text-[14px] font-medium" style={{ color: '#1C1917' }}>
                    {job.title}
                  </td>
                  <td className="px-4 py-3 text-[14px]" style={{ color: '#44403C' }}>
                    {job.companyName}
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#78716C' }}>
                    {job.location || '--'}
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ color: '#78716C' }}>
                    {job.workMode || '--'}
                  </td>
                  <td className="px-4 py-3 text-[13px] stat-number" style={{ color: '#78716C' }}>
                    {job.postedDate || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(28,25,23,0.5)' }}
        >
          <div
            className="w-full max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: 640, background: '#FDFCFB', borderRadius: 4, border: '1px solid #D6D3D1' }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{ background: '#FDFCFB', borderBottom: '1px solid #D6D3D1', zIndex: 10 }}
            >
              <h2
                className="text-[18px]"
                style={{ fontFamily: '"DM Serif Display", Georgia, serif', color: '#1C1917', fontWeight: 400 }}
              >
                Add New Job
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Import section */}
              <div
                className="p-4 rounded-sm"
                style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}
              >
                <div className="text-[12px] font-semibold tracking-wider uppercase text-teal-700 mb-2">
                  Import from URL (Optional)
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="url"
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://boards.greenhouse.io/..."
                      className={inputCls + " pl-9"}
                      style={{ ...inputStyle, background: '#FDFCFB' }}
                      onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importUrl || isImporting}
                    className="px-4 py-2 text-[13px] font-medium text-white rounded-sm disabled:opacity-50"
                    style={{ background: '#0F766E' }}
                  >
                    {isImporting ? 'Importing...' : 'Import'}
                  </button>
                </div>
                {importError && (
                  <p className="mt-2 text-[12px] text-red-700 flex items-start gap-1 break-words">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {importError}
                  </p>
                )}
                {importWarning && (
                  <p className="mt-2 text-[12px] flex items-start gap-1 text-orange-600 break-words">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {importWarning}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: '1px solid #D6D3D1' }} />
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="px-3 text-[12px] text-stone-400"
                    style={{ background: '#FDFCFB' }}
                  >
                    Review & Save
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-4">
                {saveError && (
                  <div
                    className="text-[13px] text-red-700 py-2 px-3 rounded-sm bg-red-50"
                    style={{ border: '1px solid #FECACA' }}
                  >
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Job Title *</FieldLabel>
                    <input required type="text" value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <FieldLabel>Company Name *</FieldLabel>
                    <input required type="text" value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>URL</FieldLabel>
                    <input type="url" value={formData.postingUrl || ''}
                      onChange={e => setFormData({ ...formData, postingUrl: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <FieldLabel>Location</FieldLabel>
                    <input type="text" value={formData.location || ''}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <FieldLabel>Work Mode</FieldLabel>
                    <input type="text" value={formData.workMode || ''} placeholder="Remote, Hybrid..."
                      onChange={e => setFormData({ ...formData, workMode: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <FieldLabel>Employment Type</FieldLabel>
                    <input type="text" value={formData.employmentType || ''} placeholder="FULL_TIME..."
                      onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <FieldLabel>Base Salary</FieldLabel>
                    <input type="text" value={formData.salaryRange || ''} placeholder="$100k - $130k"
                      onChange={e => setFormData({ ...formData, salaryRange: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <FieldLabel>Posted Date</FieldLabel>
                    <input type="text" value={formData.postedDate || ''} placeholder="YYYY-MM-DD"
                      onChange={e => setFormData({ ...formData, postedDate: e.target.value })}
                      className={inputCls} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    rows={4} value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className={inputCls} style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>

                <TagsInput label="Required Skills"
                  tags={formData.requiredSkills || []}
                  onChange={tags => setFormData({ ...formData, requiredSkills: tags })}
                />
                <TagsInput label="Preferred Skills"
                  tags={formData.preferredSkills || []}
                  onChange={tags => setFormData({ ...formData, preferredSkills: tags })}
                />

                {/* Footer */}
                <div
                  className="pt-4 flex justify-end gap-3"
                  style={{ borderTop: '1px solid #D6D3D1' }}
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-[13px] font-medium text-stone-600 rounded-sm"
                    style={{ border: '1px solid #D6D3D1', background: '#FDFCFB' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-[13px] font-medium text-white rounded-sm disabled:opacity-50"
                    style={{ background: '#0F766E' }}
                  >
                    {isSaving ? 'Saving...' : 'Save Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}