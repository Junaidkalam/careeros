import re

with open('src/pages/Resumes.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """      try {
        await uploadResume(file, versionLabel || undefined);
        setIsUploadOpen(false);
        setFile(null);
        setVersionLabel('');
        fetchList();
      } catch (err: any) {
        setUploadError(err.detail || err.error || err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
      }"""

new_code = """      try {
        await uploadResume(file, versionLabel || undefined);
        setIsUploadOpen(false);
        setFile(null);
        setVersionLabel('');
      } catch (err: any) {
        setUploadError(err.detail || err.error || err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
        fetchList();
      }"""

content = content.replace(old_code, new_code)

with open('src/pages/Resumes.tsx', 'w', encoding='utf-8') as f:
    f.write(content)